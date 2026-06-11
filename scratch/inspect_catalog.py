import requests
import re

url = "https://www.al.sp.gov.br/dados-abertos/catalogo"
r = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

print("Catalog page HTML length:", len(text))

# Search for any string containing 'api' or 'deputado' inside tags
matches = re.finditer(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>', text)
print("\nLinks in catalog:")
for m in matches:
    link = m.group(1)
    if 'api' in link or 'deputado' in link or 'xml' in link or 'json' in link:
        print(f"Match: {m.group(0)}")
