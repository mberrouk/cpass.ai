#!/bin/bash

# Script to initialize Let's Encrypt SSL certificates
# https://github.com/wmnnd/nginx-certbot

DOMAIN=${DOMAIN:-"cpass.linkpc.net"}
SUBDOMAIN=${SUBDOMAIN:-"cpass.cpass.linkpc.net"}
EMAIL=${EMAIL:-""}
STAGING=${STAGING:-0}

EMAIL=$(echo "$EMAIL" | tr -d "'\"")

domains=($DOMAIN $SUBDOMAIN)
rsa_key_size=4096
data_path="./certbot"
staging=$STAGING

echo "=== Let's Encrypt Certificate Setup ==="
echo "Primary domain: $DOMAIN"
echo "Subdomain: $SUBDOMAIN"
echo "Email: ${EMAIL:-'(none - will register without email)'}"
echo "Staging mode: $STAGING"
echo ""

if [ -f "$data_path/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo "Certificates already exist for $DOMAIN. Skipping initialization."
  echo "To force renewal, delete the certbot/conf directory first."
  exit 0
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### Creating dummy certificate for $DOMAIN ..."
path="/etc/letsencrypt/live/$DOMAIN"
mkdir -p "$data_path/conf/live/$DOMAIN"
docker compose -f dockercompose.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
docker compose -f dockercompose.yml up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $DOMAIN ..."
docker compose -f dockercompose.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for ${domains[@]} ..."

domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done
echo "Certificate will cover: ${domains[@]}"


case "$EMAIL" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $EMAIL" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose -f dockercompose.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker compose -f dockercompose.yml exec nginx nginx -s reload
