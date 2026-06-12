#!/usr/bin/env python3
"""Local agent review dashboard for Titans of War."""

from __future__ import annotations

import argparse
import json
import os
from collections import Counter, defaultdict
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from .schemas import CONTRIBUTION_ROOT, STATUS_DIRS, utc_timestamp
from .social_science_rubric import RUBRIC_NAME, rubric_blockers, rubric_warnings
from .validators import validate_proposal


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PORT = 4177
VISIBLE_STATUSES = ("submitted", "approved", "rejected", "integrated")


def clamp(value: int, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, value))


def quality_grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def read_json(path: Path, default: Any):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def proposal_summary(proposal: dict[str, Any]) -> str:
    content = proposal.get("content", {})
    for key in ("scenario_id", "target_scenario_id", "asset_name", "title"):
        value = content.get(key)
        if value:
            return str(value)
    return proposal.get("proposal_id", "unknown")


def load_proposals() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for status in STATUS_DIRS:
        status_dir = CONTRIBUTION_ROOT / status
        if not status_dir.exists():
            continue
        for path in sorted(status_dir.glob("*.json")):
            data = read_json(path, [])
            if not isinstance(data, list):
                continue
            for proposal in data:
                proposal = dict(proposal)
                proposal["_source_file"] = str(path)
                proposal["_source_status"] = status
                items.append(proposal)
    return items


def load_render_requests() -> dict[str, list[dict[str, Any]]]:
    requests: dict[str, list[dict[str, Any]]] = {}
    render_dir = REPO_ROOT / "render_requests"
    if not render_dir.exists():
        return requests
    for path in sorted(render_dir.glob("*.json")):
        data = read_json(path, [])
        if isinstance(data, list):
            requests[path.name] = data
    return requests


def compute_quality(proposal: dict[str, Any]) -> dict[str, Any]:
    errors = validate_proposal(proposal, REPO_ROOT)
    warnings = rubric_warnings(proposal)
    blockers = rubric_blockers(proposal)
    content = proposal.get("content", {})
    score = 100
    score -= min(60, len(errors) * 12)
    score -= min(18, len(warnings) * 6)
    # A presentism blocker collapses the score regardless of other quality.
    score -= 40 * len(blockers)

    if proposal.get("is_valid"):
        score += 5

    proposal_type = proposal.get("type")
    if proposal_type == "scenario_stage":
        choices = content.get("choices", [])
        if isinstance(choices, list) and 2 <= len(choices) <= 4:
            score += 8
        proposers = {choice.get("proposer") for choice in choices if isinstance(choice, dict)}
        if {"hotspur", "fox", "wolf"}.issubset(proposers):
            score += 5
        if content.get("branches"):
            score += 4
    elif proposal_type == "scenario_revision":
        score += 8 if not errors else -6
    elif proposal_type == "asset_request":
        rendering = content.get("rendering", {})
        prompt = rendering.get("prompt", "")
        if len(prompt) >= 120:
            score += 6
        if rendering.get("preferred_backend") == "manual":
            score += 5
        if rendering.get("aspect_ratio") == "16:9":
            score += 2
    elif proposal_type == "mechanic_upgrade":
        systems = content.get("affected_systems", [])
        if isinstance(systems, list) and systems:
            score += min(6, len(systems) * 2)
    elif proposal_type == "advisor_voice":
        score += 6 if not errors else 0

    score = clamp(score)
    notes: list[str] = []
    if errors:
        notes.extend(errors)
    else:
        notes.append("No validation errors.")
    if warnings:
        notes.extend(f"{RUBRIC_NAME}: {warning}" for warning in warnings)
    else:
        notes.append(f"{RUBRIC_NAME}: no rubric warnings.")
    if proposal.get("status") in {"approved", "integrated"} and proposal.get("is_valid"):
        notes.append("Ready for integration review.")
    if proposal.get("status") == "submitted":
        notes.append("Awaiting approval.")
    if proposal_type == "asset_request":
        render_key = content.get("asset_name")
        if render_key:
            notes.append(f"Asset request: {render_key}.")

    if blockers:
        notes.extend(f"{RUBRIC_NAME} BLOCKER: {blocker}" for blocker in blockers)

    return {
        "score": score,
        "grade": quality_grade(score),
        "errors": errors,
        "rubric_warnings": warnings,
        "rubric_blockers": blockers,
        "notes": notes,
        # Expose the per-step deductions so reviewers can audit the score
        # rather than treat it as a black box.
        "score_breakdown": {
            "starting": 100,
            "validation_penalty": -min(60, len(errors) * 12),
            "warning_penalty": -min(18, len(warnings) * 6),
            "blocker_penalty": -40 * len(blockers),
        },
    }


