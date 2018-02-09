#!/bin/bash

set -eux

scripts/build.sh

tgz="$(npm pack)"
scp "$tgz" "memeboot:/home/ec2-user/$tgz"
ssh memeboot <<EOF
set -eux

WEBROOT=/usr/share/nginx/memeboot

# Cleanup old package
sudo rm -rf "$WEBROOT"

# Install new package
tar zxvf "$tgz"
sudo mv package "$WEBROOT"
sudo cp .prodenv "$WEBROOT"

cd "$WEBROOT"

# Install prereqs
npm install

# Run DB migrations
node_modules/.bin/knex migrate:latest

# Shutdown old server, if running
killall node || true

# Startup
npm run build
sudo /usr/local/bin/node --trace-warnings lib/server.js &> /var/log/node/access.log &
EOF
