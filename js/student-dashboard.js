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

        if (!studentClass) {

            examList.innerHTML = `
                <p>
                    Student Class Not Found.
                    Please Login Again.
                </p>
            `;

            return;
        }

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examList.innerHTML = "";

        let found = false;

        snapshot.forEach((docSnap) => {

            const exam =
                docSnap.data();

            console.log(
                "Exam:",
                exam
            );

            console.log(
                "Exam Class:",
                exam.examClass
            );

            console.log(
                "Target Type:",
                exam.targetType
            );

            if (
                String(exam.examClass).trim() ===
                String(studentClass).trim() &&
                exam.targetType === "student" &&
                exam.status === "active"
            ) {

                found = true;

                examList.innerHTML += `

                <div class="exam-card">

                    <h3>
                        ${exam.examName}
                    </h3>

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

                    <p>
                        Start Date:
                        ${exam.startDate}
                    </p>

                    <p>
                        End Date:
                        ${exam.endDate}
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

            examList.innerHTML = `

            <div class="exam-card">

                <h3>
                    No Exams Available
                </h3>

                <p>
                    No assessments assigned
                    for Class ${studentClass}
                </p>

            </div>

            `;
        }

    }
    catch (error) {

        console.error(
            "Exam Loading Error:",
            error
        );

        examList.innerHTML = `

        <p>
            Unable To Load Exams
        </p>

        `;
    }
}

window.startExam = function (examId) {

    console.log(
        "Starting Exam:",
        examId
    );

    localStorage.setItem(
        "currentExamId",
        examId
    );

    window.location.href =
        "exam.html";
};

loadExams();
