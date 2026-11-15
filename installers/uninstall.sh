#!/bin/bash

set -e -o pipefail

######################################################################################
#                                                                                    #
# RizzDevs Panel Installer — uninstall Panel and/or Wings.                           #
#                                                                                    #
# Copyright (C) 2026, RizzDevs <noreply@panel.exions.web.id>                         #
# Based on 'pterodactyl-installer' (https://github.com/pterodactyl-installer/         #
# pterodactyl-installer), Copyright (C) 2018 - 2026 Vilhelm Prytz and contributors.   #
######################################################################################

fn_exists() { declare -F "$1" >/dev/null; }
if ! fn_exists lib_loaded; then
  # shellcheck source=../lib/lib.sh
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../lib" && pwd)/lib.sh" 2>/dev/null \
    || source /tmp/lib.sh \
    || source <(curl -fsSL "$RIZZDEVS_RAW_URL"/lib/lib.sh)
  ! fn_exists lib_loaded && echo "* ERROR: Could not load lib script" && exit 1
fi

TARGET="${1:-}"
PURGE="${2:-}"

uninstall_panel() {
  output "Removing AURORA 2.0 Panel.."

  ( crontab -l 2>/dev/null | grep -v -F "artisan schedule:run" || true ) | crontab -

  rm -f /etc/nginx/sites-enabled/pterodactyl.conf /etc/nginx/sites-available/pterodactyl.conf
  systemctl restart nginx || true

  rm -rf /var/www/pterodactyl
  rm -f /usr/local/bin/composer || true

  if [ "$PURGE" == "--purge" ]; then
    warning "Dropping the panel database and user is NOT done automatically."
    warning "If you also want the database removed, run:"
    output "  mysql -e \"DROP DATABASE <name>; DROP USER '<user>'@'127.0.0.1'; DROP USER '<user>'@'localhost';\""
  fi

  success "Panel removed (database and backups untouched)."
}

uninstall_wings() {
  output "Removing Wings.."

  systemctl stop wings 2>/dev/null || true
  systemctl disable wings 2>/dev/null || true
  rm -f /etc/systemd/system/wings.service /usr/local/bin/wings
  rm -rf /etc/pterodactyl
  systemctl daemon-reload

  if [ "$PURGE" == "--purge" ]; then
    warning "Purging /var/lib/pterodactyl — server data volumes, archives and backups will be DELETED."
    echo -n "Type 'purge wings data' to continue: "
    read -r confirm
    if [ "$confirm" == "purge wings data" ]; then
      rm -rf /var/lib/pterodactyl /var/log/pterodactyl /tmp/pterodactyl
      docker network rm pterodactyl_nw 2>/dev/null || true
      success "Wings data purged."
    else
      warning "Purge aborted — data kept."
    fi
  else
    output "Server data in /var/lib/pterodactyl was kept. Re-run with --purge to delete it."
  fi

  success "Wings removed."
}

check_root

case "$TARGET" in
  panel) uninstall_panel ;;
  wings) uninstall_wings ;;
  all)   uninstall_panel; uninstall_wings ;;
  *)
    echo "Usage: $0 {panel|wings|all} [--purge]"
    exit 1
    ;;
esac
