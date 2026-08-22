import httpx, os
from dotenv import load_dotenv
load_dotenv('../.env')

key = os.getenv('GROQ_API_KEY')
model = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
url = 'https://api.groq.com/openai/v1/chat/completions'
headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

payload = {
    'model': model,
    'messages': [{'role': 'user', 'content': 'Say hello in 5 words.'}],
    'temperature': 0.7,
    'max_tokens': 50
}

res = httpx.post(url, headers=headers, json=payload)
print(f'Status: {res.status_code}')
print(f'Body: {res.text}')
