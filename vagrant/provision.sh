#!/bin/bash
set -e

export DEBIAN_FRONTEND=noninteractive

echo
echo Updating apt cache
apt-get update

apt-get -y --force-yes install apt-transport-https

echo
echo Adding repositories
cat << EOF > /etc/apt/sources.list.d/nodesource.list
deb https://deb.nodesource.com/node_5.x wheezy main
deb-src https://deb.nodesource.com/node_5.x wheezy main
EOF
apt-key add /vagrantroot/nodesource.gpg.key

echo
echo Updating apt cache
apt-get update

echo
echo Installing packages...
apt-get -y --force-yes install build-essential nodejs

echo
echo Installing node packages
su vagrant
cd /code
npm install
