#! /bin/bash

# Assigner les variables spécifiques à la machine virtuelle 'Kapten' dans l’env
#    courant du terminal

VM_NAME="Kapten"

set -o errexit

if [ "$#" -gt 0 ]; then
	if [ "$1" = "-u" ] || [ "$1" = "--undo" ]; then
	    (set -x; eval $(docker-machine env --unset) && exec $SHELL -i)
	elif [ "$1" = "-c" ] || [ "$1" = "--check" ]; then
	    (set -x; env | grep DOCKER && exec $SHELL -i)
	else
		echo Usage: "${0} [OPTION]"
		echo "-u   --undo"
		echo "-c   --check"
	fi
	exit 1
fi

(set -x; eval "$(docker-machine env $VM_NAME)" && exec $SHELL -i)

# Sources:
# https://docs.docker.com/machine/reference/env/
# unset: `eval $(docker-machine env --unset)`