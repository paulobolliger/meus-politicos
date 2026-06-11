import urllib.request
import urllib.parse
import json

def test_sp_secretariats():
    query = """
    SELECT ?sec ?secLabel ?website ?headLabel ?image WHERE {
      # Located in SP state (Q174)
      ?sec wdt:P131 wd:Q174 .
      # Instance of government agency Q327333 or government department Q192611
      VALUES ?class { wd:Q327333 wd:Q192611 }
      ?sec wdt:P31/wdt:P279* ?class .
      
      OPTIONAL { ?sec wdt:P856 ?website . }
      OPTIONAL { ?sec wdt:P2389 ?head . }
      OPTIONAL { ?sec wdt:P18 ?image . }
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
    }
    LIMIT 30
    """
    
    url = "https://query.wikidata.org/sparql?query=" + urllib.parse.quote(query) + "&format=json"
    headers = {
        'User-Agent': 'MeusPoliticosBot/2.0 (https://meus-politicos.org; contato@meus-politicos.org) python-urllib/3.10'
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = data.get('results', {}).get('bindings', [])
            print(f"Encontradas {len(results)} secretarias para SP.")
            for r in results:
                print({
                    'sec': r.get('secLabel', {}).get('value'),
                    'website': r.get('website', {}).get('value'),
                    'head': r.get('headLabel', {}).get('value'),
                    'image': r.get('image', {}).get('value')
                })
    except Exception as e:
        print("Erro:", e)

if __name__ == '__main__':
    test_sp_secretariats()
