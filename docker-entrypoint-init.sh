#!/bin/bash

# This script automatically initializes Let's Encrypt certificates on first run

set -e

DOMAIN=${DOMAIN:-"cpass.linkpc.net"}
EMAIL=${EMAIL:-""}
CERT_PATH="./certbot/conf/live/$DOMAIN/fullchain.pem"

if [ -f "$CERT_PATH" ]; then
    echo "SSL certificates found. Starting services..."
    exec docker compose up -d
else
    echo "SSL certificates not found. Running Let's Encrypt initialization..."

    DOMAIN="$DOMAIN" EMAIL="$EMAIL" STAGING="${STAGING:-0}" ./init-letsencrypt.sh

    if [ $? -eq 0 ]; then
        echo " SSL certificates obtained successfully!"
        echo " Services are now running with HTTPS enabled."
    else
        echo " Failed to obtain SSL certificates."
        exit 1
    fi
fi
