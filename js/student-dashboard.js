import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function parseExamDate(value, endOfDay = false) {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value === "object" && typeof value.seconds === "number") return new Date(value.seconds * 1000);
    const text = String(value).trim();
    if (!text) return null;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (dateOnly) {
        const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        if (endOfDay) d.setHours(23, 59, 59, 999);
        return d;
    }
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
}
function formatDate(value, endOfDay = false) {
    const d = parseExamDate(value, endOfDay);
    return d ? d.toLocaleString("en-IN", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "Not specified";
}
function getExamWindow(exam) {
    const now = new Date();
    const start = parseExamDate(exam.startDate, false);
    const end = parseExamDate(exam.endDate, true);
    if (end && now > end) return "ended";
    if (start && now < start) return "upcoming";
    return "live";
}
function getCurrentStudent() {
    return {
        name:String(localStorage.getItem("studentName")||localStorage.getItem("name")||"").trim(),
        rollNo:String(localStorage.getItem("rollNo")||localStorage.getItem("studentRollNo")||localStorage.getItem("rollNumber")||"").trim(),
        studentClass:String(localStorage.getItem("studentClass")||localStorage.getItem("class")||"").trim(),
        section:String(localStorage.getItem("studentSection")||localStorage.getItem("section")||"").trim()
    };
}
function loadStudentDetails() {
    const s=getCurrentStudent();
    document.getElementById("studentName")?.replaceChildren(document.createTextNode(s.name||"Student"));
    document.getElementById("studentRollNo")?.replaceChildren(document.createTextNode(s.rollNo||"-"));
    document.getElementById("studentClass")?.replaceChildren(document.createTextNode(s.studentClass||"-"));
    document.getElementById("studentSection")?.replaceChildren(document.createTextNode(s.section||"-"));
}
async function loadExams() {
    const examList=document.getElementById("examList"), notificationList=document.getElementById("examNotifications");
    try {
        const student=getCurrentStudent();
        if(!student.studentClass){examList.innerHTML=`<div class="exam-card"><h3>Student Class Not Found</h3><p>Please login again.</p></div>`;return;}
        const snapshot=await getDocs(collection(db,"exams")); examList.innerHTML=""; const notifications=[]; let found=false; const now=new Date();
        snapshot.forEach(docSnap=>{
            const exam=docSnap.data();
            if(String(exam.examClass||"").trim()!==student.studentClass||exam.targetType!=="student"||exam.status!=="active")return;
            const state=getExamWindow(exam); if(state==="ended")return; found=true;
            const start=parseExamDate(exam.startDate,false); if(state!=="ended")notifications.push({exam,state,start});
            const upcoming=state==="upcoming";
            examList.innerHTML+=`<div class="exam-card"><h3>${exam.examName||"Assessment"}</h3><p>Subject: ${exam.subject||"-"}</p><p>Duration: ${exam.duration||0} Minutes</p><p><strong>Total Marks: ${exam.totalMarks||0}</strong></p><p>Start Date: ${formatDate(exam.startDate)}</p><p>End Date: ${formatDate(exam.endDate,true)}</p><span class="exam-window ${upcoming?"upcoming":"live"}"><i class="fas fa-clock"></i> ${upcoming?`Starts ${formatDate(exam.startDate)}`:`Ends ${formatDate(exam.endDate,true)}`}</span><button class="start-btn" ${upcoming?"disabled":""} onclick="startExam('${docSnap.id}')">${upcoming?"Assessment Not Started":"Start Assessment"}</button></div>`;
        });
        if(!found)examList.innerHTML=`<div class="exam-card"><h3>No Assessments Available</h3><p>No active assessments are currently available for your class.</p></div>`;
        if(notificationList){notifications.sort((a,b)=>(a.start?.getTime()||now.getTime())-(b.start?.getTime()||now.getTime()));notificationList.innerHTML=notifications.length?`<h3><i class="fas fa-bell"></i> Upcoming & Active Assessments</h3>${notifications.map(({exam,state})=>`<div class="notification-item"><div><strong>${exam.examName||"Assessment"}</strong><div class="notification-meta">${state==="upcoming"?`Starts: ${formatDate(exam.startDate)}`:`Ends: ${formatDate(exam.endDate,true)}`} • Subject: ${exam.subject||"-"}</div></div><div class="notification-marks">Marks: ${exam.totalMarks||0}</div></div>`).join("")}`:`<h3><i class="fas fa-bell"></i> Exam Notifications</h3><div class="notification-empty">No upcoming or active assessments at the moment.</div>`;}
    }catch(error){console.error("Assessment Load Error:",error);examList.innerHTML=`<div class="exam-card"><h3>Unable To Load Assessments</h3><p>Please refresh the page.</p></div>`;}
}
window.startExam=function(examId){localStorage.setItem("currentExamId",examId);localStorage.setItem("participantRole","student");window.location.href="student-exam.html";};
function resultBelongsToStudent(result,student){const name=String(result.studentName||result.participantName||"").trim(),roll=String(result.rollNo||result.studentRollNo||"").trim();if(student.rollNo&&roll)return roll===student.rollNo;return !!student.name&&name.toLowerCase()===student.name.toLowerCase();}
function resultScore(result){return Number(result.score??result.automaticMarks??0);}
function resultTotal(result){return Number(result.totalMarks??0);}
async function loadStudentResults(){
    const box=document.getElementById("completedExamList"),student=getCurrentStudent(); if(!box)return[];
    if(!student.name&&!student.rollNo){box.innerHTML=`<div class="exam-card"><h3>Student Not Found</h3><p>Please login again.</p></div>`;return[];}
    const snapshot=await getDocs(collection(db,"results")),results=[];
    snapshot.forEach(d=>{const r=d.data();if(resultBelongsToStudent(r,student))results.push({id:d.id,...r});});
    results.sort((a,b)=>new Date(b.reviewedAt||b.submittedAt||0)-new Date(a.reviewedAt||a.submittedAt||0));
    let html="";
    results.forEach(r=>{
        const total=resultTotal(r),score=resultScore(r),published=r.resultPublished!==false&&r.reviewStatus!=="pending",invalid=total>0&&score>total;
        const percentage=total>0?Number(r.percentage??((score/total)*100)):0,status=published?(percentage>=35?"PASS":"FAIL"):"UNDER EVALUATION";
        const badgeClass=published&&percentage>=35?"pass-badge":"fail-badge",statusClass=published&&percentage>=35?"pass-text":"fail-text";
        const scoreText=published?`${score}/${total}`:`${Number(r.automaticMarks||score)}/${total} (Automatic)`;
        html+=`<div class="completed-card"><div class="completed-header"><div><h3>${r.examName||"Assessment"}</h3><p class="completed-subject">Subject: <strong>${r.subject||"-"}</strong></p></div><div class="percentage-badge ${badgeClass}">${published?percentage.toFixed(2)+"%":"Pending"}</div></div><div class="completed-info"><div class="info-item"><span class="info-label">Marks Obtained</span><span class="info-value">${scoreText}</span></div><div class="info-item"><span class="info-label">Maximum Marks</span><span class="info-value">${total}</span></div><div class="info-item"><span class="info-label">Status</span><span class="info-value ${statusClass}">${status}</span></div></div><div class="completed-actions"><button type="button" class="result-btn" onclick="viewResult('${r.id}')">📄 View Result</button><button type="button" class="review-btn" onclick="reviewAssessment('${r.id}')">🔍 Review</button></div></div>`;
        if(invalid)setTimeout(()=>showInvalidResultPopup(r.examName,score,total),100);
    });
    box.innerHTML=html||`<div class="exam-card"><h3>No Previous Exam Marks</h3><p>Your previous assessment marks will appear here automatically after submission.</p></div>`;
    return results;
}
function showInvalidResultPopup(examName,score,total){if(document.getElementById("invalidResultPopup"))return;const p=document.createElement("div");p.id="invalidResultPopup";p.style.cssText="position:fixed;right:22px;top:22px;z-index:99999;background:#fff4f2;border:1px solid #f3b7b0;color:#8b1e16;padding:15px 18px;border-radius:14px;box-shadow:0 14px 35px rgba(16,32,68,.18);font-family:Inter,Segoe UI,Arial,sans-serif;max-width:360px";p.innerHTML=`<strong>⚠ Result Mark Error</strong><div style="font-size:12px;margin-top:5px">${examName||"Assessment"}: ${score} marks obtained out of ${total}. Obtained marks cannot exceed the maximum.</div>`;document.body.appendChild(p);setTimeout(()=>p.remove(),5000);}
async function loadPerformanceSummary(results){
    const published=(results||[]).filter(r=>r.resultPublished!==false&&r.reviewStatus!=="pending");
    if(!published.length){["completedCount","passedCount","failedCount"].forEach(id=>document.getElementById(id).innerText="0");document.getElementById("averagePercentage").innerText="0%";document.getElementById("bestPercentage").innerText="0%";return;}
    const percentages=published.map(r=>Number(r.percentage??0));
    document.getElementById("completedCount").innerText=published.length;document.getElementById("averagePercentage").innerText=(percentages.reduce((a,b)=>a+b,0)/percentages.length).toFixed(2)+"%";document.getElementById("bestPercentage").innerText=Math.max(...percentages).toFixed(2)+"%";document.getElementById("passedCount").innerText=percentages.filter(p=>p>=35).length;document.getElementById("failedCount").innerText=percentages.filter(p=>p<35).length;
}
window.viewResult=function(resultId){window.location.href="result.html?id="+resultId;};
window.reviewAssessment=function(resultId){window.location.href="review/review.html?id="+resultId;};
window.logout=function(){localStorage.clear();window.location.href="login.html";};
(async function(){loadStudentDetails();await loadExams();try{const results=await loadStudentResults();await loadPerformanceSummary(results);}catch(error){console.error("Student Results Error:",error);document.getElementById("completedExamList").innerHTML=`<div class="exam-card"><h3>Unable To Load Previous Marks</h3><p>Please refresh the page.</p></div>`;}})();
