
import { db } from "./firebase-config.js";

import {
collection,
addDoc,
getDocs,
deleteDoc,
doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examSelect =
document.getElementById("examSelect");

async function loadExams(){

const snapshot =
await getDocs(collection(db,"exams"));

snapshot.forEach(examDoc=>{

const exam=examDoc.data();

examSelect.innerHTML += `
<option value="${examDoc.id}">
${exam.examName}
</option>
`;

});

}

window.saveQuestion = async function(){

const examId =
document.getElementById("examSelect").value;

const question =
document.getElementById("question").value;

const optionA =
document.getElementById("optionA").value;

const optionB =
document.getElementById("optionB").value;

const optionC =
document.getElementById("optionC").value;

const optionD =
document.getElementById("optionD").value;

const answer =
document.getElementById("answer").value;

const marks =
document.getElementById("marks").value;

if(
!examId ||
!question ||
!answer ||
!marks
){
alert("Fill all fields");
return;
}

await addDoc(
collection(db,"questions"),
{
examId,
question,
optionA,
optionB,
optionC,
optionD,
answer,
marks
}
);

alert("Question Saved");

location.reload();

};

async function loadQuestions(){

const tbody =
document.getElementById("questionTable");

const snapshot =
await getDocs(
collection(db,"questions")
);

tbody.innerHTML="";

snapshot.forEach(questionDoc=>{

const q =
questionDoc.data();

tbody.innerHTML += `
<tr>
<td>${q.question}</td>
<td>${q.answer}</td>
<td>${q.marks}</td>
<td>
<button
class="delete-btn"
onclick="deleteQuestion('${questionDoc.id}')">
Delete
</button>
</td>
</tr>
`;

});

}

window.deleteQuestion =
async function(id){

if(!confirm("Delete Question?"))
return;

await deleteDoc(
doc(db,"questions",id)
);

location.reload();

};

loadExams();
loadQuestions();
