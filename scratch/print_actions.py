import json

with open("scratch/almg_reuniao_detail.json", "r") as f:
    data = json.load(f)

ordem = data.get("reuniao", {}).get("segundaParte", {}).get("SegundaFase", {}).get("ordemDoDia", [])
for i, item in enumerate(ordem):
    acoes = item.get("acoes", [])
    prop = item.get("proposicao") or {}
    num = prop.get("numero")
    sigla = prop.get("tipo", {}).get("sigla") if prop.get("tipo") else ""
    print(f"Item {i} (Prop: {num} {sigla}):")
    for a in acoes:
        print(f"  - Action: {a.get('descricao')}")
