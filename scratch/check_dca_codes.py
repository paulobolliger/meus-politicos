import requests

url_dca = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca'
params = {
    'an_exercicio': 2024,
    'id_ente': 1200401, # Rio Branco - AC
}
r = requests.get(url_dca, params=params, timeout=30)
if r.status_code == 200:
    items = r.json().get('items', [])
    print(f"Rio Branco - AC (1200401) items count in 2024: {len(items)}")
    if items:
        # Let's inspect a few items
        for i in items[:5]:
            print(i)
else:
    print("Error:", r.status_code)
