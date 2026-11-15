#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# RizzDevs Panel Installer — shared library                                          #
#                                                                                    #
# Copyright (C) 2026, RizzDevs <animersvercel@gmail.com>                         #
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

# First argument: the full package list as a single (possibly multi-line)
# string. Evaluated (like pterodactyl-installer) so brace expansion in
# php8.3-{cli,common,...} works correctly.
install_packages() {
  output "Installing packages: $1"
  # shellcheck disable=SC2086
  eval DEBIAN_FRONTEND=noninteractive apt-get install -y $1 >>"$LOG_PATH" 2>&1 \
    || fatal "Failed to install packages: $1 (see $LOG_PATH)."
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
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`${db_name}\`.* TO '${db_user}'@'localhost';
FLUSH PRIVILEGES;
SQL
}

# ---------------- Security hardening helpers ---------------- #

# MariaDB: only listen on the loopback interface and refuse LOAD DATA LOCAL INFILE.
configure_mariadb_hardening() {
  output "Hardening MariaDB (loopback-only, local-infile off).."
  local conf="/etc/mysql/mariadb.conf.d/60-rizzdevs.cnf"
  if [ -d /etc/mysql/mariadb.conf.d ]; then
    cp "$conf" "${conf}.bak.$(date +%s)" 2>/dev/null || true
    cat > "$conf" <<'EOF'
# RizzDevs hardening (installer)
[mysqld]
bind-address=127.0.0.1
local-infile=0
EOF
    if systemctl list-unit-files mariadb.service >/dev/null 2>&1; then
      systemctl restart mariadb >>"$LOG_PATH" 2>&1 || warning "Could not restart MariaDB with hardened settings (see $LOG_PATH)."
    fi
  else
    warning "MariaDB configuration directory not found — binding unchanged."
  fi
}

# PHP-FPM: strict sessions, no path info, errors off. SSL cookie flag is handled
# by SESSION_SECURE_COOKIE in .env (true when a certificate is configured).
# Also raises the pm.* pool limits proportionally to CPU count (Debian ships
# pm.max_children=5, which queues requests once a few users are active).
configure_php_hardening() {
  output "Hardening PHP-FPM sessions and pool.."
  local conf="/etc/php/8.3/fpm/conf.d/99-rizzdevs.ini"
  if [ -d /etc/php/8.3/fpm/conf.d ]; then
    cat > "$conf" <<'EOF'
; RizzDevs hardening (installer)
expose_php = Off
display_errors = Off
cgi.fix_pathinfo = 0
session.use_strict_mode = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
EOF
  fi

  local pool="/etc/php/8.3/fpm/pool.d/www.conf"
  if [ -f "$pool" ]; then
    local max_children=$(( $(nproc) * 6 ))
    [ "$max_children" -gt 24 ] && max_children=24
    [ "$max_children" -lt 8 ] && max_children=8
    local start=$(( max_children / 3 ))
    local max_spare=$(( max_children / 2 ))
    sed -i -E \
      -e "s/^pm\.max_children = .*/pm.max_children = ${max_children}/" \
      -e "s/^pm\.start_servers = .*/pm.start_servers = ${start}/" \
      -e "s/^pm\.min_spare_servers = .*/pm.min_spare_servers = 2/" \
      -e "s/^pm\.max_spare_servers = .*/pm.max_spare_servers = ${max_spare}/" \
      "$pool"
  fi

  if systemctl list-unit-files php8.3-fpm.service >/dev/null 2>&1; then
    systemctl reload php8.3-fpm >>"$LOG_PATH" 2>&1 || systemctl restart php8.3-fpm >>"$LOG_PATH" 2>&1 || true
  fi
}

# fail2ban: sshd jail (works with systemd journal or auth.log)
install_fail2ban() {
  output "Installing fail2ban (sshd brute-force protection).."
  install_packages "fail2ban"

  local ports="22"
  if command -v sshd >/dev/null 2>&1; then
    ports="$(sshd -T 2>/dev/null | awk '/^port /{printf "%s,", $2}' | sed -e 's/,$//' -e 's/^,//')"
    [ -n "$ports" ] || ports="22"
  elif [ -n "${SSH_CONNECTION:-}" ]; then
    local p
    p="$(echo "${SSH_CONNECTION}" | awk '{print $4}')"
    [ "$p" != "22" ] && ports="22,$p"
  fi

  local banaction="iptables-multiport"
  if command -v ufw >/dev/null 2>&1; then
    banaction="ufw"
  fi

  if [ -f /etc/fail2ban/jail.local ] && ! grep -q "RizzDevs hardening" /etc/fail2ban/jail.local; then
    cp /etc/fail2ban/jail.local /etc/fail2ban/jail.local.bak."$(date +%s)"
  fi

  cat > /etc/fail2ban/jail.local <<EOF
# RizzDevs hardening (installer)
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
banaction = ${banaction}
backend = systemd

[sshd]
enabled = true
port = ${ports}
filter = sshd
maxretry = 5
bantime = 1h
findtime = 10m
EOF
  systemctl enable --now fail2ban >>"$LOG_PATH" 2>&1 || warning "Could not enable fail2ban (see $LOG_PATH)."
  systemctl restart fail2ban >>"$LOG_PATH" 2>&1 || true
}

# SSH: adds a second hardened listener (default 2222) and tightens sshd options.
# Port 22 stays open during the transition; remove it manually after verifying
# that the new port works, to avoid locking yourself out.
configure_ssh_hardening() {
  local ssh_port="${RIZZDEVS_SSH_PORT:-2222}"
  output "Hardening SSH (adding hardened listener on port ${ssh_port}; keeping 22 open).."

  local src="/etc/ssh/sshd_config.d/00-rizzdevs.conf"
  mkdir -p /etc/ssh/sshd_config.d
  [ -f "$src" ] && cp "$src" "${src}.bak.$(date +%s)"

  cat > "$src" <<EOF
# RizzDevs hardening (installer)
Port 22
Port ${ssh_port}
MaxAuthTries 4
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding yes
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
PermitEmptyPasswords no
EOF
  chmod 644 "$src"

  if command -v sshd >/dev/null 2>&1; then
    sshd -t || fatal "sshd configuration test failed after hardening (check $src)."
  else
    fatal "sshd not found — cannot safely harden SSH."
  fi

  if systemctl list-unit-files ssh.socket >/dev/null 2>&1 && { systemctl is-active --quiet ssh.socket || systemctl is-enabled --quiet ssh.socket; }; then
    mkdir -p /etc/systemd/system/ssh.socket.d
    cat > /etc/systemd/system/ssh.socket.d/rizzdevs-listen.conf <<EOF
# RizzDevs hardening (installer): listen on 22 (transition) and ${ssh_port}
[Socket]
ListenStream=
ListenStream=0.0.0.0:22
ListenStream=[::]:22
ListenStream=0.0.0.0:${ssh_port}
ListenStream=[::]:${ssh_port}
EOF
    chmod 644 /etc/systemd/system/ssh.socket.d/rizzdevs-listen.conf
    systemctl daemon-reload
    systemctl restart ssh.socket >>"$LOG_PATH" 2>&1 || fatal "Could not restart ssh.socket (see $LOG_PATH)."
  else
    systemctl restart ssh >>"$LOG_PATH" 2>&1 || systemctl restart sshd >>"$LOG_PATH" 2>&1 || fatal "Could not restart sshd (see $LOG_PATH)."
  fi

  if command -v ufw >/dev/null 2>&1; then
    ufw allow "${ssh_port}/tcp" comment 'SSH hardened' >>"$LOG_PATH" 2>&1 || warning "Could not open port ${ssh_port}/tcp in ufw — open it manually."
  fi
  # refresh the fail2ban sshd jail so it covers the new port too
  install_fail2ban
  warning "SSH now listens on 22 and ${ssh_port}. Verify the new port in a second session, then remove the port 22 listener and ufw rule."
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

  # Never lock out the session you are installing from: allow the port of the
  # connection that is running this installer (if it differs from 22).
  local ssh_port
  ssh_port="$(echo "${SSH_CONNECTION:-}" | awk '{print $4}')"
  if [ -n "$ssh_port" ] && [ "$ssh_port" != "22" ]; then
    ufw allow "$ssh_port"/tcp >>"$LOG_PATH" 2>&1 || true
    warning "SSH is on port $ssh_port — allowed it in ufw to avoid lockout."
  fi
}
