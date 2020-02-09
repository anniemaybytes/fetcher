#!/bin/bash
set -e

export DEBIAN_FRONTEND=noninteractive

echo
echo Installing node packages
cd /code
sudo -u vagrant npm i --no-save
