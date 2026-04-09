import requests

url = "https://data-real-time-2.onrender.com/donnees"

r = requests.get(url)

print(r.status_code)
print(len(r.json()))