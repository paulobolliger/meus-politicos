import requests
import re

url = 'https://www.al.sp.gov.br/dados-abertos/api/deputado?partido=PT'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

print("HTML length:", len(text))

# Search for occurrences of '/dados-abertos-web-service/' with 150 chars around
print("\nContext for 'dados-abertos-web-service':")
matches = re.finditer(r'dados-abertos-web-service', text)
for m in matches:
    start = max(0, m.start() - 100)
    end = min(len(text), m.end() + 100)
    print("--- MATCH ---")
    print(text[start:end].strip())

# Search for any absolute URLs
urls = re.findall(r'https?://[^\s"\'>]+', text)
print("\nAbsolute URLs found in HTML:")
for u in sorted(list(set(urls))):
    if any(x in u for x in ['api', 'xml', 'json', 'deputado', 'dados']):
        print("-", u)
