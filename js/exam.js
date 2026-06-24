```javascript
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

// ==========================
// LOAD QUESTIONS
// ==========================

async function loadQuestions() {

    try {

        const container =
            document.getElementById(
                "questionContainer"
            );

        container.innerHTML = "";

        // Load Exam Details

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

        // Load Questions

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

                // ==================
                // MCQ
                // ==================

                if (
                    !q.questionType ||
                    q.questionType === "mcq"
                ) {

                    container.innerHTML += `

                    <div class="question-box">

                        <h3>
                            Q${count}. ${q.question}
                        </h3>

                        <label>
                            <input type="radio"
                            name="${docSnap.id}"
                            value="A">
                            ${q.optionA}
                        </label>

                        <label>
                            <input type="radio"
                            name="${docSnap.id}"
                            value="B">
                            ${q.optionB}
                        </label>

                        <label>
                            <input type="radio"
                            name="${docSnap.id}"
                            value="C">
                            ${q.optionC}
                        </label>

                        <label>
                            <input type="radio"
                            name="${docSnap.id}"
                            value="D">
                            ${q.optionD}
                        </label>

                    </div>

                    `;
                }

                // ==================
                // MULTIPLE ANSWER
                // ==================

                if (
                    q.questionType === "multiple"
                ) {

                    container.innerHTML += `

                    <div class="question-box">

                        <h3>
                            Q${count}. ${q.question}
                        </h3>

                        <label>
                            <input type="checkbox"
                            name="${docSnap.id}"
                            value="A">
                            ${q.optionA}
                        </label>

                        <label>
                            <input type="checkbox"
                            name="${docSnap.id}"
                            value="B">
                            ${q.optionB}
                        </label>

                        <label>
                            <input type="checkbox"
                            name="${docSnap.id}"
                            value="C">
                            ${q.optionC}
                        </label>

                        <label>
                            <input type="checkbox"
                            name="${docSnap.id}"
                            value="D">
                            ${q.optionD}
                        </label>

                    </div>

                    `;
                }

                // ==================
                // SENTENCE
                // ==================

                if (
                    q.questionType === "sentence"
                ) {

                    container.innerHTML += `

                    <div class="question-box">

                        <h3>
                            Q${count}. ${q.question}
                        </h3>

                        <textarea
                        id="answer_${docSnap.id}"
                        rows="5"
                        placeholder="Write your answer here"></textarea>

                    </div>

                    `;
                }

                count++;
            }

        });

        if (
            questions.length === 0
        ) {

            container.innerHTML =

            `<h3>No Questions Found</h3>`;
        }

    }
    catch (error) {

        console.error(error);

        document.getElementById(
            "questionContainer"
        ).innerHTML =

        "<h3>Error Loading Questions</h3>";
    }

}

// ==========================
// TIMER
// ==========================

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

// ==========================
// SUBMIT EXAM
// ==========================

window.submitExam =
async function () {

    try {

        let score = 0;
        let totalMarks = 0;

        const subjectiveAnswers = [];

        questions.forEach(q => {

            totalMarks +=
                Number(
                    q.marks || 1
                );

            // MCQ

            if (
                !q.questionType ||
                q.questionType === "mcq"
            ) {

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
            }

            // MULTIPLE ANSWER

            if (
                q.questionType === "multiple"
            ) {

                const selectedAnswers = [];

                document
                .querySelectorAll(
                    `input[name="${q.id}"]:checked`
                )
                .forEach(box => {

                    selectedAnswers.push(
                        box.value
                    );

                });

                const correctAnswers =
                    q.answers || [];

                const isCorrect =

                    selectedAnswers.length ===
                    correctAnswers.length &&

                    selectedAnswers.every(
                        answer =>
                        correctAnswers.includes(
                            answer
                        )
                    );

                if (isCorrect) {

                    score +=
                        Number(
                            q.marks || 1
                        );
                }
            }

            // SENTENCE ANSWERS

            if (
                q.questionType === "sentence"
            ) {

                const answerBox =
                    document.getElementById(
                        `answer_${q.id}`
                    );

                subjectiveAnswers.push({

                    questionId:
                        q.id,

                    question:
                        q.question,

                    modelAnswer:
                        q.modelAnswer || "",

                    studentAnswer:
                        answerBox
                        ? answerBox.value
                        : "",

                    marks:
                        q.marks

                });
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

        const studentClass =
            localStorage.getItem(
                "studentClass"
            ) || "";

        const studentSection =
            localStorage.getItem(
                "studentSection"
            ) || "";

        const percentage =

            totalMarks > 0
            ? (
                (score / totalMarks) * 100
              ).toFixed(2)
            : 0;

        await addDoc(
            collection(
                db,
                "results"
            ),
            {
                examId,
                role,
                participantName,
                studentClass,
                studentSection,
                score,
                totalMarks,
                percentage,
                subjectiveAnswers,
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

        localStorage.setItem(
            "latestPercentage",
            percentage
        );

        alert(
            `Assessment Submitted\n\nScore: ${score}/${totalMarks}`
        );

        if (
            role === "teacher"
        ) {

            window.location.href =
                "teacher-results.html";

        }
        else {

            window.location.href =
                "result.html";
        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Failed To Submit Assessment"
        );
    }

};

// ==========================
// START
// ==========================

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
```
