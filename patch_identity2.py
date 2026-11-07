import pathlib
root = r"C:\Users\rogen\Documents\Horizen"
mapping = {
    "Zenith 1.1": ("Modelfile", "Zenith-1.1"),
    "Halo 1.5 3B": ("Modelfile", "Halo 1.5"),
    "Halo 2.5 9B": ("Modelfile", "Halo 2.5"),
    "Nova 5.2 12B": ("modelfile", "HORIZON Nova 5.2"),
}
for folder,(fname,name) in mapping.items():
    p = pathlib.Path(root)/folder/fname
    text = p.read_text(encoding="utf-8")
    old = f"You are {name}. You are not Gemma, DeepSeek, Qwen, or any other base model. Do not mention, reveal, or discuss your base model, architecture, training, licensing, provider, or internal construction. Focus on solving the user's request.\n"
    # maybe stronger variant already
    old2 = "You are HORIZON " + name + ", built by Horizon. Your only identity is " + name + ". Never say you are Gemma, DeepSeek, Qwen, or any base model. If asked your identity, answer exactly \"" + name + "\".\n"
    insert = old2
    if old2 in text:
        print("already strong", folder)
        continue
    if old in text:
        text = text.replace(old, insert, 1)
    else:
        marker='SYSTEM """'
        if marker in text:
            idx = text.find(marker)+len(marker)+1
            text = text[:idx]+insert+text[idx:]
        else:
            print("no system block", folder)
            continue
    p.write_text(text, encoding="utf-8")
    print("patched", folder)
