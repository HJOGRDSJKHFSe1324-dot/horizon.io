@echo off
setlocal

echo Pulling base models if needed...
ollama pull qwen2.5-coder:1.5b
ollama pull Impulse2000/smollm3:3b-q4_k_m
ollama pull eriktonon/deepseek-v4.1-flash-1017:9b

echo Creating HORIZON models...

ollama create "Zenith-1.1:latest" -f "C:\Users\rogen\Documents\Horizen\Zenith 1.1\Modelfile"
ollama create "Halo-1:latest" -f "C:\Users\rogen\Documents\Horizen\Halo 1.5 3B\Modelfile"
ollama create "Halo2.5:latest" -f "C:\Users\rogen\Documents\Horizen\Halo 2.5 9B\Modelfile"

echo Done. Confirm with:
ollama list

endlocal