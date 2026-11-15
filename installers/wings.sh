#!/bin/bash

set -e -o pipefail

######################################################################################
#                                                                                    #
# RizzDevs Panel Installer — installs Wings (game node daemon) for AURORA 2.0.       #
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

# Check if script is loaded, load if not or fail otherwise.
fn_exists() { declare -F "$1" >/dev/null; }
if ! fn_exists lib_loaded; then
  # shellcheck source=../lib/lib.sh
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../lib" && pwd)/lib.sh" 2>/dev/null \
    || source /tmp/lib.sh \
    || source <(curl -fsSL "$RIZZDEVS_RAW_URL"/lib/lib.sh)
  ! fn_exists lib_loaded && echo "* ERROR: Could not load lib script" && exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ------------------ Variables ----------------- #

# Wings configuration (interactive unless provided via env)
export WINGS_UUID="${WINGS_UUID:-}"
export WINGS_TOKEN_ID="${WINGS_TOKEN_ID:-}"
export WINGS_TOKEN="${WINGS_TOKEN:-}"
export WINGS_PANEL_URL="${WINGS_PANEL_URL:-}"
export WINGS_FQDN="${WINGS_FQDN:-}"
export WINGS_SFTP_PORT="${WINGS_SFTP_PORT:-2022}"
export WINGS_API_PORT="${WINGS_API_PORT:-8080}"
export WINGS_DOCKER_CIDR="${WINGS_DOCKER_CIDR:-172.18.0.0/16}"
export WINGS_DOCKER_GATEWAY="${WINGS_DOCKER_GATEWAY:-172.18.0.1}"

# SSL (Let's Encrypt) for the node FQDN
export CONFIGURE_LETSENCRYPT="${CONFIGURE_LETSENCRYPT:-false}"
export email="${email:-}"

# Firewall
export CONFIGURE_FIREWALL="${CONFIGURE_FIREWALL:-false}"
# Optional second SSH listener on a hardened port (port 22 stays open during transition)
export CONFIGURE_SSH_HARDENING="${CONFIGURE_SSH_HARDENING:-false}"
export RIZZDEVS_SSH_PORT="${RIZZDEVS_SSH_PORT:-2222}"

# Allocation range to open (e.g. "25565-25665"), empty = skip
export ALLOCATION_RANGE="${ALLOCATION_RANGE:-}"

# ----------- Installation functions ----------- #

dep_install() {
  output "Installing dependencies for $OS $OS_VER.."

  install_packages "ca-certificates gnupg lsb-release curl tar unzip"

  mkdir -p /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$OS/gpg" | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  update_repos
  install_packages "docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"

  [ "$CONFIGURE_LETSENCRYPT" == true ] && install_packages "certbot"

  systemctl enable --now docker >>"$LOG_PATH" 2>&1

  install_fail2ban

  success "Dependencies installed!"
}

