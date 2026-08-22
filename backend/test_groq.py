import httpx, os, json
import sys
sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv('../.env')

key = os.getenv('GROQ_API_KEY')
model = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
url = 'https://api.groq.com/openai/v1/chat/completions'
headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

prompt = """You are a smart hospital revenue analyst AI for an Indian OPD/diagnostic clinic.

Today's Financial Snapshot:
- Total Registered Patients (All-Time): 10
- Today's Visits: 2
- Today's Revenue: Rs 1500
- Outstanding Dues: Rs 400

Generate a smart, 2-sentence business insight in JSON format.
Output ONLY valid JSON, no preamble:
{
  "insight": "2-sentence data-driven business insight",
  "action": "One specific recommended action for today",
  "metric_highlight": "The single most important number/stat to display",
  "sentiment": "positive"
}"""

payload = {
    'model': model,
    'messages': [{'role': 'user', 'content': prompt}],
    'temperature': 0.3,
    'response_format': {'type': 'json_object'},
    'reasoning_format': 'hidden',
    'max_tokens': 1200
}

res = httpx.post(url, headers=headers, json=payload)
print(f'Status: {res.status_code}')
print(f'Body: {res.text}')

