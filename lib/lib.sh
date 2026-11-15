#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# RizzDevs Panel Installer — shared library                                          #
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

lib_loaded() {
  return 0
}

# ---------------- Versioning / sources ---------------- #

export GITHUB_SOURCE="${GITHUB_SOURCE:-main}"
export SCRIPT_RELEASE="${SCRIPT_RELEASE:-v2.0.0}"

# Pterodactyl (Wings) release to install — matches the version AURORA Panel expects.
export PTERODACTYL_WINGS_VERSION="${PTERODACTYL_WINGS_VERSION:-v1.13.5}"

# Where the panel source lives. When the installer runs from inside the cloned
# repository, the code right there is used. Otherwise it is downloaded as a tarball.
export RIZZDEVS_REPO="${RIZZDEVS_REPO:-https://github.com/riskiardiane/Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-}"
export RIZZDEVS_RAW_URL="${RIZZDEVS_RAW_URL:-https://raw.githubusercontent.com/riskiardiane/Shop-pteroductyl-panel-installer-and-eggs-pteroductyl-/${GITHUB_SOURCE}}"
export RIZZDEVS_TARBALL_URL="${RIZZDEVS_TARBALL_URL:-$RIZZDEVS_REPO/archive/refs/heads/${GITHUB_SOURCE}.tar.gz}"

export PATH="$PATH:/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin"

LOG_PATH="${LOG_PATH:-/var/log/rizzdevs-installer.log}"

# ---------------- Output helpers ---------------- #

if [[ -t 1 ]]; then
  COLOR_RESET='\033[0m'
  COLOR_CYAN='\033[0;36m'
  COLOR_GREEN='\033[0;32m'
  COLOR_YELLOW='\033[1;33m'
  COLOR_RED='\033[0;31m'
  COLOR_BOLD='\033[1m'
else
  COLOR_RESET='' COLOR_CYAN='' COLOR_GREEN='' COLOR_YELLOW='' COLOR_RED='' COLOR_BOLD=''
fi

output() {
  echo -e "${COLOR_CYAN}*${COLOR_RESET} $*"
}

success() {
  echo -e "${COLOR_GREEN}[✓]${COLOR_RESET} $*"
}

warning() {
  echo -e "${COLOR_YELLOW}[!]${COLOR_RESET} $*"
}

error() {
  echo -e "${COLOR_RED}[x]${COLOR_RESET} $*" >&2
}

fatal() {
  error "$*"
  echo "See $LOG_PATH for details." >&2
  exit 1
}

welcome() {
  echo -e ""
  echo -e "${COLOR_BOLD}=========================================================="
  echo -e "   RizzDevs Panel Installer ${SCRIPT_RELEASE}"
  echo -e "   AURORA 2.0 game/service panel — panel, wings & eggs"
  echo -e "==========================================================${COLOR_RESET}"
  echo -e ""
}

# ---------------- Input helpers ---------------- #

is_yes() {
  [[ "$1" =~ ^([yY]([eE][sS])?|1)$ ]]
}

is_no() {
  [[ "$1" =~ ^([nN][oO]?|0)$ ]]
}

is_ip_address() {
  [[ "$1" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] || [[ "$1" == *:* ]]
}

random_string() {
  local length="${1:-32}"
  # shellcheck disable=SC2002
  cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w "$length" | head -n1
}

check_root() {
  if [[ "$(id -u)" != "0" ]]; then
    fatal "This installer must be run as root. Try again with: sudo bash <(curl -sSL ...) or become root first."
  fi
}

# ---------------- OS detection ---------------- #

get_os_info() {
  # Sets OS, OS_VER, OS_VER_MAJOR and ARCH. Debian/Ubuntu only — the AURORA
  # stack is built and tested against Ubuntu 22.04/24.04/26.04 and Debian 12+.
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    OS="${ID:-unknown}"
    OS_VER="${VERSION_ID:-unknown}"
    OS_VERSION_CODENAME="${VERSION_CODENAME:-}"
  else
    fatal "Unable to detect OS (/etc/os-release missing)."
  fi

  OS_VER_MAJOR="${OS_VER%%.*}"
  ARCH="$(dpkg --print-architecture 2>/dev/null || uname -m)"
  export OS OS_VER OS_VER_MAJOR OS_VERSION_CODENAME ARCH
}

check_supported_os() {
  get_os_info
  case "$OS" in
    ubuntu)
      if (( OS_VER_MAJOR < 22 )); then
        fatal "Unsupported Ubuntu version $OS_VER (22.04 or newer required)."
      fi
      ;;
    debian)
      if (( OS_VER_MAJOR < 12 )); then
        fatal "Unsupported Debian version $OS_VER (12 or newer required)."
      fi
      ;;
    *)
      fatal "Unsupported OS '$OS'. This installer supports Ubuntu 22.04+ and Debian 12+."
      ;;
  esac
  success "Detected $OS $OS_VER ($ARCH)"
}

# ---------------- Package helpers ---------------- #

update_repos() {
  output "Updating package repositories.."
  apt-get update -y >>"$LOG_PATH" 2>&1 || fatal "Failed to update repositories (see $LOG_PATH)."
}

install_packages() {
  # shellcheck disable=SC2068
  output "Installing packages: $*"
  DEBIAN_FRONTEND=noninteractive apt-get install -y $@ >>"$LOG_PATH" 2>&1 \
    || fatal "Failed to install packages: $* (see $LOG_PATH)."
}

# ---------------- Database helpers ---------------- #

# Creates a MySQL/MariaDB database and user over the local unix socket as root.
# Grants exactly what the AURORA deployment grants: ALL on the panel database
# itself, WITH GRANT OPTION — nothing global.
create_db_user() {
  local db_user="$1" db_pass="$2" db_name="$3"
  output "Creating database user '$db_user'.."
  mysql <<SQL
CREATE USER IF NOT EXISTS '${db_user}'@'127.0.0.1' IDENTIFIED BY '${db_pass}';
CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_pass}';
CREATE DATABASE IF NOT EXISTS \`${db_name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL
}

# ---------------- Misc helpers ---------------- #

set_folder_permissions() {
  # Match the tested AURORA deployment: everything under storage/ and
  # bootstrap/cache is owned by www-data; artisan stays executable.
  chown -R www-data:www-data /var/www/pterodactyl
  chmod -R 755 /var/www/pterodactyl/storage /var/www/pterodactyl/bootstrap/cache
  [ -f /var/www/pterodactyl/artisan ] && chmod 755 /var/www/pterodactyl/artisan
}

insert_cronjob() {
  # AURORA schedules billing suspension/expiry, backups and housekeeping through
  # Laravel's scheduler — exactly one cron entry is required.
  local cron_line="* * * * * /usr/bin/php8.3 /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1"
  ( crontab -l 2>/dev/null | grep -v -F "artisan schedule:run" || true; echo "$cron_line" ) | crontab -
  success "Scheduled artisan schedule:run (root crontab)."
}

firewall_allow_ports() {
  # shellcheck disable=SC2068
  for port in $@; do
    ufw allow "$port"/tcp >>"$LOG_PATH" 2>&1 || warning "Could not open port $port/tcp in ufw."
  done
}

install_firewall() {
  install_packages "ufw"
  ufw default deny incoming >>"$LOG_PATH" 2>&1 || true
  ufw default allow outgoing >>"$LOG_PATH" 2>&1 || true
  ufw limit OpenSSH >>"$LOG_PATH" 2>&1 || true
}