def index_payload() -> dict[str, Any]:
    proposals = load_proposals()
    render_requests = load_render_requests()
    by_status = Counter(proposal["status"] for proposal in proposals)
    by_type = Counter(proposal["type"] for proposal in proposals)
    reviewed = [proposal for proposal in proposals if proposal["status"] in {"approved", "integrated"}]
    quality_rollup = defaultdict(int)
    enriched: list[dict[str, Any]] = []

    for proposal in proposals:
        quality = compute_quality(proposal)
        quality_rollup[quality["grade"]] += 1
        enriched.append(
            {
                **proposal,
                "summary": proposal_summary(proposal),
                "quality": quality,
                "render_queued": proposal.get("type") == "asset_request"
                and any(
                    proposal_summary(proposal) in {req.get("asset_name") for req in requests}
                    for requests in render_requests.values()
                ),
            }
        )

    enriched.sort(key=lambda proposal: (proposal.get("status", ""), proposal.get("created_at", "")))
    return {
        "proposals": enriched,
        "render_requests": render_requests,
        "summary": {
            "total": len(proposals),
            "by_status": dict(by_status),
            "by_type": dict(by_type),
            "reviewed": len(reviewed),
            "quality_rollup": dict(quality_rollup),
        },
    }


def locate_proposal(proposal_id: str) -> tuple[dict[str, Any] | None, Path | None]:
    for status in STATUS_DIRS:
        status_dir = CONTRIBUTION_ROOT / status
        if not status_dir.exists():
            continue
        for path in sorted(status_dir.glob("*.json")):
            data = read_json(path, [])
            if not isinstance(data, list):
                continue
            for proposal in data:
                if proposal.get("proposal_id") == proposal_id:
                    return proposal, path
    return None, None


def save_proposal(proposal: dict[str, Any], source_path: Path | None, target_status: str) -> None:
    if source_path is not None and source_path.exists():
        source_data = read_json(source_path, [])
        source_data = [item for item in source_data if item.get("proposal_id") != proposal["proposal_id"]]
        write_json(source_path, source_data)

    target_path = CONTRIBUTION_ROOT / target_status / f"{proposal['agent']}.json"
    target_data = read_json(target_path, [])
    if not isinstance(target_data, list):
        target_data = []
    target_data = [item for item in target_data if item.get("proposal_id") != proposal["proposal_id"]]
    proposal = dict(proposal)
    proposal["status"] = target_status
    proposal[f"{target_status}_at"] = _timestamp()
    target_data.append(proposal)
    write_json(target_path, target_data)


def _timestamp() -> str:
    return utc_timestamp()


def update_proposal(proposal_id: str, target_status: str, note: str = "") -> dict[str, Any]:
    proposal, source_path = locate_proposal(proposal_id)
    if proposal is None:
        raise KeyError(proposal_id)

    if target_status == "approved" and not proposal.get("is_valid", False):
        raise ValueError("Only valid proposals can be approved.")
    if target_status == "integrated" and proposal.get("status") not in {"approved", "integrated"}:
        raise ValueError("Integrations should come from approved proposals.")

    proposal = dict(proposal)
    if note:
        proposal["review_note"] = note
    if target_status == "rejected":
        proposal["rejection_note"] = note
    save_proposal(proposal, source_path, target_status)
    return proposal


