#! /bin/bash
# Author: Gael Marcadet <gael.marcadet@limos.fr>
# Description: Generate data

# we want to exit on the first error
set -e

# ---------------------------------
# Requirements
# ---------------------------------
# Ensure that required python3 libraries are installed
pip3 install -r requirements.txt


# Ensure that wget is installed on the system
if [ -z $(which wget) ]; then
    echo "[*] Installing wget..."
    sudo apt-get install -y wget
    echo "[+] wget installed"
fi

# if datasets must not be downloaded
downloadDataset=1
if [ "$1" == "no-download" ]; then
    downloadDataset=0
fi

# if probs must be computed
computeProbs=1
if [ "$2" == "no-probs" ]; then
    computeProbs=0
fi

# creating folders if missing
GOOGLE_DATASET_FOLDER="datasets/googlelocal"
STEAM_DATASET_FOLDER="datasets/steam"
if [ ! -e $GOOGLE_DATASET_FOLDER ]; then
    echo "[+] Creating Google dataset folder"
    mkdir $GOOGLE_DATASET_FOLDER
fi
if [ ! -e $STEAM_DATASET_FOLDER ]; then
    echo "[+] Creating Steam dataset folder"
    mkdir $STEAM_DATASET_FOLDER
fi

GOOGLE_DATASET_GZ="$GOOGLE_DATASET_FOLDER/googlelocal-reviews.gz"
GOOGLE_DATASET_FILE="$GOOGLE_DATASET_FOLDER/googlelocal-reviews"
STEAM_DATASET_GZ="$STEAM_DATASET_FOLDER/steam-reviews.gz"
STEAM_DATASET_FILE="$STEAM_DATASET_FOLDER/steam-reviews"
if [ $downloadDataset -eq 1 ]; then
    echo "[*] Getting dataset"
    # Download datasets
    ROOT=$(pwd)


    if [ ! -e $GOOGLE_DATASET_GZ ]; then
        echo "[*] Downloading Google Local Reviews Dataset..."
        wget deepyeti.ucsd.edu/jmcauley/datasets/googlelocal/reviews.clean.json.gz -O $GOOGLE_DATASET_GZ
    fi
    if [ ! -e $GOOGLE_DATASET_FILE ]; then
        echo "[+] Unzipping dataset"
        cd $GOOGLE_DATASET_FOLDER
        gzip -d --keep $(pwd)/googlelocal-reviews.gz
        cd "$ROOT"
    fi
    echo "[+] Google Local Reviews Dataset ready-to-use"

    if [ ! -e "$STEAM_DATASET_GZ" ]; then
        echo "[*] Downloading Steam Reviews Dataset..."
        wget cseweb.ucsd.edu/~wckang/steam_reviews.json.gz -O $STEAM_DATASET_GZ
    fi
    if [ ! -e $STEAM_DATASET_FILE ]; then
        echo "[+] Unzipping dataset"
        cd $STEAM_DATASET_FOLDER
        gzip -d --keep $(pwd)/steam-reviews.gz
        cd "$ROOT"
    else
        echo "[+] Steam dataset already exists"
    fi



else
    echo "[+] Skipping datasets downloading"
fi

# Generating probs
PROBS_FOLDER="probs"
STEAM_PROBS="$PROBS_FOLDER/steam.probs"
GOOGLE_PROBS="$PROBS_FOLDER/googlelocal.probs"
if [ $computeProbs -eq 1 ]; then

    # creates the probs folder if missing
    if [ ! -e $PROBS_FOLDER ]; then
        mkdir $PROBS_FOLDER
    fi

    echo $GOOGLE_DATASET_FILE

    python3 probs-generator.py\
        --google-dataset "$GOOGLE_DATASET_FILE" \
        --google-output "$GOOGLE_PROBS" \
        --steam-dataset "$STEAM_DATASET_FILE" \
        --steam-output "$STEAM_PROBS"

fi

echo "[*] Generating data"
python3 pre-computations.py --steam-probs "$STEAM_PROBS" --google-probs "$GOOGLE_PROBS"
