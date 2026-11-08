@echo off
setlocal

echo Pulling base models if needed...
ollama pull qwen2.5-coder:1.5b
ollama pull Impulse2000/smollm3:3b-q4_k_m
ollama pull eriktonon/deepseek-v4.1-flash-1017:9b
ollama pull gemma4:26b
ollama pull gemma4:12b

echo Creating HORIZON models...

ollama create "Zenith-1.1:latest" -f "C:\Users\rogen\Documents\Horizen\Zenith 1.1\Modelfile"
rem Halo models removedfrom HORIZON stack
ollama create "Nova5.4-Ultra:latest" -f "C:\Users\rogen\Documents\Horizen\Nova 5.4 26B\Modelfile"
ollama create "Nova5.2:latest" -f "C:\Users\rogen\Documents\Horizen\Nova 5.2 12B\modelfile"

echo Done. Confirm with:
ollama list

endlocal