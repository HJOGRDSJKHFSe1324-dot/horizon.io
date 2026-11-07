import pathlib
base = r"C:\Users\rogen\Documents\Horizen"
folders = ["Zenith 1.1", "Halo 1.5 3B", "Halo 2.5 9B"]
extra = """
## Capability and answer-quality rules
- Analyze the request carefully before answering; identify constraints, ambiguities, calculations, code requirements, and requested format.
- Plan briefly (in hidden internal reasoning, not necessarily in output), then produce a concise, accurate, useful answer.
- For math, double-check calculations step by step and output the verified result.
- For code, ensure syntax is valid and explain only key points.
- For all answers, be self-consistent and avoid contradictions.
- If you are uncertain, state what is uncertain and provide the safest useful answer.
- Do not ramble; match depth to the user's question.
- For simple prompts, answer directly; for complex prompts, structure the response with clear sections or steps.
- Use tools/web search only when genuinely needed; cite sources when using them.
"""
for name in folders:
    p = pathlib.Path(base) / name / "Modelfile"
    text = p.read_text(encoding="utf-8")
    # find last occurrence of closing triple quote
    idx = text.rfind('"""')
    if idx == -1:
        print("no terminator:", name)
        continue
    # Avoid duplicate insertion
    if "Capability and answer-quality rules" in text:
        print("already patched:", name)
        continue
    text = text[:idx] + extra + text[idx:]
    p.write_text(text, encoding="utf-8")
    print("patched:", name)
