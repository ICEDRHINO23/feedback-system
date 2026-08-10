import { db } from "./firebase-config.js";
import { collection, getDocs, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allQuestions = [];
let currentQuestionId = "";
let examMap = {};

function normalize(value) { return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " "); }
function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }
function normalizeQuestionType(value) {
    const type = normalize(value);
    if (!type || ["mcq", "multiple choice", "multiple-choice"].includes(type)) return "mcq";
    if (["multiple", "multiple answer", "multiple-answer", "multiple answers"].includes(type)) return "multiple";
    if (["sentence", "subjective", "descriptive", "descriptive answer"].includes(type)) return "sentence";
    return type;
}

async function loadExamMap() {
    try {
        const snapshot = await getDocs(collection(db, "exams"));
        examMap = {};
        snapshot.forEach(docSnap => { examMap[docSnap.id] = docSnap.data(); });
    } catch (error) { console.warn("Exam metadata could not be loaded:", error); examMap = {}; }
}
function getQuestionExamId(q) { return String(q.examId ?? q.examID ?? q.assessmentId ?? q.assessmentID ?? "").trim(); }
function getAssessmentName(exam, id) { return String(exam?.examName ?? exam?.assessmentName ?? exam?.name ?? exam?.title ?? id ?? "Unknown Assessment").trim(); }
function getQuestionClass(q) { const direct=String(q.class ?? q.examClass ?? q.className ?? "").trim(); if(direct)return direct; const exam=examMap[getQuestionExamId(q)]; return exam?String(exam.examClass ?? exam.class ?? exam.className ?? "").trim():""; }
function getQuestionSubject(q) { const direct=String(q.subject ?? q.examSubject ?? "").trim(); if(direct)return direct; const exam=examMap[getQuestionExamId(q)]; return exam?String(exam.subject ?? exam.examSubject ?? "").trim():""; }

function updateStats() {
    const subjects = new Set(allQuestions.map(q => normalize(q._subject)).filter(Boolean));
    const assessments = new Set(allQuestions.map(q => q._examId).filter(Boolean));
    const total = document.getElementById("totalQuestions");
    const subjectCount = document.getElementById("totalSubjects");
    const assessmentCount = document.getElementById("totalAssessments");
    if(total) total.textContent = allQuestions.length;
    if(subjectCount) subjectCount.textContent = subjects.size;
    if(assessmentCount) assessmentCount.textContent = assessments.size;
}

async function loadQuestions() {
    const table = document.getElementById("questionTable");
    try {
        table.innerHTML = `<tr><td colspan="6" class="no-data"><i class="fas fa-spinner fa-spin"></i> Loading Questions...</td></tr>`;
        await loadExamMap();
        const snapshot = await getDocs(collection(db, "questions"));
        allQuestions = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const examId = getQuestionExamId(data);
            allQuestions.push({ id: docSnap.id, ...data, _examId: examId, _assessment: getAssessmentName(examMap[examId], examId), _class: getQuestionClass(data), _subject: getQuestionSubject(data), _type: normalizeQuestionType(data.questionType ?? data.type) });
        });
        allQuestions.sort((a,b) => (a.question || "").localeCompare(b.question || ""));
        updateStats();
        loadFilters();
        filterQuestions();
    } catch (error) {
        console.error(error);
        table.innerHTML = `<tr><td colspan="6" class="no-data"><i class="fas fa-triangle-exclamation"></i> Unable to load questions</td></tr>`;
    }
}

function renderQuestions(list) {
    const table = document.getElementById("questionTable");
    table.innerHTML = "";
    if (!list.length) {
        table.innerHTML = `<tr><td colspan="6" class="no-data"><i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>No Questions Found</td></tr>`;
        return;
    }
    list.forEach(q => {
        const typeLabel = q._type === "sentence" ? "Subjective" : q._type === "multiple" ? "Multiple" : "MCQ";
        table.innerHTML += `<tr>
            <td class="question-cell">${escapeHTML(q.question || "-")}</td>
            <td><span class="subject-badge">${escapeHTML(q._subject || q.subject || "-")}</span></td>
            <td><span class="class-badge">Class ${escapeHTML(q._class || q.class || "-")}</span></td>
            <td><span class="type-badge">${typeLabel}</span></td>
            <td class="marks">${escapeHTML(q.marks || 1)}</td>
            <td><div class="actions">
                <button class="action-btn edit-btn" onclick="editQuestion('${q.id}')" title="Edit Question"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteQuestion('${q.id}')" title="Delete Question"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`;
    });
}

