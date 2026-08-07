import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ======================================
// LOAD COMPLETED EXAMS
// ======================================

async function loadCompletedExams() {

    const completedDiv =
        document.getElementById("completedExamList");

    completedDiv.innerHTML = "Loading Results...";

    try {

        const studentName =
            localStorage.getItem("studentName");

        const snapshot =
            await getDocs(
                collection(db, "results")
            );

        let html = "";

        snapshot.forEach(docSnap => {

            const result = docSnap.data();

            if (
                (result.studentName || result.participantName) === studentName
            ) {

                html += `

                <div class="exam-card">

                    <h3>${result.examName}</h3>

                    <p>
                        Subject :
                        ${result.subject}
                    </p>

                    <p>
                        Score :
                        ${result.score}/${result.totalMarks}
                    </p>

                    <p>
                        Percentage :
                        ${Number(result.percentage).toFixed(2)}%
                    </p>

                    <button
                        onclick="viewResult('${docSnap.id}')">

                        📄 Result

                    </button>

                    <button
                        onclick="reviewAssessment('${docSnap.id}')">

                        🔍 Review

                    </button>

                </div>

                `;

            }

        });

        if (html === "") {

            html = `
                <p>
                    No completed assessments.
                </p>
            `;

        }

        completedDiv.innerHTML = html;

    }

    catch (error) {

        console.error(error);

        completedDiv.innerHTML =
            "Unable to load results.";

    }

}
window.viewResult = function(resultId){

    window.location.href =
        "result.html?id=" + resultId;

};

window.reviewAssessment = function(resultId){

    window.location.href =
        "review/review.html?id=" + resultId;

};

loadCompletedExams();

    window.location.href =
        "review/review.html?id=" + resultId;

};
