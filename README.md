# SAMBA: a system for Secure federAted Multi-armed BAndits

Gael Marcadet, Radu Ciucanu, Pascal Lafourcade, Marta Soare, Sihem Amer-Yahia

[Demo paper accepted to ICDE 2022](https://icde2022.ieeecomputer.my/demo-accepted-papers/)


If you use our code, please cite
```
@inproceedings{MCLSA22,
  author    = {Marcadet, G. and Ciucanu, R. and Lafourcade, P. and Soare, M. and {Amer-Yahia}, S.},
  title     = {{SAMBA: A System for Secure Federated Multi-Armed Bandits}},
  booktitle = {IEEE International Conference on Data Engineering (ICDE) -- Demo},
  year      = {2022}
}

```

## Quick Install
To launch the demo, run the following command in your terminal in the root of the project:
```
./launch.sh download data build
```

Everything will be automatically installed, setup and run.

## Running Samba

### Requirements
To run the Samba Application, you have to get installed Docker and Docker-Compose.
If it is not, please refer to the [Docker Installation Guide](https://docs.docker.com/engine/install/ubuntu/).
In case where Docker-Compose is not installed, please refer to the [Docker-Compose Installation Guide](https://docs.docker.com/compose/install/#install-compose-on-linux-systems).

As an alternative, the following commands would install Docker and Docker-Compose on your system:
```sh
# install Docker
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get update
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# install Docker-Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

Type the following commands to be sure that every dependancies is well installed on your system:
```sh
sudo docker container run hello-world
sudo docker-compose version
```

### Pre-Computed Data
Samba Application need to access to some pre-computed data, included in the `Data` folder. These data can be refreshed by typing the following commands:
```sh
cd data
pip3 install -r requirements.txt 
python3 pre-computations.py
cd ..
```

### Starting Samba Application
The Samba Application is composed by an FastAPI backend written in Python 3.8 and a front-end written in Angular.

To limit the numerous system installation to get all dependancies, Docker and Docker-Compose have been used. Briefly, Docker is the engine that allows to set-up a ready-to-use virtual machine on your system called *container*. Docker-Compose, however, is able to set-up a network of virtual machines working together. 

In the case of Samba Application, there are two containers: the `samba-api` container executing the Samba API Python back-end, and the `samba-app` container executing the Angular front-end.

To run the Samba Application (i.e., the network of containers), assuming placed at the project root, type the following command in your terminal:
```sh
sudo docker-compose build
sudo docker-compose up
```

From this point, both api and app are running and are logging in your terminal.
To access to the application, open your favorite web browser at the address `http://localhost:4200`.
