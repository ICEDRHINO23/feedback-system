
import { db } from "./firebase-config.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let questions = [];
let currentQuestion = 0;
let answers = {};

window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.submitExam = submitExam;

async function loadQuestions(){

const snapshot = await getDocs(
collection(db,"questions")
);

snapshot.forEach(doc=>{

questions.push({
id:doc.id,
...doc.data()
});

});

if(questions.length===0){

document.getElementById(
"questionText"
).innerHTML="No Questions Found";

return;
}

showQuestion();
}

function showQuestion(){

let q = questions[currentQuestion];

document.getElementById(
"questionText"
).innerHTML=
(currentQuestion+1)+". "+q.question;

let optionsDiv =
document.getElementById("options");

optionsDiv.innerHTML=`
<button class="option"
onclick="saveAnswer('A')">
A. ${q.optionA}
</button>

<button class="option"
onclick="saveAnswer('B')">
B. ${q.optionB}
</button>

<button class="option"
onclick="saveAnswer('C')">
C. ${q.optionC}
</button>

<button class="option"
onclick="saveAnswer('D')">
D. ${q.optionD}
</button>
`;
}

window.saveAnswer=function(answer){

answers[currentQuestion]=answer;

alert("Answer Saved");
}

function nextQuestion(){

if(currentQuestion<
questions.length-1){

currentQuestion++;

showQuestion();
}
}

function previousQuestion(){

if(currentQuestion>0){

currentQuestion--;

showQuestion();
}
}

function submitExam(){

alert(
"Exam Submitted Successfully"
);

window.location.href=
"dashboard.html";
}

loadQuestions();
