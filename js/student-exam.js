import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let questions = [];
let currentQuestion = 0;
let answers = {};

window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.submitExam = submitExam;

async function loadQuestions() {

    const snapshot = await getDocs(
        collection(db, "questions")
    );

    snapshot.forEach(doc => {

        questions.push({
            id: doc.id,
            ...doc.data()
        });

    });

    if (questions.length === 0) {

        document.getElementById(
            "questionText"
        ).innerHTML = "No Questions Found";

        return;
    }

    showQuestion();
}

function showQuestion() {

    let q = questions[currentQuestion];

    document.getElementById(
        "questionText"
    ).innerHTML =
        (currentQuestion + 1) +
        ". " +
        q.question;

    let optionsDiv =
        document.getElementById("options");

    optionsDiv.innerHTML = `
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

window.saveAnswer = function(answer) {

    answers[currentQuestion] = answer;

    alert("Answer Saved");
};

function nextQuestion() {

    if (
        currentQuestion <
        questions.length - 1
    ) {

        currentQuestion++;
        showQuestion();
    }
}

function previousQuestion() {

    if (currentQuestion > 0) {

        currentQuestion--;
        showQuestion();
    }
}

async function submitExam() {

    let score = 0;
    let review = [];
    let totalMarks = 0;
    let correctAnswers = 0;
questions.forEach((q, index) => {

    const studentAnswer =
        answers[index] || "";

    const correctAnswer =
        q.answer;

    const marks =
        Number(q.marks || 1);

    totalMarks += marks;

    const isCorrect =
        studentAnswer === correctAnswer;

    if (isCorrect) {

        score += marks;

        correctAnswers++;

    }

   review.push({

    questionId: q.id || "",

    question: q.question || "",

    optionA: q.optionA || "",

    optionB: q.optionB || "",

    optionC: q.optionC || "",

    optionD: q.optionD || "",

    selectedAnswer: studentAnswer,

    correctAnswer: correctAnswer,

    explanation: q.explanation || "",

    marks: isCorrect ? marks : 0,

    totalMarks: marks,

    isCorrect: isCorrect

});   
    });
    const percentage =
        (
            score /
            totalMarks
        ) * 100;

    try {

     await addDoc(
    collection(db, "results"),
    {

        // Student Details
        studentName:
            localStorage.getItem("studentName") || "",

        studentClass:
            localStorage.getItem("studentClass") || "",

        studentSection:
            localStorage.getItem("studentSection") || "",

        // Exam Details
        examId: examId,
        examName: exam.examName,
        subject: exam.subject,

        // Marks
        score: score,
        totalMarks: totalMarks,
        correctAnswers: correctAnswers,
        totalQuestions: questions.length,
        percentage: percentage.toFixed(2),

        // ⭐ Review Data
        review: review,

        // Time
        submittedAt:
            new Date().toISOString()

    }
);

        alert(
            "Exam Submitted!\n\n" +
            "Score: " +
            score +
            "/" +
            totalMarks +
            "\nPercentage: " +
            percentage.toFixed(2) +
            "%"
        );

 localStorage.setItem("latestScore", score);
localStorage.setItem("latestTotal", totalMarks);
localStorage.setItem("latestPercentage", percentage.toFixed(2));
localStorage.setItem("latestCorrectAnswers", correctAnswers);

window.location.href = "result.html";

    } catch (error) {

        console.error(error);

        alert(
            "Failed to save result"
        );
    }
}

loadQuestions();
