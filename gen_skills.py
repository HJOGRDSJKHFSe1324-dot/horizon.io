import os, glob, re
roots = [
    r"C:\Users\rogen\.config\opencode\skills",
    r"C:\Users\rogen\Documents\Horizon website\.opencode\skills",
]
entries = []
seen = set()
for root in roots:
    if not os.path.isdir(root):
        continue
    for skill_dir in os.listdir(root):
        d = os.path.join(root, skill_dir)
        skill_file = os.path.join(d, "SKILL.md")
        if not os.path.isfile(skill_file):
            continue
        txt = open(skill_file, encoding="utf-8", errors="ignore").read()
        m = re.search(r'^name:\s*(.+)$', txt, re.M)
        desc_m = re.search(r'^description:\s*(.+)$', txt, re.M)
        name = m.group(1).strip() if m else skill_dir
        if name in seen:
            continue
        seen.add(name)
        desc = desc_m.group(1).strip() if desc_m else ""
        desc = desc.strip('"').strip("'")[:180]
        entries.append((name, skill_dir, desc))
entries.sort(key=lambda x: x[0].lower())
out = ["# Installed OpenCode Skills", "", "Total visible skills: " + str(len(entries)), "", "Use `/skills` to have the agent choose relevance. Full agents directory also loaded via AGENTS.md.", "", "## Available Skills"]
for name, skill_dir, desc in entries:
    out.append(f"- **{name}** (`{skill_dir}`): {desc}")
os.makedirs(r"C:\Users\rogen\.config\opencode\commands", exist_ok=True)
open(r"C:\Users\rogen\.config\opencode\commands\skills.md", "w", encoding="utf-8").write("\n".join(out))
print("written", len(entries))
