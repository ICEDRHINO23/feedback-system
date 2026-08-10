import { db } from "./firebase-config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allResults = [];
let displayedResults = [];
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));

async function loadResults() {
    const tbody = document.getElementById("resultTable");
    try {
        // Result documents already contain examName, subject and examClass.
        // Do not download the entire exams collection just to rebuild those fields.
        const snapshot = await getDocs(collection(db, "results"));
        allResults = [];
        snapshot.forEach(s => allResults.push({ id: s.id, ...s.data() }));
        allResults.sort((a,b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        renderResults(allResults);
        updateDashboard(allResults);
        loadFilters();
    } catch (error) {
        console.error("RESULT LOAD ERROR:", error);
        if (tbody) tbody.innerHTML = `<tr><td colspan="11">Error Loading Results</td></tr>`;
    }
}

function getStudent(result) { return result.studentName || result.participantName || "-"; }
function getExamName(result) { return result.examName || result.assessmentName || "-"; }
function getSubject(result) { return result.subject || "-"; }
function getClass(result) { return result.examClass || result.studentClass || "-"; }
function getSection(result) { return result.section || result.studentSection || "-"; }

function renderResults(results) {
    displayedResults = results;
    const tbody = document.getElementById("resultTable");
    if (!tbody) return;
    if (!results.length) { tbody.innerHTML = `<tr><td colspan="11">No Results Found</td></tr>`; return; }
    tbody.innerHTML = results.map((result,index) => {
        const score = Number(result.score || 0), total = Number(result.totalMarks || 0), pct = Number(result.percentage || 0).toFixed(2);
        const date = result.submittedAt ? new Date(result.submittedAt).toLocaleString("en-IN") : "-";
        const reportUrl = `student-.html?id=${encodeURIComponent(result.id)}`;
        return `<tr><td>${index+1}</td><td>${escapeHtml(getStudent(result))}</td><td>${escapeHtml(getExamName(result))}</td><td>${escapeHtml(getSubject(result))}</td><td>${escapeHtml(getClass(result))}</td><td>${escapeHtml(getSection(result))}</td><td>${score}</td><td>${total}</td><td>${pct}%</td><td>${escapeHtml(date)}</td><td class="result-actions"><a class="action-btn preview-btn report-action" href="${reportUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open individual report for ${escapeHtml(getStudent(result))}"><i class="fas fa-file-lines"></i><span>Report</span></a><button type="button" class="delete-btn" onclick="deleteResult('${result.id}')"><i class="fas fa-trash"></i> Delete</button></td></tr>`;
    }).join("");
}

function updateDashboard(results) {
    const students = new Set(results.map(getStudent)), percentages = results.map(r => Number(r.percentage || 0)), attempts = results.length, total = percentages.reduce((a,b)=>a+b,0), passed = percentages.filter(p=>p>=35).length;
    document.getElementById("totalStudents").textContent = students.size;
    document.getElementById("totalAttempts").textContent = attempts;
    document.getElementById("averagePercentage").textContent = attempts ? (total/attempts).toFixed(2)+"%" : "0%";
    document.getElementById("highestPercentage").textContent = attempts ? Math.max(...percentages).toFixed(2)+"%" : "0%";
    document.getElementById("passPercentage").textContent = attempts ? ((passed/attempts)*100).toFixed(2)+"%" : "0%";
    document.getElementById("failedStudents").textContent = attempts-passed;
}

function loadFilters() {
    const classFilter=document.getElementById("classFilter"), examFilter=document.getElementById("examFilter"), subjectFilter=document.getElementById("subjectFilter");
    if(!classFilter||!examFilter||!subjectFilter)return;
    classFilter.innerHTML='<option value="">All Classes</option>'; examFilter.innerHTML='<option value="">All Assessments</option>'; subjectFilter.innerHTML='<option value="">All Subjects</option>';
    const classes=new Set(), exams=new Set(), subjects=new Set();
    allResults.forEach(r=>{classes.add(getClass(r));exams.add(getExamName(r));subjects.add(getSubject(r));});
    [...classes].filter(v=>v!=="-").sort().forEach(v=>classFilter.innerHTML+=`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`);
    [...exams].filter(v=>v!=="-").sort().forEach(v=>examFilter.innerHTML+=`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`);
    [...subjects].filter(v=>v!=="-").sort().forEach(v=>subjectFilter.innerHTML+=`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`);
}
function filterResults() {
    const search=(document.getElementById("searchBox")?.value||"").toLowerCase(), cls=document.getElementById("classFilter")?.value||"", exam=document.getElementById("examFilter")?.value||"", subject=document.getElementById("subjectFilter")?.value||"";
    const filtered=allResults.filter(r=>{const text=`${getStudent(r)} ${getExamName(r)} ${getSubject(r)}`.toLowerCase();return text.includes(search)&&(!cls||getClass(r)===cls)&&(!exam||getExamName(r)===exam)&&(!subject||getSubject(r)===subject);});
    renderResults(filtered); updateDashboard(filtered);
}
window.deleteResult = async function(id) { if(!confirm("Delete this result?")) return; try { await deleteDoc(doc(db,"results",id)); await loadResults(); } catch(error){ console.error("DELETE ERROR:",error); alert("Unable To Delete Result"); } };
function exportExcel(){if(!displayedResults.length){alert("No results available to export.");return;}const rows=displayedResults.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(getStudent(r))}</td><td>${escapeHtml(getExamName(r))}</td><td>${escapeHtml(getSubject(r))}</td><td>${escapeHtml(getClass(r))}</td><td>${escapeHtml(getSection(r))}</td><td>${Number(r.score||0)}</td><td>${Number(r.totalMarks||0)}</td><td>${Number(r.percentage||0).toFixed(2)}%</td><td>${r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):"-"}</td></tr>`).join("");const html=`<html><head><meta charset="UTF-8"></head><body><h2>Academic Heights Public School</h2><h3>AHPS Assessment Results</h3><table border="1"><tr><th>Sr No</th><th>Student</th><th>Assessment</th><th>Subject</th><th>Class</th><th>Section</th><th>Score</th><th>Total Marks</th><th>Percentage</th><th>Date</th></tr>${rows}</table></body></html>`;const url=URL.createObjectURL(new Blob([html],{type:"application/vnd.ms-excel;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`AHPS_Assessment_Results_${new Date().toISOString().slice(0,10)}.xls`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function printResults(){if(!displayedResults.length){alert("No results available to print.");return;}window.print();}
async function exportPDF(){if(!displayedResults.length){alert("No results available to export.");return;}if(!window.jspdf?.jsPDF){alert("PDF library is not loaded. Please refresh the page.");return;}const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"}),w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight();pdf.setFillColor(0,31,91);pdf.rect(0,0,w,32,"F");const loadImage=src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;}),ahps=await loadImage("../assets/ahps-logo.png"),ras=await loadImage("../assets/ras-logo.jpeg");if(ahps)pdf.addImage(ahps,"PNG",9,4,24,24);if(ras)pdf.addImage(ras,"JPEG",w-33,4,24,24);pdf.setTextColor(255,255,255);pdf.setFont("helvetica","bold");pdf.setFontSize(17);pdf.text("ACADEMIC HEIGHTS PUBLIC SCHOOL",w/2,11,{align:"center"});pdf.setFont("helvetica","normal");pdf.setFontSize(9);pdf.text("Chikhali, Pune, Maharashtra",w/2,17,{align:"center"});pdf.setFont("helvetica","bold");pdf.setFontSize(10);pdf.text("ASSESSMENT PERFORMANCE REPORT",w/2,25,{align:"center"});const rows=displayedResults.map((r,i)=>[i+1,getStudent(r),getExamName(r),getSubject(r),getClass(r),getSection(r),Number(r.score||0),Number(r.totalMarks||0),Number(r.percentage||0).toFixed(2)+"%",r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):"-"]);pdf.setTextColor(40,40,40);pdf.setFontSize(8);pdf.text(`Assessment: ${document.getElementById("examFilter")?.value||"All Assessments"}`,10,39);pdf.text(`Subject: ${document.getElementById("subjectFilter")?.value||"All Subjects"}`,95,39);pdf.text(`Class: ${document.getElementById("classFilter")?.value||"All Classes"}`,170,39);pdf.autoTable({head:[["Sr No","Student","Assessment","Subject","Class","Section","Score","Total","%","Date"]],body:rows,startY:44,theme:"grid",margin:{left:8,right:8,bottom:17},styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,31,91],textColor:[255,255,255],fontStyle:"bold",halign:"center"},alternateRowStyles:{fillColor:[245,247,250]},didDrawPage:()=>{const n=pdf.internal.getNumberOfPages();pdf.setDrawColor(0,31,91);pdf.line(8,h-11,w-8,h-11);pdf.setFontSize(7);pdf.setTextColor(90,90,90);pdf.text("Academic Heights Public School, Chikhali, Pune",8,h-5);pdf.text("© 2026 AHPS • Powered by RAS SYSTEMS",w/2,h-5,{align:"center"});pdf.text(`Page ${n}`,w-8,h-5,{align:"right");}}});pdf.save(`AHPS_Assessment_Report_${new Date().toISOString().slice(0,10)}.pdf`);}
function setup(){document.getElementById("searchBox")?.addEventListener("input",filterResults);document.getElementById("classFilter")?.addEventListener("change",filterResults);document.getElementById("examFilter")?.addEventListener("change",filterResults);document.getElementById("subjectFilter")?.addEventListener("change",filterResults);document.getElementById("printBtn")?.addEventListener("click",printResults);document.getElementById("excelBtn")?.addEventListener("click",exportExcel);document.getElementById("pdfBtn")?.addEventListener("click",exportPDF);}setup();loadResults();
