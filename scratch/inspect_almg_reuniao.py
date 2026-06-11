import json

with open("scratch/almg_reuniao_detail.json", "r") as f:
    data = json.load(f)

reuniao = data.get("reuniao", {})
print("Reuniao keys:", list(reuniao.keys()))

# Let's inspect different parts
partes = ["primeiraParte", "segundaParte", "terceiraParte"]
for p in partes:
    if p in reuniao:
        print(f"\n{p} keys:", list(reuniao[p].keys()))

# Inspect segundaParte details
segunda = reuniao.get("segundaParte", {})
fases = ["primeiraFase", "SegundaFase", "terceiraFase"]
for f in fases:
    if f in segunda:
        print(f"\n- segundaParte.{f} keys:", list(segunda[f].keys()))

# Let's look at the first item in ordemDoDia that has acoes
ordem = segunda.get("SegundaFase", {}).get("ordemDoDia", [])
for idx, item in enumerate(ordem):
    acoes = item.get("acoes", [])
    if acoes:
        print(f"\nordemDoDia[{idx}] proposicao:", item.get("proposicao", {}).get("numero"), item.get("proposicao", {}).get("tipo", {}).get("sigla"))
        print(f"Number of acoes: {len(acoes)}")
        for a_idx, acao in enumerate(acoes):
            print(f"  acao[{a_idx}] keys:", list(acao.keys()))
            if "resultado" in acao.get("descricao", "").lower() or "vot" in acao.get("descricao", "").lower():
                print(f"  acao[{a_idx}] desc:", acao.get("descricao"))
                print(f"  acao[{a_idx}] text:", acao.get("texto"))
            # If there are votes in the action
            for k in acao.keys():
                if "voto" in k.lower() or "presen" in k.lower():
                    print(f"  acao[{a_idx}] {k}:", str(acao[k])[:200])
        break
