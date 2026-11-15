#!/bin/bash

set -e -o pipefail

######################################################################################
#                                                                                    #
# RizzDevs Panel Installer — installs AURORA 2.0 Panel (game/service panel).         #
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

# ------------------ Variables ----------------- #

# Domain name / IP
export FQDN="${FQDN:-}"

# Database credentials (random by default)
export MYSQL_DB="${MYSQL_DB:-aurora_panel}"
export MYSQL_USER="${MYSQL_USER:-aurora_panel}"
export MYSQL_PASSWORD="${MYSQL_PASSWORD:-$(random_string 40)}"

# Environment
export timezone="${timezone:-Asia/Jakarta}"
export email="${email:-}"

# Initial admin account
export user_email="${user_email:-}"
export user_username="${user_username:-}"
export user_firstname="${user_firstname:-}"
export user_lastname="${user_lastname:-}"
export user_password="${user_password:-$(random_string 24)}"

# Assume SSL, will configure nginx HTTPS with your own certificate if true
export ASSUME_SSL="${ASSUME_SSL:-false}"
# Let's Encrypt
export CONFIGURE_LETSENCRYPT="${CONFIGURE_LETSENCRYPT:-false}"
# Import AURORA/RizzDevs egg collection (274 eggs) after migrate
export IMPORT_EGGS="${IMPORT_EGGS:-true}"
# Firewall
export CONFIGURE_FIREWALL="${CONFIGURE_FIREWALL:-false}"

PANEL_DIR="${PANEL_DIR:-/var/www/pterodactyl}"

PANEL_DIR_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ----------- Installation functions ----------- #

dep_install() {
  update_repos

  [ "$CONFIGURE_FIREWALL" == true ] && install_firewall && firewall_ports

  # PHP 8.3 — Ubuntu 22.04 needs sury/ondrej, 24.04+ ships php8.3, Debian 12+ ships a recent php8.x
  case "$OS" in
    ubuntu)
      install_packages "software-properties-common apt-transport-https ca-certificates gnupg curl"
      if [ "$OS_VER_MAJOR" == "22" ]; then
        LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php >>"$LOG_PATH" 2>&1 || true
        update_repos
      fi
      ;;
    debian)
      install_packages "dirmngr apt-transport-https lsb-release gnupg curl"
      if ! apt-cache show php8.3-cli >/dev/null 2>&1; then
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://packages.sury.org/php/apt.gpg | gpg --dearmor --yes -o /etc/apt/keyrings/php.gpg
        echo "deb [signed-by=/etc/apt/keyrings/php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
        update_repos
      fi
      ;;
  esac

  install_packages "php8.3 php8.3-{cli,common,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip,intl,sockets,opcache,sodium} \
    mariadb-server mariadb-client \
    nginx \
    redis-server \
    zip unzip tar git cron curl ca-certificates gnupg \
    composer"

  if [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    install_packages "certbot python3-certbot-nginx"
  fi

  # Node.js 22 (required to build the panel frontend) — nodesource
  if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" != "22" ]; then
    output "Installing Node.js 22 via NodeSource.."
    curl -fsSL "https://deb.nodesource.com/setup_22.x" | bash - >>"$LOG_PATH" 2>&1
    install_packages "nodejs"
  fi

  # Yarn 1.x (lockfile is yarn v1 format)
  if ! command -v yarn >/dev/null 2>&1 || ! yarn -v | grep -q '^1\.'; then
    output "Installing Yarn 1.x.."
    npm install -g yarn@1 >>"$LOG_PATH" 2>&1
  fi

  systemctl enable --now php8.3-fpm >>"$LOG_PATH" 2>&1 || true
  systemctl enable --now redis-server >>"$LOG_PATH" 2>&1 || true
  systemctl enable mariadb >>"$LOG_PATH" 2>&1
  systemctl start mariadb >>"$LOG_PATH" 2>&1
  systemctl enable nginx >>"$LOG_PATH" 2>&1

  success "Dependencies installed!"
}

firewall_ports() {
  output "Opening ports: 22 (SSH), 80 (HTTP) and 443 (HTTPS)"
  firewall_allow_ports "22 80 443"
  ufw --force enable >>"$LOG_PATH" 2>&1 || warning "Could not enable ufw (SSH is limited, not random-port)."
  success "Firewall ports opened!"
}

