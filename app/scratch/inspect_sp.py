import urllib.request
import json

def inspect_sp():
    url = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q174&props=claims&format=json"
    headers = {
        'User-Agent': 'MeusPoliticosBot/2.0 (https://meus-politicos.org; contato@meus-politicos.org) python-urllib/3.10'
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            claims = data.get('entities', {}).get('Q174', {}).get('claims', {})
            # Print P31 claims (instance of)
            p31_claims = claims.get('P31', [])
            for c in p31_claims:
                val = c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')
                print(f"São Paulo is instance of (P31): {val}")
            
            # Print ISO code P300
            p300_claims = claims.get('P300', [])
            for c in p300_claims:
                val = c.get('mainsnak', {}).get('datavalue', {}).get('value')
                print(f"São Paulo P300 (ISO): {val}")
    except Exception as e:
        print("Erro:", e)

if __name__ == '__main__':
    inspect_sp()
