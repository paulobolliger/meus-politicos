import requests

url_dca = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca'
r = requests.get(url_dca, params={'an_exercicio': 2023, 'id_ente': 3550308}, timeout=30)
if r.status_code == 200:
    items = r.json().get('items', [])
    annexes = set(item.get('anexo') for item in items if item.get('anexo'))
    print("Unique DCA Annexes:", annexes)
    
    # Let's inspect some items for DCA-Anexo I-C and DCA-Anexo I-D
    ic_items = [i for i in items if i.get('anexo') == 'DCA-Anexo I-C']
    id_items = [i for i in items if i.get('anexo') == 'DCA-Anexo I-D']
    
    print(f"\nDCA-Anexo I-C: {len(ic_items)} items")
    if ic_items:
        print("Sample I-C items (first 5):")
        for i in ic_items[:5]:
            print(f"  Col: {i.get('coluna')} | Cod: {i.get('cod_conta')} | Account: {i.get('conta')} | Val: {i.get('valor')}")
            
    print(f"\nDCA-Anexo I-D: {len(id_items)} items")
    if id_items:
        print("Sample I-D items (first 5):")
        for i in id_items[:5]:
            print(f"  Col: {i.get('coluna')} | Cod: {i.get('cod_conta')} | Account: {i.get('conta')} | Val: {i.get('valor')}")
