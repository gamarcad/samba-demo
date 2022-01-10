# ======================================
# file: model.py
# ======================================
import json
from json.decoder import JSONDecoder
from typing import Tuple
DATA_LOCATION = "/data"


class Algorithms:
    THOMPSON_SAMPLING = ( "thompson-sampling" )

def getIterationRange() -> Tuple[int, int]: return 0, 19

def load_file( dataset, k, threshold, algorithm, iteration ):
    with open( f"{DATA_LOCATION}/{dataset}_{k}_{threshold}/execution_{algorithm}_{iteration}.json" ) as file:
        return json.loads( "".join(file.readlines()) )

def load_security():
    with open(f"{DATA_LOCATION}/security.json") as file:
        return json.loads( "".join(file.readlines()) )

def load_execution_time_by_components( dataset, k, threshold ):
    with open(f"{DATA_LOCATION}/{dataset}_{k}_{threshold}/execution_time_by_components.json") as file:
        return json.loads("".join(file.readlines()))