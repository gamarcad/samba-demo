import json
from json.decoder import JSONDecodeError
from os import replace
from typing import Dict, List
import re
from argparse import ArgumentParser


def extractGoogleData( filename : str, nBytesToRead : int, keys : List[str] ):
    file = open(filename, "r")
    file.seek(0)
    content = file.read(nBytesToRead)

    # we retreive each full entry (i.e., not the last one)
    tokens = content.split("}")
    tokens = tokens[:-1:1]

    textReviewPattern = re.compile( """\"reviewText\":[\n ]*'[A-Za-z .?"0-9(),:!$^*ù]*'""" )
    
    # parse, clean and recreate each entry
    l = [
        ("u'", "'"),
        ("\\", ""),
        ("'", 'XXXXXXXXXXXXXXXX'),
        ('"', "'"),
        ('XXXXXXXXXXXXXXXX', '"'),
        ("u\'", "'"),
        ("None", '""')
    ]  
    nLoadEntry = 0
    entries = []
    for index, token in enumerate(tokens):
        for r in l:
            token = token.replace( *r )
        token = token + "}"
        # remove the text review
        match = re.search( textReviewPattern, token )
        if match:
            textReview = match.group()
            token = token.replace( textReview, '"reviewtext": ""' )

        try:
            jsonDict = json.loads(token)
            entry = {}
            for k in keys:
                if k in jsonDict:
                    entry[k] = jsonDict[k]
            entries.append(entry)
            nLoadEntry += 1
        except JSONDecodeError as e:
            if False:
                print(f"Failure on {token}: {e}")
                exit(1)

        print(f"\r[Parsing {filename}  {round(index  * 100 /  len(tokens))}%] Parsed: {nLoadEntry}, Failed: {index - nLoadEntry + 1}", end=" " * 20)

    print("")


    return entries

from textblob import TextBlob

def extractSteamData( filename : str, nBytesToRead : int, keys : List[str] ): 
    file = open(filename, "r")
    file.seek(0)
    content = file.read(nBytesToRead)

    # we retreive each full entry (i.e., not the last one)
    tokens = content.split("}")
    tokens = tokens[:-1:1]

    textReviewPattern = re.compile( """\"text\":[\n ]*'[A-Za-z .?"0-9(),:!$^*ù]*'""" )
    
    # parse, clean and recreate each entry
    l = [
        ("u'", "'"),
        ("\\", ""),
        ("'", 'XXXXXXXXXXXXXXXX'),
        ('"', "'"),
        ('XXXXXXXXXXXXXXXX', '"'),
        ("u\'", "'"),
        ("None", '""'),
        ("True", '""'),
        ("False", '""')
    ]  
    nLoadEntry = 0
    entries = []
    for index, token in enumerate(tokens):
        for r in l:
            token = token.replace( *r )
        token = token + "}"

        try:
            jsonDict = json.loads(token)
            entry = {}
            for k in keys:
                if k in jsonDict:
                    entry[k] = jsonDict[k]
            entries.append(entry)
            nLoadEntry += 1
        except JSONDecodeError as e:
            if False:
                print(f"Failure on {token}: {e}")
                print(token[e.colno-5:e.colno - 1], "->", token[e.colno] , "<-", token[e.colno:e.colno + 5])
                exit(1)

        print(f"\r[Parsing {filename}  {round(index  * 100 /  len(tokens))}%] Parsed: {nLoadEntry}, Failed: {index - nLoadEntry + 1}", end=" " * 20)

    print("")
    
    return entries

def mapReduce( items, hash, itemProcessor = lambda item: item ) -> Dict:
    res = {}
    for v in items:
        key = hash(v)
        if key not in res: res[key] = []
        res[key].append(itemProcessor(v))
    return res

def filterDictByScore( dict, scoreFunction, k ):
    res = []
    for key, value in dict.items():
        res.append((scoreFunction(value), key, value))
    res.sort(reverse=True)
    
    return {
        key: value
        for _, key, value in res[:k]
    }

def mean( list ): return sum(list) / len(list)


thresholds = [2, 3, 4, 5]
k_set = [ 3, 4, 5 ]

def createParser(): 
    parser = ArgumentParser()
    parser.add_argument( "--google-dataset", required=True)
    parser.add_argument( "--steam-dataset", required=True )
    parser.add_argument( "--google-output", required=True )
    parser.add_argument( "--steam-output", required=True )
    return parser


if __name__ == "__main__":
    # parse argument
    parser = createParser()
    args = parser.parse_args()

    if True:
        google = extractGoogleData( args.google_dataset, 1000000000, ["rating", "gPlusPlaceId"] )
        google = mapReduce( google, hash=lambda entry: entry["gPlusPlaceId"], itemProcessor=lambda entry: entry["rating"] )


        # creating the probs
        googleProbs = {}
        for k in k_set:
            googleProbs[k] = {}
            data = filterDictByScore( google, scoreFunction=lambda ratings: len(ratings), k=k )
            for threshold in thresholds:
                probs = [
                    mean([ 1 if rating >= threshold else 0 for rating in ratings ])
                    for companyId, ratings in data.items()
                ]
                googleProbs[k][ threshold ] = probs

        with open(  args.google_output, 'w' ) as file:
            file.write(json.dumps(googleProbs))            

    if True:
        # extracting data
        data = extractSteamData(  args.steam_dataset, 50000000, ["product_id", "text"] )

        # transforming text into ratings
        steam = []
        for index, entry in enumerate(data):
            print(f"\r[Ratings Extraction ({int(index / len(data) * 100)}% )] Extracting sentiment from entry {index}", end=" " * 20)
            steam.append({
                "product_id": entry["product_id"],
                "rating": int((TextBlob(entry["text"]).sentiment.polarity + 1) * 5 / 2)
            })

        
        # compute probs
        steamProbs = {}
        steam = mapReduce( steam, hash = lambda entry: entry["product_id"], itemProcessor=lambda entry: entry["rating"] )
        for k in k_set:
            steamProbs[k] = {}
            data = filterDictByScore( steam, scoreFunction=lambda ratings: len(ratings), k=k )
            for threshold in thresholds:
                probs = [
                    mean([ 1 if rating >= threshold else 0 for rating in ratings ])
                    for productId, ratings in data.items()
                ]
                steamProbs[k][ threshold ] = probs

        # exporting probs
        with open(  args.steam_output, 'w' ) as file:
            file.write( json.dumps(steamProbs) )
        

        


    