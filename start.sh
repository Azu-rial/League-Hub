#!/usr/bin/env bash
set -e
if [ ! -f .env ]; then cp .env.example .env; echo "Created .env — edit the secrets, then run again."; exit 1; fi
npm install
npm start
