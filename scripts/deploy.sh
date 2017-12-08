#!/bin/bash

set -eux

node_modules/flow-bin/flow-osx-v0.60.1/flow
npx babel src --out-dir dist
tar czf dist.tgz dist node_modules
scp dist.tgz slackbot:/home/ec2-user/memeboot/dist.tgz
