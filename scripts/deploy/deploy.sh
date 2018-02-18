#!/bin/bash

set -eux

scripts/build.sh

MEMEBOOT_HOME="/home/ec2-user"

tgz="$(npm pack)"
scp "$tgz" "memeboot:${MEMEBOOT_HOME}/$tgz"
scp scripts/deploy/.prodenv "memeboot:${MEMEBOOT_HOME}/.prodenv"
ssh memeboot <<EOF
set -eux

WEBROOT=/usr/share/nginx/memeboot

# Cleanup old package
sudo rm -rf "\${WEBROOT}"

# Install new package
tar zxvf "$tgz"
sudo mv package "\${WEBROOT}"
sudo cp .prodenv "\${WEBROOT}/.env"

cd "\${WEBROOT}"

# Install prereqs
npm install

# Run DB migrations
node_modules/.bin/knex migrate:latest

# Shutdown old server, if running
killall node || true

# Startup
npm run build
sudo NODE_BINARY=\$(which node) sh -c '\${NODE_BINARY} --trace-warnings lib/server.js &> /var/log/node/access.log &'

echo "Deployed $tgz successfully!"
EOF
