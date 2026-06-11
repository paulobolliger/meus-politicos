import requests
import json

url_dca = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca'
params = {
    'an_exercicio': 2023,
    'id_ente': 3550308,
}
r = requests.get(url_dca, params=params, timeout=30)
if r.status_code == 200:
    items = r.json().get('items', [])
    
    # Let's inspect accounts in I-C (Revenues)
    ic_items = [i for i in items if i.get('anexo') == 'DCA-Anexo I-C']
    print("--- I-C UNIQUE ACCOUNTS WITH 'RECEITA' OR TOTALS ---")
    for i in ic_items:
        # Check for totals or root accounts
        if 'TOTAL' in i.get('conta', '').upper() or 'RECEITA' in i.get('conta', '').upper() or len(i.get('cod_conta', '')) < 10:
            print(f"  Col: {i.get('coluna')} | Cod: {i.get('cod_conta')} | Account: {i.get('conta')} | Val: {i.get('valor')}")

    # Let's inspect accounts in I-D (Expenditures)
    id_items = [i for i in items if i.get('anexo') == 'DCA-Anexo I-D']
    print("\n--- I-D UNIQUE ACCOUNTS WITH 'DESPESA' OR TOTALS ---")
    for i in id_items:
        if 'TOTAL' in i.get('conta', '').upper() or 'DESPESA' in i.get('conta', '').upper() or len(i.get('cod_conta', '')) < 10:
            print(f"  Col: {i.get('coluna')} | Cod: {i.get('cod_conta')} | Account: {i.get('conta')} | Val: {i.get('valor')}")
else:
    print("Error:", r.status_code)
