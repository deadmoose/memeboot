#!/bin/bash

node_modules/flow-bin/flow-osx-v0.60.1/flow
rm -r lib
npx babel src --out-dir lib
