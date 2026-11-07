p = r"C:\Users\rogen\Documents\Horizon website\rust-gateway\src\main.rs"
s = open(p, encoding='utf-8').read()
import re
# Remove any literal backtick-n await remnants
s = s.replace('`n.await;', '.await;')
# Collapse accidental extra closings in the two known send lines? Check by targeted replacement of the error/done sends.
s = s.replace('let _ = tx.send(Ok(Bytes::from(format!("data: {}\\n\\n", json!({"error": e.to_string()})))))))', 'let _ = tx.send(Ok(Bytes::from(format!("data: {}\\n\\n", json!({"error": e.to_string()})))))')
# second done line
s = s.replace('let _ = tx.send(Ok(Bytes::from("data: [DONE]\\n\\n")))))`n.await;', 'let _ = tx.send(Ok(Bytes::from("data: [DONE]\\n\\n"))).await;')
open(p,'w',encoding='utf-8').write(s)
print('done')
