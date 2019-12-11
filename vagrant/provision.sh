#!/bin/bash
set -e

export DEBIAN_FRONTEND=noninteractive

echo
echo Installing required base components
apt-get update
apt-get -y install apt-transport-https dirmngr curl htop iotop

echo
echo Adding repositories
cat << EOF > /etc/apt/sources.list.d/nodesource.list
deb https://deb.nodesource.com/node_11.x buster main
deb-src https://deb.nodesource.com/node_11.x buster main
EOF
curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -

echo
echo Updating apt cache
apt-get update

echo
echo Installing packages...
apt-get -y install build-essential nodejs

echo
echo Installing node packages
su vagrant
cd /code
npm install
