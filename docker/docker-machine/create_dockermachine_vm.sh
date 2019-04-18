#! /bin/bash

# Créer une machine virtuelle avec 'docker-machine' utilisant le driver
# 'virtualbox' et ayant pour nom 'Kapten'

VM_NAME="Kapten"

set -o errexit

if [ "$#" -gt 0 ]; then
	if [ "$1" = "-u" ] || [ "$1" = "--undo" ]; then
		(set -x; docker-machine stop $VM_NAME && docker-machine rm $VM_NAME)
	elif [ "$1" = "-c" ] || [ "$1" = "--check" ]; then
		(set -x; docker-machine ls)
	else
		echo Usage: "${0} [OPTION]"
		echo "-u   --undo"
		echo "-c   --check"
	fi
	exit 1
fi

set -o xtrace
docker-machine create --driver virtualbox $VM_NAME

# Sources:
# https://docs.docker.com/machine/reference/create/
# List all available virtual machines: 			`VBoxManage list vms`
# List all running available virtual machines:	`VBoxManage list runningvms`
