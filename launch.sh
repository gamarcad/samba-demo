#! /bin/bash
# File: launch.sh
# Author: Gael Marcadet <gael.marcadet@limos.fr>
# Description: Launch the Samba Demo. 

set -e

# ------------------------------------
# Parsing arguments
# ------------------------------------
# In case where all arguments are not provided, display the usage
if [ $# -ne 3 ]; then
	echo "Usage: $0 (download|no-download) (data|no-data) (build|no-build)"
	echo "	(download|no-download):		Specify if datasets must be downloaded (DISCLAIMER: Could take a few minutes)."
	echo "	(data|no-data):			Generate data."
	echo "	(build|no-build):		Build the Docker containers."

	echo ""
	echo "Examples:"
	echo "	First time: $0 download data build"
	echo "	After being away: $0 no-download data build"
	echo "	In case you are confident: $0 no-download data no-build"
	exit 0
fi


downloadDataset=0
if [ $1 == "download" ]; then
	downloadDataset=1
fi


generatingDataset=1
if [ $2 == 'no-data' ]; then
	generatingDataset=0
fi


buildImages=0
if [ $3 == "build" ]; then
	buildImages=1
fi




# -------------------------------------
# Dependancies installation
# -------------------------------------
# ensure that Docker is installed
if [ -z $(which docker) ]; then
	echo "[*] Installing Docker..."
	sudo apt-get remove docker docker-engine docker.io containerd runc
	sudo apt-get update
	sudo apt-get install \
	    apt-transport-https \
	    ca-certificates \
	    curl \
	    gnupg \
	    lsb-release
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
	echo "[+] Docker installed"
	echo \
	  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
	  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	sudo apt-get update
	sudo apt-get install docker-ce docker-ce-cli containerd.io

else
	echo "[+] Docker installed, skipping installation"
fi

# ensures that docker-compose is installed
if [ -z $(which docker-compose) ]; then
	echo "[*] Docker-Compose not installed yet, procedding to the installation..."
	sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
	sudo chmod +x /usr/local/bin/docker-compose
	sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
	echo "[+] Docker-Compose successfully installed"
else
	echo "[+] Docker-Compose already intalled, skipping installation"
fi

# First generate the data
if [ $generatingDataset -eq 1 ]; then
	echo "[+] Calling data generation script"
	cd data
	chmod +x generate-data.sh
	if [ $downloadDataset -eq 1 ]; then		
		args='download'
	else
		args='no-download'
	fi
	./generate-data.sh $args
	echo "[+] Data have been generated successfully"
	cd ..
else
	echo "[+] Skipping data generation"
fi



# Building Docker containers
if [ $buildImages -eq 1 ]; then
	echo "[*] Building Docker containers"
	sudo docker-compose  build
	echo "[+] Docker containers built"
else
	echo "[+] Docker containers building not required: skipping"
fi

# Running the Docker containers
echo "[*] Running docker containers"
sudo docker-compose up