def html_page() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Titans Forge Agent Review</title>
  <style>
    :root {
      --bg: #0d1117;
      --panel: #111826;
      --panel-2: #0f1621;
      --line: rgba(148, 163, 184, 0.18);
      --text: #e5e7eb;
      --muted: #94a3b8;
      --accent: #d4af37;
      --good: #22c55e;
      --warn: #f59e0b;
      --bad: #ef4444;
      --blue: #60a5fa;
      --radius: 10px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(212,175,55,0.08), transparent 28%),
        radial-gradient(circle at top right, rgba(96,165,250,0.08), transparent 24%),
        var(--bg);
      color: var(--text);
      font-family: var(--sans);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: rgba(13,17,23,0.94);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--line);
      padding: 1rem 1.25rem;
    }
    .title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }
    h1 {
      margin: 0;
      font-size: 1.1rem;
      letter-spacing: 0.02em;
    }
    .subtle {
      color: var(--muted);
      font-size: 0.82rem;
    }
    main { padding: 1rem 1.25rem 2rem; max-width: 1600px; margin: 0 auto; }
    .summary {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.9rem;
    }
    .card, .panel {
      background: linear-gradient(180deg, rgba(17,24,38,0.98), rgba(15,22,33,0.98));
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
    }
    .card { padding: 0.8rem 0.9rem; }
    .kpi { font-size: 1.3rem; font-weight: 700; margin-top: 0.35rem; }
    .kpi-label { color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .layout {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 0.9rem;
      align-items: start;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.7rem 0 0.9rem;
    }
    button, .chip {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.03);
      color: var(--text);
      border-radius: 999px;
      padding: 0.5rem 0.75rem;
      font: inherit;
      cursor: pointer;
    }
    button:hover { border-color: rgba(212,175,55,0.45); }
    button.primary { background: rgba(212,175,55,0.16); border-color: rgba(212,175,55,0.4); }
    button.good { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.3); }
    button.bad { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); }
    button.blue { background: rgba(96,165,250,0.12); border-color: rgba(96,165,250,0.3); }
    .proposals {
      display: grid;
      gap: 0.7rem;
    }
    .proposal {
      padding: 0.85rem;
      border-radius: var(--radius);
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.025);
    }
    .proposal.active { border-color: rgba(212,175,55,0.45); box-shadow: inset 0 0 0 1px rgba(212,175,55,0.08); }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 0.8rem;
      align-items: flex-start;
    }
    .mono { font-family: var(--mono); }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.24rem 0.55rem;
      border-radius: 999px;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: 1px solid var(--line);
    }
    .status.submitted { color: var(--accent); }
    .status.approved { color: var(--good); }
    .status.rejected { color: var(--bad); }
    .status.integrated { color: var(--blue); }
    .meta { color: var(--muted); font-size: 0.78rem; margin-top: 0.2rem; }
    .score {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.6rem;
      margin-top: 0.7rem;
    }
    .scorebox {
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: rgba(255,255,255,0.025);
    }
    .scorebox .v { font-weight: 700; font-size: 1.05rem; }
    .details {
      position: sticky;
      top: 5.2rem;
      padding: 0.9rem;
    }
    .detail-title { margin: 0 0 0.4rem; font-size: 1rem; }
    .detail-section {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--line);
    }
    .detail-section h3 {
      margin: 0 0 0.45rem;
      font-size: 0.75rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    ul { margin: 0.35rem 0 0 1rem; padding: 0; color: var(--text); }
    .empty { color: var(--muted); font-size: 0.85rem; }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--mono);
      font-size: 0.77rem;
      color: #cbd5e1;
    }
    @media (max-width: 1100px) {
      .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .layout { grid-template-columns: 1fr; }
      .details { position: static; }
    }
  </style>
