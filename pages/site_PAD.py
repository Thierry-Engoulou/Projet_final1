import requests
import pandas as pd
import time

API_URL = "https://data-real-time-2.onrender.com/donnees"

LIMIT = 1000
MAX_DATA =100000

all_data = []
skip = 0

print("Téléchargement des 50000 données les plus récentes...")

while len(all_data) < MAX_DATA:

    params = {
        "skip": skip,
        "limit": LIMIT
    }

    try:

        r = requests.get(API_URL, params=params, timeout=60)

        if r.status_code != 200:
            print("Erreur API :", r.status_code)
            break

        data = r.json()

        if not data:
            break

        all_data.extend(data)

        print(len(all_data), "lignes téléchargées")

        skip += LIMIT

        time.sleep(1)

    except Exception as e:

        print("Erreur :", e)
        print("Nouvelle tentative dans 5 secondes...")
        time.sleep(5)


# garder seulement 20000
all_data = all_data[:100000]

df = pd.DataFrame(all_data)

df.to_csv("meteo_douala_50000_recent.csv", index=False)

print("Téléchargement terminé")
print("Fichier créé : meteo_douala_50000_recent.csv")