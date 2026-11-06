# HORIZON Local AI Inference Server

This is a reference implementation of an OpenAI-compatible inference server that runs on YOUR PC.
Replace the placeholder model loader with your actual model runtime (llama.cpp, vLLM, TGI, Ollama, etc.).
The HORIZON backend connects to this server through `AI_SERVER_BASE_URL`.

## Endpoints (OpenAI-compatible)
- GET /models
- POST /v1/chat/completions (streaming supported)
- (optional) GET /health

## Security
- Bind to 127.0.0.1 only.
- Expose to the internet ONLY via a secure tunnel (Cloudflare Tunnel, ngrok, Tailscale/WireGuard) or VPN.
- Set AI_SERVER_API_KEY and require it in Authorization header.
- Never expose your PC's LAN IP.

## Tunnel examples
Cloudflare Tunnel:
  cloudflared tunnel --url http://127.0.0.1:8080
Then set AI_SERVER_BASE_URL to the generated https URL in the website backend.

## Run
  pip install -r requirements.txt
  python server.py
Default port 8080.