</head>
<body>
  <header>
    <div class="title">
      <h1>Titans Forge Agent Review</h1>
      <div class="subtle">Review, approve, reject, and inspect quality before integration.</div>
    </div>
    <div class="toolbar">
      <button class="primary" onclick="reloadData()">Refresh</button>
      <button class="blue" onclick="setFilter('submitted')">Submitted</button>
      <button class="blue" onclick="setFilter('approved')">Approved</button>
      <button class="blue" onclick="setFilter('integrated')">Integrated</button>
      <button class="blue" onclick="setFilter('rejected')">Rejected</button>
      <button class="blue" onclick="setFilter('all')">All</button>
    </div>
  </header>
  <main>
    <section class="summary" id="summary"></section>
    <section class="layout">
      <div class="panel">
        <div style="padding: 0.9rem 0.9rem 0.25rem; display:flex; justify-content:space-between; align-items:center; gap:0.8rem;">
          <div>
            <div class="subtle">Queue</div>
            <div style="font-weight:700">Agent submissions and decisions</div>
          </div>
          <div class="subtle mono" id="countLabel"></div>
        </div>
        <div class="proposals" id="proposals" style="padding:0.9rem;"></div>
      </div>
      <div class="panel details" id="details">
        <div class="subtle">Selected proposal</div>
        <h2 class="detail-title" id="detailTitle">Choose an item</h2>
        <div id="detailBody" class="empty">Select a proposal to inspect the content, validation notes, and quality score.</div>
      </div>
    </section>
  </main>
  <script>
    const state = { data: null, filter: 'submitted', selected: null };

    function statusClass(status) {
      return ['submitted','approved','rejected','integrated'].includes(status) ? status : 'submitted';
    }

    function qualityBand(score) {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Strong';
      if (score >= 70) return 'Solid';
      if (score >= 60) return 'Borderline';
      return 'Weak';
    }

    function proposalLabel(item) {
      return item.summary || item.proposal_id;
    }

    function renderSummary() {
      const el = document.getElementById('summary');
      const summary = state.data.summary;
      const order = [
        ['Total', summary.total],
        ['Submitted', summary.by_status.submitted || 0],
        ['Approved', summary.by_status.approved || 0],
        ['Integrated', summary.by_status.integrated || 0],
        ['Quality A/B', (summary.quality_rollup.A || 0) + (summary.quality_rollup.B || 0)],
      ];
      el.innerHTML = order.map(([label, value]) => `
        <div class="card">
          <div class="kpi-label">${label}</div>
          <div class="kpi">${value}</div>
        </div>
      `).join('');
    }

    function currentItems() {
      return state.data.proposals.filter((p) => state.filter === 'all' ? true : p.status === state.filter);
    }

    function renderQueue() {
      const items = currentItems();
      document.getElementById('countLabel').textContent = `${items.length} shown / ${state.data.proposals.length} total`;
      const el = document.getElementById('proposals');
      el.innerHTML = items.map((item) => {
        const q = item.quality;
        return `
          <article class="proposal ${state.selected && state.selected.proposal_id === item.proposal_id ? 'active' : ''}" data-id="${item.proposal_id}">
            <div class="row">
              <div>
                <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">
                  <span class="status ${statusClass(item.status)}">${item.status}</span>
                  <span class="chip mono">${item.type}</span>
                  <span class="chip mono">${item.agent}</span>
                </div>
                <div style="margin-top:0.45rem; font-weight:700">${proposalLabel(item)}</div>
                <div class="meta mono">${item.proposal_id}</div>
              </div>
              <div style="text-align:right">
                <div class="kpi-label">Quality</div>
                <div class="kpi" style="font-size:1.05rem">${q.score} ${q.grade}</div>
              </div>
            </div>
            <div class="score">
              <div class="scorebox"><div class="kpi-label">Band</div><div class="v">${qualityBand(q.score)}</div></div>
              <div class="scorebox"><div class="kpi-label">Errors</div><div class="v">${q.errors.length}</div></div>
              <div class="scorebox"><div class="kpi-label">Render</div><div class="v">${item.render_queued ? 'Queued' : 'No'}</div></div>
            </div>
            <div class="toolbar" style="margin:0.7rem 0 0;">
              <button class="good" onclick="event.stopPropagation(); approve('${item.proposal_id}')">Approve</button>
              <button class="blue" onclick="event.stopPropagation(); integrate('${item.proposal_id}')">Integrate</button>
              <button class="bad" onclick="event.stopPropagation(); reject('${item.proposal_id}')">Reject</button>
            </div>
          </article>
        `;
      }).join('') || '<div class="empty">No proposals match this filter.</div>';

      el.querySelectorAll('.proposal').forEach((node) => {
        node.addEventListener('click', () => {
          const item = state.data.proposals.find((p) => p.proposal_id === node.dataset.id);
          state.selected = item;
          renderDetails();
          renderQueue();
        });
      });
    }

    function renderDetails() {
      const title = document.getElementById('detailTitle');
      const body = document.getElementById('detailBody');
      const item = state.selected;
      if (!item) {
        title.textContent = 'Choose an item';
        body.className = 'empty';
        body.textContent = 'Select a proposal to inspect the content, validation notes, and quality score.';
        return;
      }
      const q = item.quality;
      title.textContent = proposalLabel(item);
      body.className = '';
      body.innerHTML = `
        <div style="display:flex; gap:0.45rem; flex-wrap:wrap; margin-bottom:0.7rem;">
          <span class="status ${statusClass(item.status)}">${item.status}</span>
          <span class="chip mono">${item.type}</span>
          <span class="chip mono">Quality ${q.score}/${q.grade}</span>
        </div>
        <div class="subtle mono">${item.proposal_id}</div>
        <div class="detail-section">
          <h3>Quality Notes</h3>
          ${q.notes.length ? '<ul>' + q.notes.map((note) => `<li>${note}</li>`).join('') + '</ul>' : '<div class="empty">No notes.</div>'}
        </div>
        <div class="detail-section">
          <h3>Validation Errors</h3>
          ${q.errors.length ? '<ul>' + q.errors.map((note) => `<li>${note}</li>`).join('') + '</ul>' : '<div class="empty">No validation errors.</div>'}
        </div>
        <div class="detail-section">
          <h3>Content</h3>
          <pre>${escapeHtml(JSON.stringify(item.content, null, 2))}</pre>
        </div>
      `;
    }

    function escapeHtml(text) {
      return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    }

    function setFilter(filter) {
      state.filter = filter;
      renderQueue();
    }

    async function postJson(path, payload) {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      return response.json();
    }

    async function approve(id) {
      const note = prompt('Approval note (optional):', '');
      await postJson('/api/approve', { proposal_id: id, note: note || '' });
      await reloadData(id);
    }

    async function integrate(id) {
      const note = prompt('Integration note (optional):', '');
      await postJson('/api/integrate', { proposal_id: id, note: note || '' });
      await reloadData(id);
    }

    async function reject(id) {
      const note = prompt('Rejection note:', 'Needs revision');
      if (note === null) return;
      await postJson('/api/reject', { proposal_id: id, note });
      await reloadData(id);
    }

    async function reloadData(selectedId = null) {
      const response = await fetch('/api/state');
      state.data = await response.json();
      renderSummary();
      state.selected = selectedId ? state.data.proposals.find((p) => p.proposal_id === selectedId) : state.selected;
      if (state.selected && !state.data.proposals.find((p) => p.proposal_id === state.selected.proposal_id)) {
        state.selected = null;
      }
      renderQueue();
      renderDetails();
    }

    window.setFilter = setFilter;
    window.reloadData = () => reloadData();
    window.approve = approve;
    window.integrate = integrate;
    window.reject = reject;

    reloadData();
  </script>
