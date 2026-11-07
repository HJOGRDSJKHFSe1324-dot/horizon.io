p = r"C:\Users\rogen\Documents\Horizon website\rust-gateway\src\main.rs"
lines = open(p, encoding="utf-8").read().splitlines(keepends=True)
out = []
for line in lines:
    if '"usage": usage, "choices": []' in line or '"choices": []' in line:
        # normalize all weird closing before .await
        idx = line.rfind('.await;')
        prefix = line[:idx] if idx >= 0 else line
        # strip trailing closing parens
        prefix = prefix.rstrip()
        while prefix.endswith(')'):
            prefix = prefix[:-1]
        # rebuild with correct number of closures:
        # tx.send( Ok( Bytes::from( format!(... ) ) ) ;
        line = prefix + '))).await;\n'
    out.append(line)
open(p, 'w', encoding='utf-8').write(''.join(out))
print("done")
