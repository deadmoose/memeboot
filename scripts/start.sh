#!/bin/bash

set -eux

scripts/build.sh
node lib/server.js
