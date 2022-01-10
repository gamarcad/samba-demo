from json import load
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from pydantic.utils import smart_deepcopy
from .model import *
from random import randint

import os

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def home(): return "No Failure"


# ------------------------------
# /samba/create
# Input: SambaPartyCreation
# Ouput: Lot of stuff
# ------------------------------
class SambaPartyCreation:
    algorithm : str
    budget: int

def create_samba_party( algorithm, k, budget, dataset, threshold ): 
    # pick a random iteration
    it_min, it_max = getIterationRange()
    iteration = randint( it_min, it_max )
    print("Loaded Iteration number", iteration)

    # load the corresponding file
    execution = load_file( dataset, k, threshold, algorithm, iteration )
    execution["algorithm"] = algorithm
    nb_arms = len(execution["probs"])
    execution["turns"] = list(
        filter( lambda turn: turn["turn"] <= budget, execution["turns"] )
        )
    execution["budget"] = budget
    execution["nb_arms"] = nb_arms

    # load precomputed time
    execution["time"] = {
        "security": load_security(),
        "components": load_execution_time_by_components(dataset, k, threshold)
    }

    return execution




@app.get("/samba/")
def hello(): return "Hello"

possibleAlgorithms = [
    'epsilon-greedy',
    'thompson-sampling',
    'ucb',
]


@app.get("/samba/history")
def history():
    k, budget, dataset, threshold = 4, 500, 'googlelocal', 0.2
    executions = []
    for algorithm in possibleAlgorithms:
        for _ in range(5):
            executions.append( create_samba_party( algorithm, k, budget, dataset, threshold ) )
    return executions

import sys

@app.post("/samba/create")
async def samba( request : Request ):
    data = await request.json()
    try:
        algorithm, k, budget, dataset, threshold = data["algorithm"], int(data["k"]), int(data["budget"]), data['dataset'], int(data['threshold'])
        return create_samba_party( algorithm, k, budget, dataset, threshold )

    except KeyError as e:
        raise HTTPException(status_code=400, detail="Expected algoritm and budget items") 
    

    