panel_dl() {
  output "Installing AURORA 2.0 Panel files into $PANEL_DIR.."

  if [ -d "$PANEL_DIR" ] && [ -n "$(ls -A "$PANEL_DIR" 2>/dev/null)" ]; then
    fatal "$PANEL_DIR already exists and is not empty. Fresh installs only — move it aside first."
  fi

  mkdir -p "$PANEL_DIR"

  if [ -n "$RIZZDEVS_PANEL_SRC" ] && [ -d "$RIZZDEVS_PANEL_SRC" ]; then
    # Local source (installer running from a cloned repository checkout).
    output "Using panel source from $RIZZDEVS_PANEL_SRC"
    cp -a "$RIZZDEVS_PANEL_SRC/." "$PANEL_DIR/"
  elif [ -d "$PANEL_DIR_SCRIPT_DIR/panel" ]; then
    output "Using panel source bundled in the repository"
    cp -a "$PANEL_DIR_SCRIPT_DIR/panel/." "$PANEL_DIR/"
  else
    output "Downloading panel source tarball.."
    local tmp
    tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/repo.tar.gz" "$RIZZDEVS_TARBALL_URL"
    tar -xzf "$tmp/repo.tar.gz" -C "$tmp" --strip-components=1
    [ -d "$tmp/panel" ] || fatal "Downloaded tarball does not contain a ./panel directory."
    cp -a "$tmp/panel/." "$PANEL_DIR/"
    rm -rf "$tmp"
  fi

  # storage/ layout that Laravel expects (the repo ships .gitkeep placeholders)
  mkdir -p "$PANEL_DIR/storage/"{app/public,framework/{cache,data,sessions,views,testing},logs}
  mkdir -p "$PANEL_DIR/bootstrap/cache"
  chmod -R 755 "$PANEL_DIR/storage" "$PANEL_DIR/bootstrap/cache"

  cp "$PANEL_DIR/.env.example" "$PANEL_DIR/.env"

  success "Panel files installed!"
}

