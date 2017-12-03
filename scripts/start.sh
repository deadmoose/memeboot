#!/bin/bash

set -eux

node_modules/flow-bin/flow-osx-v0.60.1/flow
npx babel src --out-dir lib
node lib/server.js
