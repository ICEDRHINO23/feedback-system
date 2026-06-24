import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadExams() {

    const examList =
        document.getElementById("examList");

    try {

        const studentClass =
            localStorage.getItem("studentClass");

        console.log(
            "Student Class:",
            studentClass
        );

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examList.innerHTML = "";

        let found = false;

        snapshot.forEach(docSnap => {

            const exam =
                docSnap.data();

            console.log(exam);

            if (
                exam.targetType === "student" &&
                exam.examClass === studentClass
            ) {

                found = true;

                examList.innerHTML += `

                <div class="exam-card">

                    <h3>${exam.examName}</h3>

                    <p>
                        Subject:
                        ${exam.subject}
                    </p>

                    <p>
                        Duration:
                        ${exam.duration} Minutes
                    </p>

                    <p>
                        Total Marks:
                        ${exam.totalMarks}
                    </p>

                    <button
                    onclick="startExam('${docSnap.id}')">

                    Start Exam

                    </button>

                </div>

                `;
            }

        });

        if (!found) {

            examList.innerHTML =
                "<p>No Exams Available</p>";
        }

    }
    catch (error) {

        console.error(error);

        examList.innerHTML =
            "<p>Unable To Load Exams</p>";
    }
}

window.startExam = function (examId) {

    localStorage.setItem(
        "currentExamId",
        examId
    );

    window.location.href =
        "exam.html";
};

loadExams();
