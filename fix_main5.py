p = r"C:\Users\rogen\Documents\Horizon website\rust-gateway\src\main.rs"
lines = open(p, encoding="utf-8").read().splitlines(keepends=True)
out=[]
for line in lines:
    if '"usage": usage, "choices": []' in line.replace(" ", ""):
        out.append('                        let _usage_str = format!("data: {}\\n\\n", json!({"usage": usage, "choices": []}));\n')
        out.append('                        let _ = tx.send(Ok(Bytes::from(_usage_str))).await;\n')
        continue
    # fix trailing extra paren lines
    if line.strip() == ')))' or ')))).await;' in line:
        line = line.replace(')))).await;', ')).await;')
    out.append(line)
open(p,'w',encoding='utf-8').write(''.join(out))
print('done')
