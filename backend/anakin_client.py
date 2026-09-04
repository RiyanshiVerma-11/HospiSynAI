import logging
import httpx
from typing import Optional, Dict, Any

logger = logging.getLogger("anakin_client")

ANAKIN_MCP_URL = "https://mcp.anakin.io/mcp"

async def fetch_live_drug_rate_via_anakin(query_term: str) -> Optional[Dict[str, Any]]:
    """
    Connects to Anakin's official MCP Server (https://mcp.anakin.io/mcp)
    to perform live web reading/scraping for medicine prices and NHA/CGHS rate caps.
    """
    headers = {
        "Accept": "text/event-stream, application/json",
        "Content-Type": "application/json"
    }
    
    # JSON-RPC 2.0 tool call to Anakin MCP server
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "web_search",
            "arguments": {
                "query": f"NHA Ayushman Bharat CGHS capped rate and market MRP for {query_term} in India 2026"
            }
        },
        "id": 1
    }
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(ANAKIN_MCP_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                logger.info(f"Anakin MCP response received for {query_term}")
                return data
            else:
                logger.warning(f"Anakin MCP returned status {res.status_code}")
    except Exception as e:
        logger.warning(f"Anakin MCP live fetch fallback triggered: {e}")
        
    return None
