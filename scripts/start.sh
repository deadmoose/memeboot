#!/bin/bash

set -eux

scripts/build.sh
node --trace-warnings lib/server.js
