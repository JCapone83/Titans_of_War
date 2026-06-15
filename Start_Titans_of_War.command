#!/bin/zsh

set -e

cd "$(dirname "$0")"

echo "Titans of War launcher"
echo "Working folder: $(pwd)"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run Titans of War."
  echo "Install the current LTS version from https://nodejs.org/ and run this launcher again."
  open "https://nodejs.org/" >/dev/null 2>&1 || true
  echo
  printf "Press Return to close this window."
  read
  exit 1
fi

NODE_MAJOR=$(node -p "Number(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20 or newer is required. Current version: $(node --version)"
  echo "Install the current LTS version from https://nodejs.org/ and run this launcher again."
  open "https://nodejs.org/" >/dev/null 2>&1 || true
  echo
  printf "Press Return to close this window."
  read
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found. Reinstall Node.js from https://nodejs.org/."
  echo
  printf "Press Return to close this window."
  read
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies. This can take a minute on first run."
  npm install
  echo
fi

echo "Starting Titans of War. Your browser should open automatically."
npm start
