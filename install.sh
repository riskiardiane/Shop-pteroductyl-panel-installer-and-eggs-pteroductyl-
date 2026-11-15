#!/bin/bash

set -e -o pipefail

######################################################################################
#                                                                                    #
# RizzDevs Panel Installer — one-line bootstrap.                                     #
#                                                                                    #
#   bash <(curl -sSL https://raw.githubusercontent.com/riskiardiane/Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-/main/install.sh)
#                                                                                    #
# Installs AURORA 2.0 (RizzDevs panel), Wings and the bundled 274-egg collection.    #
#                                                                                    #
# Copyright (C) 2026, RizzDevs <noreply@panel.exions.web.id>                         #
# Based on 'pterodactyl-installer' (https://github.com/pterodactyl-installer/         #
# pterodactyl-installer), Copyright (C) 2018 - 2026 Vilhelm Prytz and contributors.   #
#                                                                                    #
# This program is free software: you can redistribute it and/or modify it under the   #
# terms of the GNU General Public License as published by the Free Software          #
# Foundation, either version 3 of the License, or (at your option) any later version. #
# See LICENSE for the full text.                                                     #
######################################################################################

export GITHUB_SOURCE="${GITHUB_SOURCE:-main}"
export SCRIPT_RELEASE="${SCRIPT_RELEASE:-v2.0.0}"
export RIZZDEVS_RAW_URL="${RIZZDEVS_RAW_URL:-https://raw.githubusercontent.com/riskiardiane/Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-/${GITHUB_SOURCE}}"
export LOG_PATH="${LOG_PATH:-/var/log/rizzdevs-installer.log}"
export DEBIAN_FRONTEND=noninteractive

if ! command -v curl >/dev/null 2>&1; then
  echo "* curl is required in order for this script to work."
  echo "* install it with: apt-get update && apt-get install -y curl"
  exit 1
fi

# When executed from inside a cloned repository, use the local copy of lib/.
# Otherwise fetch lib/lib.sh from the repository.
if [ -f "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/lib.sh" ]; then
  # shellcheck disable=SC1090
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/lib.sh"
else
  rm -f /tmp/lib.sh
  curl -fsSL -o /tmp/lib.sh "$RIZZDEVS_RAW_URL/lib/lib.sh"
  # shellcheck disable=SC1091
  source /tmp/lib.sh
fi

export RIZZDEVS_PANEL_SRC="${RIZZDEVS_PANEL_SRC:-}"
export RIZZDEVS_EGGS_SRC="${RIZZDEVS_EGGS_SRC:-}"

# If we are running from a checkout, default to using it.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$REPO_ROOT/panel" ] && [ -z "$RIZZDEVS_PANEL_SRC" ]; then
  export RIZZDEVS_PANEL_SRC="$REPO_ROOT/panel"
fi
if [ -d "$REPO_ROOT/eggs" ] && [ -z "$RIZZDEVS_EGGS_SRC" ]; then
  export RIZZDEVS_EGGS_SRC="$REPO_ROOT/eggs"
fi

check_root
check_supported_os

execute() {
  local target="$1"
  local log_line
  log_line="* rizzdevs-installer $(date) — target: $target"
  echo -e "\n\n$log_line\n\n" >> "$LOG_PATH"

  case "$target" in
    panel)
      # shellcheck disable=SC1090
      source "$REPO_ROOT/installers/panel.sh" 2>/dev/null || source <(curl -fsSL "$RIZZDEVS_RAW_URL/installers/panel.sh")
      ;;
    wings)
      # shellcheck disable=SC1090
      source "$REPO_ROOT/installers/wings.sh" 2>/dev/null || source <(curl -fsSL "$RIZZDEVS_RAW_URL/installers/wings.sh")
      ;;
  esac
}

welcome

done=false
while [ "$done" == false ]; do
  options=(
    "Install the AURORA 2.0 Panel (fresh machine)"
    "Install Wings on a game node"
    "Install Panel and Wings on the same machine (panel first, then wings)"
    "Uninstall Panel or Wings"
  )
  actions=(
    "panel"
    "wings"
    "panel+wings"
    "uninstall"
  )

  output "What would you like to do?"
  for i in "${!options[@]}"; do
    output "[$i] ${options[$i]}"
  done

  echo -n "* Input 0-$((${#actions[@]} - 1)): "
  read -r action

  [ -z "$action" ] && error "Input is required" && continue

  if [[ ! "$action" =~ ^[0-9]$ ]] || (( action >= ${#actions[@]} )); then
    error "Invalid option"
    continue
  fi
  done=true

  case "${actions[$action]}" in
    panel+wings)
      execute panel
      execute wings
      ;;
    uninstall)
      echo -n "* Uninstall which component? (panel/wings/all): "
      read -r what
      echo -n "* Purge data directories? Type '--purge' to confirm, anything else to keep data: "
      read -r purge
      args=()
      [ "$purge" == "--purge" ] && args+=("--purge")
      # shellcheck disable=SC1090
      source "$REPO_ROOT/installers/uninstall.sh" "$what" "${args[@]}" 2>/dev/null \
        || source <(curl -fsSL "$RIZZDEVS_RAW_URL/installers/uninstall.sh") "$what" "${args[@]}"
      ;;
    *)
      execute "${actions[$action]}"
      ;;
  esac
done

rm -f /tmp/lib.sh
