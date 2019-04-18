#! /bin/bash

# Récupérer l’adresse IP de la machine virtuelle

VM_NAME="Kapten"

set -o errexit

if [ "$#" -gt 0 ]; then
	if [ "$1" = "-c" ] || [ "$1" = "--check" ]; then
	    (set -x; VBoxManage guestproperty enumerate $VM_NAME | grep IP)
	else
		echo Usage: "${0} [OPTION]"
		echo "-c   --check"
	fi
	exit 1
fi

set -o xtrace
docker-machine ip $VM_NAME

# Sources:
# https://docs.docker.com/machine/reference/ip/
