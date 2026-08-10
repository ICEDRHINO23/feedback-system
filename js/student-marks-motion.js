import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function studentIdentity(){return {name:String(localStorage.getItem("studentName")||"").trim(),roll:String(localStorage.getItem("rollNo")||"").trim()};}
function belongs(r,s){const rr=String(r.rollNo||r.studentRollNo||"").trim(),rn=String(r.studentName||r.participantName||"").trim();if(s.roll&&rr)return rr===s.roll;return !!s.name&&rn.toLowerCase()===s.name.toLowerCase();}
function pct(r){const t=Number(r.totalMarks||0),m=Number(r.score??r.automaticMarks??0);return Number(r.percentage??(t?m/t*100:0));}
function esc(v){return String(v??"").replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}

async function render(){
 const mount=document.getElementById("marksMotion"); if(!mount)return;
 try{
  const s=studentIdentity(); const snap=await getDocs(collection(db,"results")); const rows=[];
  snap.forEach(d=>{const r=d.data();if(belongs(r,s))rows.push({id:d.id,...r});});
  rows.sort((a,b)=>new Date(b.reviewedAt||b.submittedAt||0)-new Date(a.reviewedAt||a.submittedAt||0));
  if(!rows.length){mount.innerHTML=`<div class="marks-motion-empty"><span>📊</span><strong>No completed exam marks yet</strong><small>Your marks will appear here after you submit an assessment.</small></div>`;return;}
  mount.innerHTML=`<div class="marks-motion-head"><div><span class="marks-kicker">PERFORMANCE</span><h2>My Exam Marks</h2><p>Swipe through your completed assessments</p></div><div class="marks-live-dot">● Live</div></div><div class="marks-track">${rows.map((r,i)=>{const p=pct(r),total=Number(r.totalMarks||0),score=Number(r.score??r.automaticMarks??0),pending=r.reviewStatus==="pending"||r.resultPublished===false;return `<article class="marks-motion-card" style="--delay:${i*70}ms"><div class="marks-card-top"><span>${esc(r.subject||"Assessment")}</span><span>${pending?'UNDER REVIEW':p.toFixed(1)+'%'}</span></div><h3>${esc(r.examName||'Assessment')}</h3><div class="marks-score"><strong class="count-mark" data-value="${score}">0</strong><b>/ ${total}</b></div><div class="marks-progress"><i style="width:${Math.min(100,Math.max(0,p))}%"></i></div><div class="marks-meta"><span>${pending?'Teacher evaluation pending':p>=35?'✓ Passed':'✕ Needs improvement'}</span><button onclick="window.location.href='result.html?id=${r.id}'">View Result</button></div></article>`}).join('')}</div>`;
  mount.querySelectorAll('.count-mark').forEach(el=>{const target=Number(el.dataset.value||0),start=performance.now();const tick=now=>{const n=Math.min(1,(now-start)/850);el.textContent=Math.round(target*(1-Math.pow(1-n,3)));if(n<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);});
 }catch(e){console.error('Marks motion:',e);mount.innerHTML='<div class="marks-motion-empty">Unable to load exam marks.</div>';}
}
render();
