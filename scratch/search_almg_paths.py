import json
import os

path_json = "scratch/almg_paths.json"

if os.path.exists(path_json):
    with open(path_json, "r") as f:
        paths = json.load(f)
    
    print("Total paths:", len(paths))
    print("\nAll paths:")
    for p in sorted(paths):
        print(f"- {p}")
else:
    print("almg_paths.json not found!")
