import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examId =
    localStorage.getItem("currentExamId");

let questions = [];
let totalDuration = 30;

// =====================================
// LOAD QUESTIONS
// =====================================

async function loadQuestions() {

    try {

        const container =
            document.getElementById(
                "questionContainer"
            );

        container.innerHTML = "";

        // LOAD EXAM DETAILS

        const examSnapshot =
            await getDocs(
                collection(db, "exams")
            );

        examSnapshot.forEach(docSnap => {

            if (
                docSnap.id === examId
            ) {

                const exam =
                    docSnap.data();

                totalDuration =
                    Number(
                        exam.duration || 30
                    );

            }

        });

        startTimer();

        // LOAD QUESTIONS

        const questionSnapshot =
            await getDocs(
                collection(db, "questions")
            );

        let count = 1;

        questionSnapshot.forEach(docSnap => {

            const q =
                docSnap.data();

            if (
                q.examId === examId
            ) {

                questions.push({
                    id: docSnap.id,
                    ...q
                });

                container.innerHTML += `

                <div class="question-box">

                    <h3>
                        Q${count}. ${q.question}
                    </h3>

                    <label>
                        <input
                            type="radio"
                            name="${docSnap.id}"
                            value="A">
                        ${q.optionA || ""}
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="${docSnap.id}"
                            value="B">
                        ${q.optionB || ""}
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="${docSnap.id}"
                            value="C">
                        ${q.optionC || ""}
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="${docSnap.id}"
                            value="D">
                        ${q.optionD || ""}
                    </label>

                </div>

                `;

                count++;

            }

        });

        if (
            questions.length === 0
        ) {

            container.innerHTML = `

            <div class="question-box">

                <h3>
                    No Questions Found
                </h3>

                <p>
                    This assessment does not contain any questions.
                </p>

            </div>

            `;

        }

    }
    catch (error) {

        console.error(
            "LOAD QUESTION ERROR:",
            error
        );

        document.getElementById(
            "questionContainer"
        ).innerHTML =

        "<h3>Error Loading Questions</h3>";

    }

}

// =====================================
// TIMER
// =====================================

function startTimer() {

    let timeLeft =
        totalDuration * 60;

    const timer =
        document.getElementById(
            "timer"
        );

    const interval =
        setInterval(() => {

            const minutes =
                Math.floor(
                    timeLeft / 60
                );

            const seconds =
                timeLeft % 60;

            timer.innerHTML =

            `${minutes}:${
                seconds < 10
                ? "0" + seconds
                : seconds
            }`;

            timeLeft--;

            if (
                timeLeft < 0
            ) {

                clearInterval(
                    interval
                );

                alert(
                    "Time Up! Assessment Submitted."
                );

                submitExam();

            }

        }, 1000);

}

// =====================================
// SUBMIT EXAM
// =====================================

window.submitExam =
async function () {

    try {

        let score = 0;
        let totalMarks = 0;

        questions.forEach(q => {

            totalMarks +=
                Number(
                    q.marks || 1
                );

            const selected =
                document.querySelector(
                    `input[name="${q.id}"]:checked`
                );

            if (
                selected &&
                selected.value === q.answer
            ) {

                score +=
                    Number(
                        q.marks || 1
                    );

            }

        });

        const role =
            localStorage.getItem(
                "role"
            );

        const participantName =

            role === "teacher"

            ? localStorage.getItem(
                "teacherName"
              )

            : localStorage.getItem(
                "studentName"
              );

        await addDoc(
            collection(
                db,
                "results"
            ),
            {
                examId,
                role,
                participantName,
                score,
                totalMarks,
                percentage:
                    totalMarks > 0
                    ? (
                        score /
                        totalMarks *
                        100
                    ).toFixed(2)
                    : 0,
                submittedAt:
                    new Date()
                    .toISOString()
            }
        );

        localStorage.setItem(
            "latestScore",
            score
        );

        localStorage.setItem(
            "latestTotal",
            totalMarks
        );

        alert(
            `Assessment Submitted\nScore: ${score}/${totalMarks}`
        );

        window.location.href =
            "result.html";

    }
    catch (error) {

        console.error(
            "SUBMIT ERROR:",
            error
        );

        alert(
            "Failed To Submit Assessment"
        );

    }

};

// =====================================
// START
// =====================================

if (!examId) {

    alert(
        "No Assessment Selected"
    );

    window.location.href =
        "dashboard.html";

}
else {

    loadQuestions();

}
