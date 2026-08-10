import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// GET RESULT ID
// ======================================

const params =
    new URLSearchParams(
        window.location.search
    );

const resultId =
    params.get("id");


if (!resultId) {

    alert(
        "Result ID not found."
    );

    window.location.href =
        "dashboard.html";

}


// ======================================
// LOAD STUDENT REPORT
// ======================================

async function loadStudentReport() {

    try {

        const resultRef =
            doc(
                db,
                "results",
                resultId
            );


        const resultSnap =
            await getDoc(
                resultRef
            );


        if (!resultSnap.exists()) {

            alert(
                "Result not found."
            );

            return;

        }


        const result =
            resultSnap.data();


        console.log(
            "Student Report:",
            result
        );


        // ==================================
        // TEACHER EVALUATION PROTECTION
        // ==================================

        const evaluationPending =
            result.hasDescriptiveQuestions === true &&
            (
                result.reviewStatus === "pending" ||
                result.resultPublished !== true
            );


        // ==================================
        // STUDENT DETAILS
        // ==================================

        const studentName =
            document.getElementById(
                "studentName"
            );

        const studentClass =
            document.getElementById(
                "studentClass"
            );

        const examName =
            document.getElementById(
                "examName"
            );

        const subject =
            document.getElementById(
                "subject"
            );

        const correctAnswers =
            document.getElementById(
                "correctAnswers"
            );

        const totalQuestions =
            document.getElementById(
                "totalQuestions"
            );

        const percentage =
            document.getElementById(
                "percentage"
            );

        const scoreText =
            document.getElementById(
                "scoreText"
            );


        studentName.textContent =
            result.studentName ||
            result.participantName ||
            "-";


        studentClass.textContent =
            result.studentClass ||
            result.examClass ||
            "-";


        examName.textContent =
            result.examName ||
            "-";


        subject.textContent =
            result.subject ||
            "-";


        totalQuestions.textContent =
            result.totalQuestions ||
            0;


        // ==================================
        // PENDING EVALUATION
        // ==================================

        if (
            evaluationPending
        ) {

            scoreText.textContent =
                "UNDER TEACHER EVALUATION";


            scoreText.style.color =
                "#d97706";


            scoreText.style.fontSize =
                "20px";


            correctAnswers.textContent =
                "Pending";


            percentage.textContent =
                "Pending";


            // ==================================
            // PENDING MESSAGE
            // ==================================

            const message =
                document.createElement(
                    "div"
                );


            message.className =
                "evaluation-pending-message";


            message.innerHTML = `

                <strong>
                    🟠 Under Teacher Evaluation
                </strong>

                <p>
                    Your assessment contains
                    descriptive questions that
                    require teacher evaluation.
                </p>

                <p>
                    Your final marks and result
                    will be published after the
                    teacher completes the evaluation.
                </p>

            `;


            const resultBox =
                document.querySelector(
                    ".result-box"
                );


            if (resultBox) {

                resultBox.insertAdjacentElement(
                    "afterend",
                    message
                );

            }


            return;

        }


        // ==================================
        // PUBLISHED RESULT
        // ==================================

        const score =
            Number(
                result.score || 0
            );


        const totalMarks =
            Number(
                result.totalMarks || 0
            );


        const percentageValue =
            Number(
                result.percentage || 0
            );


        const automaticCorrect =
            Number(
                result.correctAnswers || 0
            );


        scoreText.textContent =
            score +
            " / " +
            totalMarks;


        correctAnswers.textContent =
            automaticCorrect;


        percentage.textContent =
            percentageValue.toFixed(2) +
            "%";


    }
    catch (error) {

        console.error(
            "STUDENT REPORT ERROR:",
            error
        );


        alert(
            "Unable to load student report.\n\n" +
            error.message
        );

    }

}


// ======================================
// START
// ======================================

loadStudentReport();
