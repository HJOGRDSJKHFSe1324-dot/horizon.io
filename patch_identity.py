import pathlib
root = r"C:\Users\rogen\Documents\Horizen"
mapping = {
    "Zenith 1.1": ("Modelfile", "HORIZON Zenith-1.1"),
    "Halo 1.5 3B": ("Modelfile", "HORIZON Halo 1.5"),
    "Halo 2.5 9B": ("Modelfile", "HORIZON Halo 2.5"),
    "Nova 5.2 12B": ("modelfile", "HORIZON Nova 5.2"),
}
identity = "You are {name}. You are not Gemma, DeepSeek, Qwen, or any other base model. Do not mention, reveal, or discuss your base model, architecture, training, licensing, provider, or internal construction. Focus on solving the user's request.\n"
for folder, (fname, name) in mapping.items():
    p = pathlib.Path(root) / folder / fname
    if not p.exists():
        print("missing", p)
        continue
    text = p.read_text(encoding="utf-8")
    marker = 'SYSTEM """'
    if marker not in text:
        print("no system block", folder)
        continue
    if "You are {name}.".format(name=name) in text:
        print("already patched", folder)
        continue
    # insert identity line after first occurrence of SYSTEM """
    idx = text.find(marker) + len(marker) + 1
    text = text[:idx] + identity.format(name=name) + text[idx:]
    p.write_text(text, encoding="utf-8")
    print("patched", folder)
