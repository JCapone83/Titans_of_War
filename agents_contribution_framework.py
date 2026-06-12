"""DEPRECATED — kept only as an import shim for legacy contribution scripts.

New code should import directly from ``tools.agents``::

    from tools.agents import AgentContributor, ContributionRegistry

This module re-exports the same names and emits a DeprecationWarning on
import so the next pass can delete it entirely. The ``GamePhase`` enum was
never wired to any caller and is preserved here only to avoid breaking
older agent scripts that may still reference it.
"""

import warnings
from enum import Enum

from tools.agents import AgentContributor, ContributionRegistry

warnings.warn(
    "agents_contribution_framework is deprecated. Import from tools.agents instead.",
    DeprecationWarning,
    stacklevel=2,
)


class GamePhase(Enum):
    EARLY = "early"
    MID = "mid"
    LATE = "late"


__all__ = ["AgentContributor", "ContributionRegistry", "GamePhase"]
