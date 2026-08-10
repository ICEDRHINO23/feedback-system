import { db } from "./firebase-config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allResults = [], displayedResults = [];
const escapeHtml = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
const getStudent = r => r.studentName || r.participantName || "-";
const getExamName = r => r.examName || r.assessmentName || "-";
const getSubject = r => r.subject || "-";
const getClass = r => r.examClass || r.studentClass || "-";
const getSection = r => r.section || r.studentSection || "-";

async function loadResults() {
    try {
        // Result documents already contain the assessment metadata, so there is no reason to read the exams collection here.
        const snap = await getDocs(collection(db, "results"));
        allResults = snap.docs.map(s => ({ id: s.id, ...s.data() })).sort((a,b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
        renderResults(allResults); updateDashboard(allResults); loadFilters();
    } catch (error) {
        console.error("RESULT LOAD ERROR:", error);
        const tbody = document.getElementById("resultTable");
        if (tbody) tbody.innerHTML = `<tr><td colspan="11">Error Loading Results</td></tr>`;
    }
}

function renderResults(results) {
    displayedResults = results;
    const tbody = document.getElementById("resultTable");
    if (!tbody) return;
    if (!results.length) { tbody.innerHTML = `<tr><td colspan="11">No Results Found</td></tr>`; return; }
    tbody.innerHTML = results.map((r,i) => {
        const score=Number(r.score||0), total=Number(r.totalMarks||0), pct=Number(r.percentage||0).toFixed(2), date=r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):"-";
        const reportUrl=`student-.html?id=${encodeURIComponent(r.id)}`;
        return `<tr><td>${i+1}</td><td>${escapeHtml(getStudent(r))}</td><td>${escapeHtml(getExamName(r))}</td><td>${escapeHtml(getSubject(r))}</td><td>${escapeHtml(getClass(r))}</td><td>${escapeHtml(getSection(r))}</td><td>${score}</td><td>${total}</td><td>${pct}%</td><td>${escapeHtml(date)}</td><td class="result-actions"><a class="action-btn preview-btn report-action" href="${reportUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-lines"></i><span>Report</span></a><button type="button" class="delete-btn" onclick="deleteResult('${r.id}')"><i class="fas fa-trash"></i> Delete</button></td></tr>`;
    }).join("");
}

function updateDashboard(results) {
    const students=new Set(results.map(getStudent)), p=results.map(r=>Number(r.percentage||0)), n=results.length, sum=p.reduce((a,b)=>a+b,0), passed=p.filter(x=>x>=35).length;
    document.getElementById("totalStudents").textContent=students.size;
    document.getElementById("totalAttempts").textContent=n;
    document.getElementById("averagePercentage").textContent=n?(sum/n).toFixed(2)+"%":"0%";
    document.getElementById("highestPercentage").textContent=n?Math.max(...p).toFixed(2)+"%":"0%";
    document.getElementById("passPercentage").textContent=n?((passed/n)*100).toFixed(2)+"%":"0%";
    document.getElementById("failedStudents").textContent=n-passed;
}

function loadFilters(){
    const cf=document.getElementById("classFilter"),ef=document.getElementById("examFilter"),sf=document.getElementById("subjectFilter"); if(!cf||!ef||!sf)return;
    cf.innerHTML='<option value="">All Classes</option>';ef.innerHTML='<option value="">All Assessments</option>';sf.innerHTML='<option value="">All Subjects</option>';
    const c=new Set(),e=new Set(),s=new Set();allResults.forEach(r=>{c.add(getClass(r));e.add(getExamName(r));s.add(getSubject(r));});
    [...c].filter(x=>x!=="-").sort().forEach(x=>cf.innerHTML+=`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`);
    [...e].filter(x=>x!=="-").sort().forEach(x=>ef.innerHTML+=`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`);
    [...s].filter(x=>x!=="-").sort().forEach(x=>sf.innerHTML+=`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`);
}
function filterResults(){
    const q=(document.getElementById("searchBox")?.value||"").toLowerCase(),c=document.getElementById("classFilter")?.value||"",e=document.getElementById("examFilter")?.value||"",s=document.getElementById("subjectFilter")?.value||"";
    const filtered=allResults.filter(r=>`${getStudent(r)} ${getExamName(r)} ${getSubject(r)}`.toLowerCase().includes(q)&&(!c||getClass(r)===c)&&(!e||getExamName(r)===e)&&(!s||getSubject(r)===s));
    renderResults(filtered);updateDashboard(filtered);
}
window.deleteResult=async id=>{if(!confirm("Delete this result?"))return;try{await deleteDoc(doc(db,"results",id));await loadResults();}catch(e){console.error(e);alert("Unable To Delete Result");}};
function exportExcel(){if(!displayedResults.length){alert("No results available to export.");return;}const rows=displayedResults.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(getStudent(r))}</td><td>${escapeHtml(getExamName(r))}</td><td>${escapeHtml(getSubject(r))}</td><td>${escapeHtml(getClass(r))}</td><td>${escapeHtml(getSection(r))}</td><td>${Number(r.score||0)}</td><td>${Number(r.totalMarks||0)}</td><td>${Number(r.percentage||0).toFixed(2)}%</td><td>${r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):"-"}</td></tr>`).join("");const html=`<table border="1"><tr><th>Sr No</th><th>Student</th><th>Assessment</th><th>Subject</th><th>Class</th><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Date</th></tr>${rows}</table>`;const a=document.createElement("a"),u=URL.createObjectURL(new Blob([html],{type:"application/vnd.ms-excel;charset=utf-8"}));a.href=u;a.download=`AHPS_Assessment_Results_${new Date().toISOString().slice(0,10)}.xls`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function printResults(){if(!displayedResults.length){alert("No results available to print.");return;}window.print();}
async function exportPDF(){
    if(!displayedResults.length){alert("No results available to export.");return;}
    if(!window.jspdf?.jsPDF||!window.jspdf?.jsPDF.prototype.autoTable){alert("PDF library is not loaded. Please refresh the page.");return;}
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"}),w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight();
    pdf.setFillColor(0,31,91);pdf.rect(0,0,w,32,"F");pdf.setTextColor(255,255,255);pdf.setFont("helvetica","bold");pdf.setFontSize(17);pdf.text("ACADEMIC HEIGHTS PUBLIC SCHOOL",w/2,11,{align:"center"});pdf.setFontSize(9);pdf.text("Chikhali, Pune, Maharashtra",w/2,17,{align:"center"});pdf.setFontSize(10);pdf.text("ASSESSMENT PERFORMANCE REPORT",w/2,25,{align:"center"});
    const rows=displayedResults.map((r,i)=>[i+1,getStudent(r),getExamName(r),getSubject(r),getClass(r),getSection(r),Number(r.score||0),Number(r.totalMarks||0),Number(r.percentage||0).toFixed(2)+"%",r.submittedAt?new Date(r.submittedAt).toLocaleString("en-IN"):"-"]);
    pdf.setTextColor(40,40,40);pdf.setFontSize(8);pdf.text(`Assessment: ${document.getElementById("examFilter")?.value||"All Assessments"}`,10,39);pdf.text(`Subject: ${document.getElementById("subjectFilter")?.value||"All Subjects"}`,95,39);pdf.text(`Class: ${document.getElementById("classFilter")?.value||"All Classes"}`,170,39);
    pdf.autoTable({head:[["Sr No","Student","Assessment","Subject","Class","Section","Score","Total","%","Date"]],body:rows,startY:44,theme:"grid",margin:{left:8,right:8,bottom:17},styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,31,91],textColor:[255,255,255],fontStyle:"bold",halign:"center"},alternateRowStyles:{fillColor:[245,247,250]},didDrawPage:()=>{const n=pdf.internal.getNumberOfPages();pdf.setDrawColor(0,31,91);pdf.line(8,h-11,w-8,h-11);pdf.setFontSize(7);pdf.setTextColor(90,90,90);pdf.text("Academic Heights Public School, Chikhali, Pune",8,h-5);pdf.text("© 2026 AHPS • Powered by RAS SYSTEMS",w/2,h-5,{align:"center"});pdf.text(`Page ${n}`,w-8,h-5,{align:"right"});}});
    pdf.save(`AHPS_Assessment_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}
function setup(){document.getElementById("searchBox")?.addEventListener("input",filterResults);document.getElementById("classFilter")?.addEventListener("change",filterResults);document.getElementById("examFilter")?.addEventListener("change",filterResults);document.getElementById("subjectFilter")?.addEventListener("change",filterResults);document.getElementById("printBtn")?.addEventListener("click",printResults);document.getElementById("excelBtn")?.addEventListener("click",exportExcel);document.getElementById("pdfBtn")?.addEventListener("click",exportPDF);}setup();loadResults();
