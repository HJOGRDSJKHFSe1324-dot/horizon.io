import fs from "node:fs";
const BASE = "http://127.0.0.1:8080";
const MODELS = ["Zenith-1.1:latest","Nova5.2:latest","Nova5.4-Ultra:latest"];
const questions = [
  {id:1,category:"Math",prompt:"Question: What is ((7 + 3) * (4 - 1) - 5) / 3?\nA) 7\nB) 8\nC) 9\nD) 10\nE) 11",correct:"C"},
  {id:2,category:"Programming",prompt:"Question: In Python, what is bool([]) == False?\nA) True\nB) False\nC) None\nD) Error",correct:"A"},
  {id:3,category:"Logic",prompt:"Question: A knight always tells the truth; a knave always lies. A says: 'B is a knave.' B says: 'A and I are of different kinds.' What is A?\nA) Knight\nB) Knave\nC) Cannot determine\nD) Both lie",correct:"B"},
  {id:4,category:"Probability",prompt:"Question: Given P(A)=0.4, P(B)=0.5, and P(A and B)=0.2, what is P(B|A)?\nA) 0.2\nB) 0.4\nC) 0.5\nD) 1.0",correct:"C"},
  {id:5,category:"Computer Science",prompt:"Question: 0b1010 in decimal is:\nA) 8\nB) 10\nC) 12\nD) 14",correct:"B"},
  {id:6,category:"Physics",prompt:"Question: A 10 kg mass accelerates at 2 m/s^2. Force in newtons is:\nA) 5\nB) 10\nC) 20\nD) 40",correct:"C"},
  {id:7,category:"Chemistry",prompt:"Question: For reaction H2 + I2 <-> 2HI; if pressure is increased, equilibrium shifts?\nA) Toward products\nB) Toward reactants\nC) No shift\nD) Completes irreversibly",correct:"C"},
  {id:8,category:"Law",prompt:"Question: In a criminal case, the standard of proof is:\nA) Preponderance of evidence\nB) Clear and convincing evidence\nC) Beyond a reasonable doubt\nD) Probable cause only",correct:"C"},
  {id:9,category:"Medicine",prompt:"Question: Which medication is first-line in an acute anaphylactic emergency?\nA) Acetaminophen\nB) Epinephrine\nC) Metformin\nD) Loratadine only",correct:"B"},
  {id:10,category:"Programming",prompt:"Question: What does 'a.includes(2)' evaluate to when a=[1,2,3]?\nA) true\nB) false\nC) undefined\nD) Error",correct:"A"},
  {id:11,category:"Philosophy",prompt:"Question: 'Treat humanity always as an end, never merely as a means' is associated with:\nA) Bentham\nB) Mill\nC) Kant\nD) Aristotle",correct:"C"},
  {id:12,category:"Math",prompt:"Question: If P(A|B)=0.8 and P(B)=0.3, then P(A and B)=?\nA) 0.24\nB) 0.8\nC) 0.3\nD) 1.1",correct:"A"}
];
async function ask(model,q){
  const s=performance.now();
  try{
    const res=await fetch(BASE+"/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model,stream:false,temperature:0,messages:[{role:"system",content:"Reply with exactly one uppercase letter A-E. No explanation."},{role:"user",content:q.prompt}]})});
    const latency=performance.now()-s;
    const json=await res.json();
    const content=String(json?.choices?.[0]?.message?.content??"").trim().toUpperCase();
    const match=content.match(/[A-E]/);
    const answer=match?match[0]:"";
    return {answer,raw:content,latencyMs:Math.round(latency),completionTokens:json?.usage?.completion_tokens??0,correct:answer===q.correct};
  }catch(e){return {answer:"",raw:String(e),latencyMs:Math.round(performance.now()-s),completionTokens:0,correct:false}}
}
async function main(){
 const summary={};
 for(const model of MODELS){
  let c=0,l=0,t=0;const rows=[];
  for(const q of questions){const r=await ask(model,q);if(r.correct)c++;l+=r.latencyMs;t+=r.completionTokens;rows.push({correct:r.correct,latencyMs:r.latencyMs});console.log(model,"Q"+q.id,r.answer,r.correct?"OK":"WRONG",r.latencyMs+"ms");}
  summary[model]={total:questions.length,correct:c,accuracy:Number(((c/questions.length)*100).toFixed(1)),averageLatencyMs:Math.round(l/questions.length),averageTokensPerSecond:t?Number((t/(l/1000)).toFixed(1)):null,rows};
 }
 fs.writeFileSync("scripts/hard-benchmark-results.json",JSON.stringify({sampleSize:questions.length,models:summary,ranAt:new Date().toISOString()},null,2));
 console.log("WROTE");
}
main().catch(e=>{console.error(e);process.exit(1)});
