import requests
import json

url = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo'
params = {
    'an_exercicio': 2024,
    'in_periodicidade': 'B',
    'nr_periodo': 6, # 6º bimestre
    'co_tipo_demonstrativo': 'RREO',
    'no_anexo': 'RREO-Anexo 01',
    'co_esfera': 'M', # Município
    'co_municipio_ibge': 3550308, # São Paulo - SP (7 dígitos)
}

print("Fetching RREO-Anexo 01 for SP...")
r = requests.get(url, params=params, timeout=30)
print("Status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    items = data.get('items', [])
    print("Found", len(items), "items")
    # Save a sample to file
    with open('scratch/sample_rreo.json', 'w', encoding='utf-8') as f:
        json.dump(items[:100], f, indent=2, ensure_ascii=False)
    
    # Print some unique accounts
    accounts = set()
    columns = set()
    for item in items:
        accounts.add(item.get('no_conta'))
        columns.add(item.get('coluna'))
    
    print("\nColumns:")
    for c in sorted(list(columns)):
        print("-", c)
        
    print("\nSample accounts (first 20):")
    for a in sorted(list(accounts))[:20]:
        print("-", a)
else:
    print(r.text)
