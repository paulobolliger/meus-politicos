import requests
import re

url = 'https://www.al.sp.gov.br/dados-abertos/api/deputado?partido=PT'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

print("=== Raw Table HTML ===")
tables = re.findall(r'<table.*?>(.*?)</table>', text, re.DOTALL)
for i, table in enumerate(tables):
    print(f"\nTable {i}:")
    rows = re.findall(r'<tr.*?>(.*?)</tr>', table, re.DOTALL)
    for r_idx, row in enumerate(rows):
        cells = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', row, re.DOTALL)
        cells_cleaned = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
        print(f"  Row {r_idx}:", cells_cleaned)

print("\n=== All links in Exemplos section ===")
links = re.findall(r'<a\s+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', text)
for href, anchor in links:
    if 'dados-abertos-web-service' in href:
        print(f"- {anchor.strip()} -> {href.strip()}")
