#!/bin/bash

set -eux

scp scripts/deploy/.prodenv "memeboot:/home/ec2-user/.prodenv"

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
sudo cp scripts/deploy/nginx.conf /etc/nginx/nginx.conf
sudo service nginx start
EOF
