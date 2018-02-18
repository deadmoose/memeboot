#!/bin/bash

set -eux

scp scripts/deploy/nginx.conf "memeboot:/etc/nginx/nginx.conf"
scp scripts/deploy/policy.xml "memeboot:/etc/ImageMagick/policy.xml"

ssh memeboot <<EOF
# Install packages
sudo yum -y update
sudo yum -y install postgresql96 nginx ImageMagick emacs
# Install nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 9.4.0
node -e "console.log('Running Node.js ' + process.version)"

sudo mkdir /var/log/node
sudo service nginx start
EOF
