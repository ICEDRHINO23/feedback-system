import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examId = localStorage.getItem("currentExamId");

let questions = [];

console.log("Current Exam ID:", examId);

async function loadQuestions() {

    const container =
        document.getElementById("questionContainer");

    try {

        container.innerHTML = "";

        const snapshot =
            await getDocs(
                collection(db, "questions")
            );

        let count = 1;

        snapshot.forEach((docSnap) => {

            const q = docSnap.data();

            if (q.examId === examId) {

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

                count++;
            }

        });

        if (questions.length === 0) {

            container.innerHTML = `

            <div class="question-box">
                <h3>No Questions Found</h3>
                <p>This assessment contains no questions.</p>
            </div>

            `;
        }

    }
    catch (error) {

        console.error(error);

        container.innerHTML =
            "<h3>Error Loading Questions</h3>";
    }
}

window.submitExam = async function () {

    try {

        let score = 0;
        let totalMarks = 0;

        questions.forEach((q) => {

            totalMarks += Number(q.marks || 1);

            const selected =
                document.querySelector(
                    `input[name="${q.id}"]:checked`
                );

            if (
                selected &&
                selected.value === q.answer
            ) {
                score += Number(q.marks || 1);
            }

        });

        const role =
            localStorage.getItem("role") || "student";

        const participantName =
            localStorage.getItem("studentName") ||
            localStorage.getItem("teacherName") ||
            "Unknown";

        await addDoc(
            collection(db, "results"),
            {
                examId,
                participantName,
                role,
                score,
                totalMarks,
                submittedAt:
                    new Date().toISOString()
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
            `Assessment Submitted\nScore : ${score}/${totalMarks}`
        );

        window.location.href =
            "result.html";

    }
    catch (error) {

        console.error(error);

        alert("Submission Failed");
    }
};

loadQuestions();
