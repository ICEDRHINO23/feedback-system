import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examSelect = document.getElementById("examSelect");
const classSelect = document.getElementById("examClass");
const sectionSelect = document.getElementById("questionSection");

function escapeHTML(value){return String(value ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));}

async function loadQuestionSettings(){
    try{
        const snapshot=await getDocs(collection(db,"settings"));
        let settings=null;
        snapshot.forEach(d=>{if(d.id==="config")settings=d.data();});
        if(!settings){snapshot.forEach(d=>{const data=d.data();if(Array.isArray(data.classes)||Array.isArray(data.sections))settings=data;});}
        const classes=Array.isArray(settings?.classes)?settings.classes:[];
        const sections=Array.isArray(settings?.sections)?settings.sections:[];
        if(classSelect) classSelect.innerHTML='<option value="">Select Class</option>'+classes.map(c=>`<option value="${escapeHTML(c)}">Class ${escapeHTML(c)}</option>`).join("");
        if(sectionSelect) sectionSelect.innerHTML='<option value="">Select Section</option>'+sections.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
        localStorage.setItem("questionSettings",JSON.stringify({classes,sections}));
    }catch(error){console.error("Question Settings Load Error:",error);}
}

async function loadExams(){
    try{
        const snapshot=await getDocs(collection(db,"exams"));
        examSelect.innerHTML='<option value="">Select Assessment</option>';
        snapshot.forEach(examDoc=>{const exam=examDoc.data();examSelect.innerHTML+=`<option value="${escapeHTML(examDoc.id)}">${escapeHTML(exam.examName||"Unnamed Assessment")}</option>`;});
    }catch(error){console.error("Assessment Load Error:",error);examSelect.innerHTML='<option value="">Unable to load assessments</option>';}
}

function value(id){return document.getElementById(id)?.value.trim()||"";}

window.saveQuestion=async function(){
    try{
        const examId=value("examSelect"), examClass=value("examClass"), section=value("questionSection"), questionType=value("questionType"), question=value("question"), marksValue=value("marks");
        if(!examId||!examClass||!section||!question||!marksValue){alert("Please select Class, Section, Assessment and fill the question and marks.");return;}
        const marks=Number(marksValue); if(!Number.isFinite(marks)||marks<=0){alert("Please enter valid marks greater than 0.");return;}
        const data={examId, class:examClass, section, questionType, question, marks};

        if(questionType==="mcq"){
            data.optionA=value("optionA");data.optionB=value("optionB");data.optionC=value("optionC");data.optionD=value("optionD");data.answer=value("answer");
            if(!data.optionA||!data.optionB||!data.optionC||!data.optionD||!data.answer){alert("Please enter all four options and select the correct answer.");return;}
        }
        if(questionType==="multiple"){
            data.optionA=value("optionA");data.optionB=value("optionB");data.optionC=value("optionC");data.optionD=value("optionD");
            data.answers=[];["A","B","C","D"].forEach(k=>{if(document.getElementById("ans"+k)?.checked)data.answers.push(k);});
            if(!data.optionA||!data.optionB||!data.optionC||!data.optionD||!data.answers.length){alert("Please enter all four options and select at least one correct answer.");return;}
        }
        if(questionType==="truefalse"){
            data.optionA="True";data.optionB="False";data.answer=value("trueFalseAnswer");
            if(!data.answer){alert("Select True or False as the correct answer.");return;}
        }
        if(questionType==="fillblank"){
            data.answer=value("blankAnswer");
            if(!data.answer){alert("Enter the expected answer for the blank.");return;}
        }
        if(questionType==="sentence"){
            data.modelAnswer=value("modelAnswer");
        }
        await addDoc(collection(db,"questions"),data);
        alert("Question Saved Successfully");clearForm();
    }catch(error){console.error("Question Save Error:",error);alert("Unable To Save Question\n\n"+error.message);}
};

function clearForm(){
 ["questionId","question","optionA","optionB","optionC","optionD","answer","trueFalseAnswer","blankAnswer","marks","modelAnswer"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
 ["ansA","ansB","ansC","ansD"].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false;});
 document.getElementById("questionType").value="mcq";updateQuestionType();
}

loadQuestionSettings();
loadExams();
