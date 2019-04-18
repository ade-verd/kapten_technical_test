#! /bin/bash

set -o xtrace

docker pull mongo
docker create --name mongodb -p 27017:27017 mongo
docker start mongodb