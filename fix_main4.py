import re
p = r"C:\Users\rogen\Documents\Horizon website\rust-gateway\src\main.rs"
s = open(p, encoding='utf-8').read()

# Fix content blocks (both occurrences)
content_pattern = re.compile(
    r'if !content\.is_empty\(\) \{\n(?:.*\n)*?let _ = tx\.send\(Ok\(Bytes::from\(format!\(\n(?:.*\n)*?\)\)\)\.await;\n',
    re.MULTILINE
)
# We need replacement per block; instead do a more targeted replace of the broken 4-line send start:
s = s.replace(
'''                        let _ = tx.send(Ok(Bytes::from(format!(
                            "data: {}\\n\\n",
                            json!({"choices": [{"delta": {"content": content}, "index": 0}]})
                        ))).await;''',
'''                        let s = format!("data: {}\\n\\n", json!({"choices": [{"delta": {"content": content}, "index": 0}]}));
                        let _ = tx.send(Ok(Bytes::from(s))).await;''')
s = s.replace(
'''                    let _ = tx.send(Ok(Bytes::from(format!(
                        "data: {}\\n\\n",
                        json!({"choices": [{"delta": {"content": content}, "index": 0}]})
                    )))).await;''',
'''                    let s = format!("data: {}\\n\\n", json!({"choices": [{"delta": {"content": content}, "index": 0}]}));
                    let _ = tx.send(Ok(Bytes::from(s))).await;''')

# Fix usage lines: any line containing tx.send with usage choices
lines = s.splitlines(keepends=True)
out = []
for line in lines:
    if 'json!({"usage": usage, "choices": []})' in line.replace(' ', ''):
        out.append('                        let _usage_str = format!("data: {}\\n\\n", json!({"usage": usage, "choices": []}));\n')
        out.append('                        let _ = tx.send(Ok(Bytes::from(_usage_str))).await;\n')
        continue
    out.append(line)
s = ''.join(out)

# Fix error branch and done branch remaining weird awaits
s = s.replace(')))))`n.await;', ')).await;')
s = s.replace('))))`n.await;', ')).await;')
s = s.replace(')))`n.await;', ')).await;')
# Remove any stale bad lines accidentally duplicated? not attempted.

open(p, 'w', encoding='utf-8').write(s)
print('done')