install_composer_deps() {
  output "Installing composer dependencies.."
  export COMPOSER_ALLOW_SUPERUSER=1
  ( cd "$PANEL_DIR" && composer install --no-dev --optimize-autoloader --no-interaction ) >>"$LOG_PATH" 2>&1 \
    || fatal "composer install failed (see $LOG_PATH)."

  output "Building frontend assets (this can take a few minutes).."
  ( cd "$PANEL_DIR" && yarn install --frozen-lockfile >>"$LOG_PATH" 2>&1 ) \
    || fatal "yarn install failed (see $LOG_PATH)."
  ( cd "$PANEL_DIR" && NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=4096" yarn build:production >>"$LOG_PATH" 2>&1 ) \
    || fatal "Frontend build failed (see $LOG_PATH)."

  success "Composer dependencies and frontend assets ready!"
}

configure() {
  output "Configuring environment.."

  local app_url="http://$FQDN"
  [ "$ASSUME_SSL" == true ] && app_url="https://$FQDN"
  [ "$CONFIGURE_LETSENCRYPT" == true ] && app_url="https://$FQDN"

  ( cd "$PANEL_DIR" && php artisan key:generate --force ) >>"$LOG_PATH" 2>&1

  # Basic environment
  ( cd "$PANEL_DIR" && php artisan p:environment:setup \
      --author="$email" \
      --url="$app_url" \
      --timezone="$timezone" \
      --cache=redis \
      --session=redis \
      --queue=redis \
      --redis-host=localhost \
      --redis-pass="" \
      --redis-port=6379 \
      --settings-ui=true \
      --telemetry=false \
      --new-salt ) >>"$LOG_PATH" 2>&1 || warning "p:environment:setup reported a problem (see $LOG_PATH)."

  # Database environment
  ( cd "$PANEL_DIR" && php artisan p:environment:database \
      --host=127.0.0.1 \
      --port=3306 \
      --database="$MYSQL_DB" \
      --username="$MYSQL_USER" \
      --password="$MYSQL_PASSWORD" ) >>"$LOG_PATH" 2>&1 || warning "p:environment:database reported a problem (see $LOG_PATH)."

  # Hardening-related defaults, written directly (idempotent)
  sed -i -e "s|^APP_ENV=.*|APP_ENV=production|" \
         -e "s|^APP_DEBUG=.*|APP_DEBUG=false|" \
         -e "s|^LOG_CHANNEL=.*|LOG_CHANNEL=daily|" \
         "$PANEL_DIR/.env"

  success "Environment configured!"
}

migrate_db() {
  output "Running database migrations.."
  ( cd "$PANEL_DIR" && php artisan migrate --force ) >>"$LOG_PATH" 2>&1 \
    || fatal "Migration failed (see $LOG_PATH)."
  success "Database migrated!"
}

create_admin() {
  output "Creating the initial admin account.."
  ( cd "$PANEL_DIR" && php artisan p:user:make \
      --email="$user_email" \
      --username="$user_username" \
      --name-first="$user_firstname" \
      --name-last="$user_lastname" \
      --password="$user_password" \
      --admin=1 ) >>"$LOG_PATH" 2>&1 \
    || fatal "Could not create admin user (see $LOG_PATH)."
  success "Admin account '$user_username' created!"
}

import_eggs() {
  [ "$IMPORT_EGGS" == true ] || { output "Skipping egg import (IMPORT_EGGS=false)."; return 0; }

  local egg_src="${RIZZDEVS_EGGS_SRC:-$PANEL_DIR_SCRIPT_DIR/eggs}"
  if [ ! -d "$egg_src" ]; then
    output "Downloading egg collection.."
    local tmp
    tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/repo.tar.gz" "$RIZZDEVS_TARBALL_URL"
    tar -xzf "$tmp/repo.tar.gz" -C "$tmp" --strip-components=1
    egg_src="$tmp/eggs"
  fi

  [ -d "$egg_src" ] || { warning "Egg collection not found at $egg_src — skipping import."; return 0; }
  chmod -R a+rX "$egg_src" || true

  local script_path="$PANEL_DIR_SCRIPT_DIR/scripts/import-eggs.php"
  if [ ! -f "$script_path" ]; then
    output "Fetching import script.."
    mkdir -p /tmp/rizzdevs-install
    script_path="/tmp/rizzdevs-install/import-eggs.php"
    curl -fsSL -o "$script_path" "$RIZZDEVS_RAW_URL/scripts/import-eggs.php"
  fi
  chmod a+r "$script_path"

  output "Importing RizzDevs egg collection from $egg_src (this may take a minute).."
  su -s /bin/bash www-data -c "cd '$PANEL_DIR' && EGG_SOURCE='$egg_src' php artisan tinker --execute=\"eval(file_get_contents('$script_path'));\"" \
    | tee -a "$LOG_PATH" \
    || warning "Egg import finished with warnings (see $LOG_PATH)."
  success "Eggs imported."
}

configure_nginx() {
  output "Configuring nginx.."

  local dl_file="nginx_panel.conf"
  if [ "$ASSUME_SSL" == true ] || [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    dl_file="nginx_panel_ssl.conf"
  fi

  local php_socket="/run/php/php8.3-fpm.sock"
  local conf_avail="/etc/nginx/sites-available/pterodactyl.conf"
  local conf_enabl="/etc/nginx/sites-enabled/pterodactyl.conf"

  rm -f /etc/nginx/sites-enabled/default

  if [ -f "$PANEL_DIR_SCRIPT_DIR/configs/$dl_file" ]; then
    cp "$PANEL_DIR_SCRIPT_DIR/configs/$dl_file" "$conf_avail"
  else
    curl -fsSL -o "$conf_avail" "$RIZZDEVS_RAW_URL/configs/$dl_file"
  fi

  sed -i -e "s|<domain>|${FQDN}|g" -e "s|<php_socket>|${php_socket}|g" "$conf_avail"

  # Let's Encrypt managed vhosts use nginx_panel.conf first, then certbot --nginx injects TLS
  if [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    cp "$PANEL_DIR_SCRIPT_DIR/configs/nginx_panel.conf" "$conf_avail" 2>/dev/null || true
    sed -i -e "s|<domain>|${FQDN}|g" -e "s|<php_socket>|${php_socket}|g" "$conf_avail"
  fi

  ln -sf "$conf_avail" "$conf_enabl"

  if [ "$ASSUME_SSL" == false ] && [ "$CONFIGURE_LETSENCRYPT" == false ]; then
    nginx -t >>"$LOG_PATH" 2>&1 || fatal "nginx configuration test failed."
    systemctl restart nginx
  fi

  success "Nginx configured!"
}

letsencrypt() {
  output "Configuring Let's Encrypt.."
  local failed=false

  if ! certbot --nginx --redirect --no-eff-email --email "$email" -d "$FQDN" >>"$LOG_PATH" 2>&1; then
    failed=true
  fi

  if [ ! -d "/etc/letsencrypt/live/$FQDN/" ] || [ "$failed" == true ]; then
    warning "Obtaining a Let's Encrypt certificate failed — keeping HTTP for now."
    warning "Re-run with CONFIGURE_LETSENCRYPT=false or ask for help after fixing DNS."
    return 0
  fi

  success "Let's Encrypt certificate installed for $FQDN."
}

# --------------- Interactive questions --------------- #

ask_questions() {
  if [ -z "$FQDN" ]; then
    if [ ! -t 0 ]; then
      fatal "FQDN is not set and stdin is not interactive. Export FQDN=panel.example.com (and EMAIL=...) before running."
    fi
    echo -n "* Enter the panel FQDN (domain or IP), e.g. panel.example.com: "
    read -r FQDN
    [ -n "$FQDN" ] || fatal "FQDN is required."
  fi

  if [ -z "$email" ]; then
    echo -n "* Enter your e-mail (used for Let's Encrypt and as panel service author): "
    read -r email
    [ -n "$email" ] || fatal "Email is required."
  fi

  echo -n "* Enter your timezone [$timezone]: "
  read -r tz_input
  [ -n "$tz_input" ] && timezone="$tz_input"

  local domain_capable=true
  if is_ip_address "$FQDN" || [[ "$FQDN" == localhost ]]; then
    domain_capable=false
    output "IP address detected — Let's Encrypt will be skipped (requires a domain)."
  fi

  if [ "$domain_capable" == true ] && [ "$CONFIGURE_LETSENCRYPT" != "true" ] && [ "$ASSUME_SSL" != "true" ]; then
    echo -n "* Configure Let's Encrypt SSL for $FQDN? (y/N): "
    read -r le_input
    is_yes "$le_input" && CONFIGURE_LETSENCRYPT=true
  fi

  if [ "$domain_capable" == true ] && [ "$CONFIGURE_LETSENCRYPT" != "true" ] && [ "$ASSUME_SSL" != "true" ]; then
    echo -n "* Assume SSL with your own certificate at /etc/ssl/$FQDN.pem? (y/N): "
    read -r ssl_input
    is_yes "$ssl_input" && ASSUME_SSL=true
  fi

  if [ "$CONFIGURE_FIREWALL" != "true" ]; then
    echo -n "* Configure the firewall with ufw (deny incoming, allow SSH/HTTP/HTTPS)? (y/N): "
    read -r fw_input
    is_yes "$fw_input" && CONFIGURE_FIREWALL=true
  fi

  if [ "$IMPORT_EGGS" != "false" ]; then
    echo -n "* Import the bundled RizzDevs egg collection (274 eggs) after install? (Y/n): "
    read -r egg_input
    if is_no "$egg_input"; then
      IMPORT_EGGS=false
    else
      IMPORT_EGGS=true
    fi
  fi

  if [ -z "$user_email" ]; then
    echo -n "* Admin e-mail [you@example.com]: "
    read -r user_email
    user_email="${user_email:-you@example.com}"
  fi
  if [ -z "$user_username" ]; then
    echo -n "* Admin username [admin]: "
    read -r user_username
    user_username="${user_username:-admin}"
  fi
  if [ -z "$user_firstname" ]; then
    echo -n "* Admin first name [Admin]: "
    read -r user_firstname
    user_firstname="${user_firstname:-Admin}"
  fi
  if [ -z "$user_lastname" ]; then
    echo -n "* Admin last name [User]: "
    read -r user_lastname
    user_lastname="${user_lastname:-User}"
  fi
  if [ -z "$user_password" ] || [ "$user_password" == "" ]; then
    user_password="$(random_string 24)"
  fi
  echo -n "* Admin password (leave empty to auto-generate a strong one): "
  read -r pw_input
  [ -n "$pw_input" ] && user_password="$pw_input"
}

# --------------- Main functions --------------- #

perform_install() {
  check_root
  check_supported_os
  ask_questions

  if [ -d "$PANEL_DIR" ] && [ -n "$(ls -A "$PANEL_DIR" 2>/dev/null)" ]; then
    fatal "An existing Panel installation was detected at $PANEL_DIR. This script only supports fresh installations."
  fi

  output "Starting AURORA 2.0 Panel installation.. this might take a while!"
  dep_install
  panel_dl
  install_composer_deps
  create_db_user "$MYSQL_USER" "$MYSQL_PASSWORD" "$MYSQL_DB"
  configure
  set_folder_permissions
  migrate_db
  create_admin
  insert_cronjob
  import_eggs
  set_folder_permissions
  configure_nginx
  [ "$CONFIGURE_LETSENCRYPT" == true ] && letsencrypt

  output ""
  success "AURORA 2.0 Panel installed!"
  output ""
  local panel_scheme="http"
  if [ "$ASSUME_SSL" == true ] || [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    panel_scheme="https"
  fi
  output "  Panel URL : ${panel_scheme}://$FQDN"
  output "  Admin user: $user_username ($user_email)"
  output "  Admin pass: $user_password   ← change this after first login"
  output ""
  output "Database '$MYSQL_DB' was created with random credentials and written"
  output "only to $PANEL_DIR/.env. The installer log is at $LOG_PATH."
  output ""
  output "Next steps:"
  output "  1. Log in and change the admin password."
  output "  2. Create a Location and a Node under Admin → Nests/Locations/Nodes."
  output "  3. Run the Wings installer on your game node: install.sh → Wings."
}

# ------------------- Install ------------------ #

perform_install
