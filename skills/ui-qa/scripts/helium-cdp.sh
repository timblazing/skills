#!/usr/bin/env bash
# Print the CDP WebSocket URL of the user's running Helium browser.
# Requires remote debugging enabled once in Helium: chrome://inspect/#remote-debugging
# Usage: agent-browser --session helium --cdp "$(helium-cdp.sh)" tab list
set -euo pipefail

dir="$HOME/Library/Application Support/net.imput.helium"
port_file="$dir/DevToolsActivePort"

if ! pgrep -xq Helium; then
  echo "Helium is not running. Ask the user to open Helium." >&2
  exit 1
fi
if [[ ! -f "$port_file" ]]; then
  cat >&2 <<'MSG'
Helium remote debugging is off. Ask the user to:
  1. Open chrome://inspect/#remote-debugging in Helium
  2. Turn on "Allow remote debugging for this browser instance"
Then re-run this script.
MSG
  exit 1
fi

port="$(sed -n 1p "$port_file")"
path="$(sed -n 2p "$port_file")"
echo "ws://127.0.0.1:${port}${path}"
