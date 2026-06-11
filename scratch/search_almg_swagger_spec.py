import requests
import json

print("Downloading Swagger specification from ALMG...")
try:
    spec = requests.get("https://dadosabertos.almg.gov.br/api/ajuda/swagger/endpoints/lastest", timeout=15).json()
except Exception as e:
    print("Failed to download spec:", e)
    exit(1)

print("Spec downloaded successfully. Searching for vote/presence terms...")

terms = ["voto", "vote", "presen", "frequen", "reuniao", "plenario"]
matches = []

# Search in paths
for path, path_info in spec.get("paths", {}).items():
    path_str = json.dumps(path_info).lower()
    found_terms = [t for t in terms if t in path_str or t in path.lower()]
    if found_terms:
        matches.append((path, found_terms))

print(f"\nFound {len(matches)} paths matching search terms:")
for path, found in matches:
    print(f"- {path} (matched: {found})")

# Let's inspect definitions or components if they exist
components = spec.get("components", {}) or spec.get("definitions", {})
print(f"\nSearching in definitions/components (total keys: {len(components)})...")
def_matches = []
for name, schema in components.items():
    schema_str = json.dumps(schema).lower()
    found_terms = [t for t in terms if t in schema_str or t in name.lower()]
    if found_terms:
        def_matches.append((name, found_terms))

print(f"Found {len(def_matches)} definitions matching search terms:")
for name, found in def_matches[:30]:
    print(f"- {name} (matched: {found})")
