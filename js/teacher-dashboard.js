import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadAssessments() {

    try {

        const assessmentList =
            document.getElementById(
                "assessmentList"
            );

        const examCount =
            document.getElementById(
                "examCount"
            );

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        assessmentList.innerHTML = "";

        let totalAssessments = 0;

        snapshot.forEach(doc => {

            const exam =
                doc.data();

            if (
                exam.targetRole === "teacher" ||
                exam.targetRole === "all"
            ) {

                totalAssessments++;

                assessmentList.innerHTML += `

                <div class="assessment-card">

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

                    <button
                    class="start-btn"
                    onclick="startAssessment('${doc.id}')">

                    Start Assessment

                    </button>

                </div>

                `;
            }

        });

        examCount.innerHTML =
            totalAssessments;

        if (
            totalAssessments === 0
        ) {

            assessmentList.innerHTML = `

            <div class="assessment-card">

                <h3>
                    No Assessments Available
                </h3>

                <p>
                    No assessments have been assigned yet.
                </p>

            </div>

            `;
        }

    }
    catch(error){

        console.error(error);

        document.getElementById(
            "assessmentList"
        ).innerHTML =

        "<p>Unable To Load Assessments</p>";
    }
}

window.startAssessment =
function(examId){

    localStorage.setItem(
        "currentExamId",
        examId
    );

    localStorage.setItem(
        "participantRole",
        "teacher"
    );

    window.location.href =
        "exam.html";
};

async function loadTeacherResults() {

    try {

        const resultCount =
            document.getElementById(
                "resultCount"
            );

        const teacherName =
            localStorage.getItem(
                "teacherName"
            );

        const snapshot =
            await getDocs(
                collection(db, "results")
            );

        let count = 0;

        snapshot.forEach(doc => {

            const result =
                doc.data();

            if (
                result.teacherName ===
                teacherName
            ) {

                count++;
            }

        });

        resultCount.innerHTML =
            count;

    }
    catch(error){

        console.error(error);
    }
}

loadAssessments();
loadTeacherResults();