</body>
</html>
"""


class DashboardHandler(BaseHTTPRequestHandler):
    def _send(self, code: int, payload: Any, content_type: str = "application/json") -> None:
        body = payload if isinstance(payload, (bytes, bytearray)) else (
            payload.encode("utf-8") if isinstance(payload, str) else json.dumps(payload, indent=2).encode("utf-8")
        )
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self._send(200, html_page(), "text/html; charset=utf-8")
            return
        if parsed.path == "/api/state":
            self._send(200, index_payload())
            return
        if parsed.path == "/api/health":
            self._send(200, {"ok": True})
            return
        self._send(404, {"error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        try:
            payload = json.loads(raw or "{}")
        except json.JSONDecodeError:
            payload = {}

        try:
            if parsed.path == "/api/approve":
                proposal = update_proposal(str(payload["proposal_id"]), "approved", str(payload.get("note", "")))
                self._send(200, {"ok": True, "proposal": proposal})
                return
            if parsed.path == "/api/reject":
                proposal = update_proposal(str(payload["proposal_id"]), "rejected", str(payload.get("note", "")))
                self._send(200, {"ok": True, "proposal": proposal})
                return
            if parsed.path == "/api/integrate":
                proposal = update_proposal(str(payload["proposal_id"]), "integrated", str(payload.get("note", "")))
                self._send(200, {"ok": True, "proposal": proposal})
                return
            self._send(404, {"error": "Unknown action"})
        except Exception as exc:  # pragma: no cover - surfaced in UI
            self._send(400, {"error": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="Titans of War agent dashboard server.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()

    CONTRIBUTION_ROOT.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), DashboardHandler)
    print(f"Agent dashboard listening on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
