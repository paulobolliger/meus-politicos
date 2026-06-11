import urllib.request
import urllib.parse
import json

def test_wikidata_states():
    query = """
    SELECT ?state ?stateLabel ?stateIso WHERE {
      # Instance of Q3184121 (state of Brazil) or Q51929311 (federative unit of Brazil)
      VALUES ?class { wd:Q3184121 wd:Q51929311 }
      ?state wdt:P31 ?class .
      OPTIONAL { ?state wdt:P300 ?stateIso . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
    }
    LIMIT 35
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
            print(f"Encontrados {len(results)} estados.")
            for r in results[:10]:
                print({
                    'state': r.get('state', {}).get('value'),
                    'label': r.get('stateLabel', {}).get('value'),
                    'iso': r.get('stateIso', {}).get('value')
                })
    except Exception as e:
        print("Erro:", e)

if __name__ == '__main__':
    test_wikidata_states()
