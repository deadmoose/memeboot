#!/bin/bash

set -eux

scripts/build.sh

tgz="$(npm pack)"
scp "$tgz" "slackbot:/home/ec2-user/$tgz"
ssh slackbot <<EOF
set -eux

# Cleanup old package
rm -r package

# Install new package
tar zxvf "$tgz"
cp .env package/.env
cd package

# Install prereqs
npm install

# Shutdown old server, if running
killall node || true

# Startup
npm run build
sudo /usr/local/bin/node --trace-warnings lib/server.js &
EOF
