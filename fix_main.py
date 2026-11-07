p = r"C:\Users\rogen\Documents\Horizon website\rust-gateway\src\main.rs"
s = open(p, encoding='utf-8').read()
# Fix mangled await lines
s = s.replace('let _ = tx.send(Ok(Bytes::from(format!("data: {}\n\n", json!({"error": e.to_string()})))))))`n.await;', 'let _ = tx.send(Ok(Bytes::from(format!("data: {}\n\n", json!({"error": e.to_string()}))))).await;')
s = s.replace('let _ = tx.send(Ok(Bytes::from("data: [DONE]\n\n")))))`n.await;', 'let _ = tx.send(Ok(Bytes::from("data: [DONE]\n\n"))).await;')
# Fix content chunk closings: ensure only three closings after json content then .await
import re
# pattern for content blocks
old1 = '''                            json!({"choices": [{"delta": {"content": content}, "index": 0}]})
                        )))))`n.await;'''
new1 = '''                            json!({"choices": [{"delta": {"content": content}, "index": 0}]})
                        ))).await;'''
s = s.replace(old1, new1)
old2 = '''                            json!({"choices": [{"delta": {"content": content}, "index": 0}]})
                    )))))`n.await;'''
new2 = '''                            json!({"choices": [{"delta": {"content": content}, "index": 0}]})
                    ))).await;'''
s = s.replace(old2, new2)
open(p, "w", encoding='utf-8').write(s)
print("done")