function loadFilters() {
    const classFilter=document.getElementById("classFilter"), subjectFilter=document.getElementById("subjectFilter"), assessmentFilter=document.getElementById("assessmentFilter"), typeFilter=document.getElementById("typeFilter");
    if(!classFilter||!subjectFilter||!assessmentFilter||!typeFilter)return;
    const previousClass=classFilter.value, previousSubject=subjectFilter.value, previousAssessment=assessmentFilter.value, previousType=typeFilter.value;
    classFilter.innerHTML=`<option value="">All Classes</option>`; subjectFilter.innerHTML=`<option value="">All Subjects</option>`; assessmentFilter.innerHTML=`<option value="">All Assessments</option>`; typeFilter.innerHTML=`<option value="">All Question Types</option><option value="mcq">MCQ</option><option value="multiple">Multiple Answer</option><option value="sentence">Subjective</option>`;
    [...new Set(allQuestions.map(q=>q._class).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true})).forEach(cls=>{const o=document.createElement("option");o.value=cls;o.textContent=`Class ${cls}`;classFilter.appendChild(o);});
    [...new Set(allQuestions.map(q=>q._subject).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b))).forEach(subject=>{const o=document.createElement("option");o.value=subject;o.textContent=subject;subjectFilter.appendChild(o);});
    [...new Map(allQuestions.filter(q=>q._examId).map(q=>[q._examId,q._assessment])).entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]))).forEach(([examId,name])=>{const o=document.createElement("option");o.value=examId;o.textContent=name||examId;assessmentFilter.appendChild(o);});
    if([...classFilter.options].some(o=>o.value===previousClass))classFilter.value=previousClass;
    if([...subjectFilter.options].some(o=>o.value===previousSubject))subjectFilter.value=previousSubject;
    if([...assessmentFilter.options].some(o=>o.value===previousAssessment))assessmentFilter.value=previousAssessment;
    if([...typeFilter.options].some(o=>o.value===previousType))typeFilter.value=previousType;
}

function filterQuestions() {
    const search=normalize(document.getElementById("searchBox")?.value), classValue=normalize(document.getElementById("classFilter")?.value), subjectValue=normalize(document.getElementById("subjectFilter")?.value), assessmentValue=String(document.getElementById("assessmentFilter")?.value??"").trim(), typeRaw=normalize(document.getElementById("typeFilter")?.value), typeSelected=typeRaw!=="", typeValue=normalizeQuestionType(typeRaw);
    const filtered=allQuestions.filter(q=>normalize(q.question).includes(search)&&(!classValue||normalize(q._class)===classValue)&&(!subjectValue||normalize(q._subject)===subjectValue)&&(!assessmentValue||q._examId===assessmentValue)&&(!typeSelected||q._type===typeValue));
    renderQuestions(filtered);
}

function updateEditOptionsVisibility(type) { const section=document.getElementById("editOptionsSection"); if(section)section.style.display=type==="sentence"?"none":"block"; }
window.editQuestion=function(id){const q=allQuestions.find(x=>x.id===id);if(!q)return;currentQuestionId=id;document.getElementById("editAssessment").value=q._assessment||"Unknown Assessment";document.getElementById("editQuestion").value=q.question||"";document.getElementById("editOptionA").value=q.optionA||"";document.getElementById("editOptionB").value=q.optionB||"";document.getElementById("editOptionC").value=q.optionC||"";document.getElementById("editOptionD").value=q.optionD||"";document.getElementById("editAnswer").value=q.answer||"A";document.getElementById("editMarks").value=q.marks??1;updateEditOptionsVisibility(q._type);document.getElementById("editModal").style.display="block";};
window.closeEdit=function(){document.getElementById("editModal").style.display="none";};

async function updateQuestion(){
    if(!currentQuestionId){alert("No Question Selected");return;}
    const questionText=document.getElementById("editQuestion").value.trim(), marks=Number(document.getElementById("editMarks").value);
    if(!questionText){alert("Please enter the question.");document.getElementById("editQuestion").focus();return;}
    if(!Number.isFinite(marks)||marks<0){alert("Please enter valid marks.");document.getElementById("editMarks").focus();return;}
    try{
        const existing=allQuestions.find(q=>q.id===currentQuestionId);
        const updateData={question:questionText,answer:document.getElementById("editAnswer").value,marks};
        if(!existing||existing._type!=="sentence"){updateData.optionA=document.getElementById("editOptionA").value.trim();updateData.optionB=document.getElementById("editOptionB").value.trim();updateData.optionC=document.getElementById("editOptionC").value.trim();updateData.optionD=document.getElementById("editOptionD").value.trim();}
        await updateDoc(doc(db,"questions",currentQuestionId),updateData);closeEdit();await loadQuestions();alert("Question Updated Successfully");
    }catch(error){console.error(error);alert("Unable To Update Question");}
}

window.deleteQuestion=async function(id){const q=allQuestions.find(x=>x.id===id);if(!q)return;if(!confirm("Delete this question?\n\n"+q.question+"\n\nThis action cannot be undone."))return;try{await deleteDoc(doc(db,"questions",id));allQuestions=allQuestions.filter(x=>x.id!==id);updateStats();loadFilters();filterQuestions();alert("Question Deleted Successfully.");}catch(error){console.error(error);alert("Unable To Delete Question.");}};

document.addEventListener("click",e=>{const edit=document.getElementById("editModal");if(e.target===edit)closeEdit();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeEdit();});
document.addEventListener("DOMContentLoaded",()=>{document.getElementById("searchBox")?.addEventListener("input",filterQuestions);document.getElementById("classFilter")?.addEventListener("change",filterQuestions);document.getElementById("subjectFilter")?.addEventListener("change",filterQuestions);document.getElementById("assessmentFilter")?.addEventListener("change",filterQuestions);document.getElementById("typeFilter")?.addEventListener("change",filterQuestions);document.getElementById("updateBtn")?.addEventListener("click",updateQuestion);loadQuestions();});