firewall_ports() {
  output "Opening port 22 (SSH), 8080 (Wings API), 2022 (Wings SFTP)"
  firewall_allow_ports "22 8080 2022"

  if [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    firewall_allow_ports "80 443"
  fi

  if [ -n "$ALLOCATION_RANGE" ]; then
    output "Opening allocation range $ALLOCATION_RANGE/tcp+udp.."
    ufw allow "$ALLOCATION_RANGE"/tcp >>"$LOG_PATH" 2>&1 || warning "Could not open $ALLOCATION_RANGE/tcp in ufw."
    ufw allow "$ALLOCATION_RANGE"/udp >>"$LOG_PATH" 2>&1 || warning "Could not open $ALLOCATION_RANGE/udp in ufw."
  fi

  ufw --force enable >>"$LOG_PATH" 2>&1 || warning "Could not enable ufw."
  success "Firewall ports opened!"
}

docker_network() {
  output "Ensuring docker network 'pterodactyl_nw' ($WINGS_DOCKER_CIDR, gateway $WINGS_DOCKER_GATEWAY).."
  if docker network inspect pterodactyl_nw >/dev/null 2>&1; then
    success "Docker network already exists."
    return 0
  fi
  docker network create \
    --driver bridge \
    --subnet "$WINGS_DOCKER_CIDR" \
    --gateway "$WINGS_DOCKER_GATEWAY" \
    -o com.docker.network.bridge.name=pterodactyl0 \
    pterodactyl_nw >>"$LOG_PATH" 2>&1 \
    || docker network create --driver bridge --subnet "$WINGS_DOCKER_CIDR" --gateway "$WINGS_DOCKER_GATEWAY" pterodactyl_nw >>"$LOG_PATH" 2>&1
  success "Docker network ready."
}

wings_dl() {
  output "Downloading Wings $PTERODACTYL_WINGS_VERSION.."

  mkdir -p /etc/pterodactyl \
           /var/lib/pterodactyl/{volumes,archives,backups} \
           /var/log/pterodactyl \
           /tmp/pterodactyl

  curl -fL -o /usr/local/bin/wings \
    "https://github.com/pterodactyl/wings/releases/download/${PTERODACTYL_WINGS_VERSION}/wings_linux_${ARCH}"
  chmod u+x /usr/local/bin/wings

  success "Wings downloaded."
}

ask_questions() {
  # Node FQDN first (needed for the LE/firewall questions)
  if [ -z "$WINGS_FQDN" ]; then
    local default_fqdn
    default_fqdn="$(hostname -f 2>/dev/null || hostname)"
    if [ ! -t 0 ]; then
      echo "* WINGS_FQDN not set and stdin not interactive — defaulting to $default_fqdn"
      WINGS_FQDN="$default_fqdn"
    else
      echo -n "* Node FQDN (domain or IP this node uses) [$default_fqdn]: "
      read -r WINGS_FQDN
      WINGS_FQDN="${WINGS_FQDN:-$default_fqdn}"
    fi
  fi

  local domain_capable=true
  if is_ip_address "$WINGS_FQDN" || [[ "$WINGS_FQDN" == localhost ]]; then
    domain_capable=false
    output "IP address detected — Let's Encrypt will be skipped (requires a domain)."
  fi

  if [ "$domain_capable" == true ] && [ "$CONFIGURE_LETSENCRYPT" != "true" ]; then
    echo -n "* Configure Let's Encrypt SSL for $WINGS_FQDN? (y/N): "
    read -r le_input
    is_yes "$le_input" && CONFIGURE_LETSENCRYPT=true
  fi

  if [ "$CONFIGURE_LETSENCRYPT" == true ] && [ -z "$email" ]; then
    echo -n "* Email for Let's Encrypt expiry notices: "
    read -r email
    [ -n "$email" ] || fatal "Email is required for Let's Encrypt."
  fi

  if [ "$CONFIGURE_FIREWALL" != "true" ]; then
    echo -n "* Configure the firewall with ufw? (y/N): "
    read -r fw_input
    if is_yes "$fw_input"; then
      CONFIGURE_FIREWALL=true
      echo -n "* Allocation port range to open (e.g. 25565-25665, empty to skip): "
      read -r ALLOCATION_RANGE
    fi
  fi

  if [ "$CONFIGURE_SSH_HARDENING" != "true" ]; then
    echo -n "* Harden SSH (add a hardened listener on port ${RIZZDEVS_SSH_PORT}, keep port 22 open)? (y/N): "
    read -r ssh_input
    is_yes "$ssh_input" && CONFIGURE_SSH_HARDENING=true
  fi
}

ask_config() {
  # Panel connection details — from env when provided, otherwise interactively.
  if [ -z "$WINGS_PANEL_URL" ]; then
    echo -n "* Panel URL (e.g. https://panel.exions.web.id): "
    read -r WINGS_PANEL_URL
  fi
  if [ -z "$WINGS_UUID" ]; then
    echo -n "* Node UUID (Admin → Nodes → your node): "
    read -r WINGS_UUID
  fi
  if [ -z "$WINGS_TOKEN_ID" ]; then
    echo -n "* token_id (from the node configuration screen): "
    read -r WINGS_TOKEN_ID
  fi
  if [ -z "$WINGS_TOKEN" ]; then
    echo -n "* token (from the node configuration screen): "
    read -r WINGS_TOKEN
  fi

  [ -n "$WINGS_PANEL_URL" ] || fatal "Panel URL is required."
  [ -n "$WINGS_UUID" ] || fatal "Node UUID is required."
  [ -n "$WINGS_TOKEN_ID" ] || fatal "token_id is required."
  [ -n "$WINGS_TOKEN" ] || fatal "token is required."
}

configure_wings() {
  output "Writing /etc/pterodactyl/config.yml.."

  local ssl_enabled="false"
  local cert_line=""
  local key_line=""
  if [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    ssl_enabled="true"
    cert_line="cert: /etc/letsencrypt/live/$WINGS_FQDN/fullchain.pem"
    key_line="key: /etc/letsencrypt/live/$WINGS_FQDN/privkey.pem"
  fi

  cat > /etc/pterodactyl/config.yml <<EOF
debug: false
app_name: Pterodactyl
uuid: ${WINGS_UUID}
token_id: ${WINGS_TOKEN_ID}
token: ${WINGS_TOKEN}
api:
  host: 0.0.0.0
  port: ${WINGS_API_PORT}
  ssl:
    enabled: ${ssl_enabled}
    ${cert_line}
    ${key_line}
  disable_remote_download: false
  remote_download_allowlist: []
  upload_limit: 100
  trusted_proxies: []
system:
  root_directory: /var/lib/pterodactyl
  log_directory: /var/log/pterodactyl
  data: /var/lib/pterodactyl/volumes
  archive_directory: /var/lib/pterodactyl/archives
  backup_directory: /var/lib/pterodactyl/backups
  tmp_directory: /tmp/pterodactyl
  username: pterodactyl
  timezone: Etc/UTC
  user:
    rootless:
      enabled: false
      container_uid: 0
      container_gid: 0
    uid: 997
    gid: 980
  passwd:
    enabled: false
    directory: /run/wings/etc
  machine_id:
    enabled: true
    directory: /run/wings/machine-id
  disk_check_interval: 150
  activity_send_interval: 60
  activity_send_count: 100
  check_permissions_on_boot: true
  enable_log_rotate: true
  websocket_log_count: 150
  sftp:
    bind_address: 0.0.0.0
    bind_port: ${WINGS_SFTP_PORT}
    read_only: false
    max_connections_per_user: 0
    max_authenticating_connections_per_ip: 0
  crash_detection:
    enabled: true
    detect_clean_exit_as_crash: true
    timeout: 60
  backups:
    write_limit: 0
    compression_level: best_speed
    restore_host_allowlist: []
  transfers:
    download_limit: 0
  openat_mode: auto
docker:
  network:
    interface: ${WINGS_DOCKER_GATEWAY}
    dns:
    - 1.1.1.1
    - 1.0.0.1
    name: pterodactyl_nw
    ispn: false
    driver: ""
    network_mode: pterodactyl_nw
    is_internal: false
    enable_icc: true
    network_mtu: 1500
    interfaces:
      v4:
        subnet: ${WINGS_DOCKER_CIDR}
        gateway: ${WINGS_DOCKER_GATEWAY}
      v6:
        subnet: fdba:17c8:6c94::/64
        gateway: fdba:17c8:6c94::1011
  domainname: ""
  registries: {}
  tmpfs_size: 100
  container_pid_limit: 512
  installer_limits:
    memory: 1024
    cpu: 100
  cpu_period: 100000
  cpu_burst:
    enabled: true
    percent: 100
  cpu_shares: 0
  overhead:
    override: false
    default_multiplier: 1.05
    multipliers: {}
  use_performant_inspect: true
  userns_mode: ""
  log_config:
    type: local
    config:
      compress: "false"
      max-file: "1"
      max-size: 5m
      mode: non-blocking
throttles:
  enabled: true
  lines: 2000
  line_reset_interval: 100
remote: ${WINGS_PANEL_URL}
remote_query:
  timeout: 30
  boot_servers_per_page: 50
allowed_mounts: []
allowed_origins: []
allow_cors_private_network: false
ignore_panel_config_updates: false
EOF

  chmod 600 /etc/pterodactyl/config.yml
  success "Wings configuration written (0600)."
}

systemd_file() {
  output "Installing systemd service.."

  if [ -f "$SCRIPT_DIR/configs/wings.service" ]; then
    cp "$SCRIPT_DIR/configs/wings.service" /etc/systemd/system/wings.service
  else
    curl -fsSL -o /etc/systemd/system/wings.service "$RIZZDEVS_RAW_URL/configs/wings.service"
  fi

  systemctl daemon-reload
  systemctl enable wings >>"$LOG_PATH" 2>&1

  success "Installed systemd service!"
}

letsencrypt() {
  output "Configuring Let's Encrypt for $WINGS_FQDN.."

  if [ -f "/etc/letsencrypt/live/$WINGS_FQDN/fullchain.pem" ]; then
    success "Using existing certificate."
    return 0
  fi

  if certbot certonly --no-eff-email --email "$email" --standalone -d "$WINGS_FQDN" >>"$LOG_PATH" 2>&1; then
    success "Let's Encrypt certificate issued for $WINGS_FQDN."
  else
    warning "Could not obtain a certificate — edit /etc/pterodactyl/config.yml to enable SSL manually."
  fi
}

# --------------- Main functions --------------- #

perform_install() {
  check_root
  get_os_info
  check_supported_os
  ask_questions
  [ "$CONFIGURE_FIREWALL" == true ] && install_firewall && firewall_ports
  dep_install
  [ "$CONFIGURE_SSH_HARDENING" == true ] && configure_ssh_hardening
  docker_network
  wings_dl
  ask_config
  [ "$CONFIGURE_LETSENCRYPT" == true ] && letsencrypt
  configure_wings
  systemd_file
  systemctl restart wings || systemctl start wings

  output ""
  success "Wings $PTERODACTYL_WINGS_VERSION installed and running!"
  output ""
  output "  Node FQDN   : $WINGS_FQDN"
  output "  Wings API   : ${WINGS_FQDN}:${WINGS_API_PORT} (ssl: $CONFIGURE_LETSENCRYPT)"
  output "  SFTP port   : $WINGS_SFTP_PORT"
  output "  Config file : /etc/pterodactyl/config.yml"
  output ""
  output "Check status with: systemctl status wings"
}

# ------------------- Install ------------------ #

perform_install
