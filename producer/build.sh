#! /bin/bash

set -o xtrace

docker build --tag 'producer:latest' .
docker create --name producer --link rabbitmq producer:latest
docker start producer