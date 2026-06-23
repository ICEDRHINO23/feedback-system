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

    try {

        const snapshot = await getDocs(
            collection(db, "questions")
        );

        questions = [];

        snapshot.forEach(doc => {

            questions.push({
                id: doc.id,
                ...doc.data()
            });

        });

        if (questions.length === 0) {

            document.getElementById(
                "questionText"
            ).innerHTML =
                "No Questions Found";

            return;
        }

        showQuestion();

    } catch (error) {

        console.error(error);

        document.getElementById(
            "questionText"
        ).innerHTML =
            "Unable to Load Questions";
    }
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
        document.getElementById(
            "options"
        );

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

    if (answers[currentQuestion]) {

        const buttons =
            document.querySelectorAll(
                ".option"
            );

        buttons.forEach(btn => {

            if (
                btn.innerText.startsWith(
                    answers[currentQuestion]
                )
            ) {

                btn.style.background =
                    "#28a745";

                btn.style.color =
                    "#fff";
            }

        });
    }
}

window.saveAnswer = function(answer) {

    answers[currentQuestion] =
        answer;

    const buttons =
        document.querySelectorAll(
            ".option"
        );

    buttons.forEach(btn => {

        btn.style.background = "";
        btn.style.color = "";

        if (
            btn.innerText.startsWith(
                answer
            )
        ) {

            btn.style.background =
                "#28a745";

            btn.style.color =
                "#fff";
        }

    });

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

    if (
        currentQuestion > 0
    ) {

        currentQuestion--;

        showQuestion();
    }
}

async function submitExam() {

    let score = 0;
    let totalMarks = 0;
    let correctAnswers = 0;

    questions.forEach((q, index) => {

        const marks =
            Number(q.marks || 1);

        totalMarks += marks;

        if (
            answers[index] === q.answer
        ) {

            score += marks;

            correctAnswers++;
        }

    });

    const percentage =
        (
            (score / totalMarks) * 100
        ).toFixed(2);

    try {

        await addDoc(
            collection(db, "results"),
            {

                studentName:
                    localStorage.getItem(
                        "studentName"
                    ) || "",

                class:
                    localStorage.getItem(
                        "studentClass"
                    ) || "",

                section:
                    localStorage.getItem(
                        "studentSection"
                    ) || "",

                rollNo:
                    localStorage.getItem(
                        "rollNo"
                    ) || "",

                score:
                    score,

                totalMarks:
                    totalMarks,

                correctAnswers:
                    correctAnswers,

                totalQuestions:
                    questions.length,

                percentage:
                    percentage,

                date:
                    new Date()
                    .toLocaleDateString(),

                submittedAt:
                    new Date()
                    .toISOString()

            }
        );

        alert(
            "Exam Submitted Successfully!\n\n" +
            "Score: " +
            score +
            "/" +
            totalMarks +
            "\nPercentage: " +
            percentage +
            "%"
        );

        window.location.href =
            "result.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Failed to Save Result"
        );
    }
}

loadQuestions();
