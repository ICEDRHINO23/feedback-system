import { db } from "./firebase-config.js";
import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// GET RESULT ID
// ======================================

const params = new URLSearchParams(window.location.search);

const resultId = params.get("id");

if (!resultId) {

    alert("Result ID not found");

    window.location.href = "results.html";

}

// ======================================
// LOAD REPORT
// ======================================

async function loadReport() {

    try {

        // Load Result
        const resultRef = doc(db, "results", resultId);

        const resultSnap = await getDoc(resultRef);

        if (!resultSnap.exists()) {

            alert("Result Not Found");

            return;

        }

        const result = resultSnap.data();

        // Load Exam

        let exam = {};

        if (result.examId) {

            const examRef = doc(db, "exams", result.examId);

            const examSnap = await getDoc(examRef);

            if (examSnap.exists()) {

                exam = examSnap.data();

            }

        }

        // ======================
        // Student Details
        // ======================

       document.getElementById("studentName").innerText =
    result.studentName ||
    result.participantName ||
    "-";

        document.getElementById("rollNo").innerText =
            result.rollNo || "-";

        document.getElementById("studentClass").innerText =
            result.studentClass ||
            result.examClass ||
            exam.examClass ||
            "-";

       document.getElementById("section").innerText =
    result.section ||
    result.studentSection ||
    "-";
        // ======================
        // Exam Details
        // ======================

        document.getElementById("examName").innerText =
            exam.examName ||
            result.examName ||
            "-";

        document.getElementById("subject").innerText =
            exam.subject ||
            result.subject ||
            "-";

        document.getElementById("submittedDate").innerText =
            result.submittedAt
            ?new Date(result.submittedAt).toLocaleString()
            : "-";

        // ======================
        // Score
        // ======================

        const score =
            Number(result.score || 0);

        const totalMarks =
            Number(result.totalMarks || 0);

        const percentage =
            Number(result.percentage || 0);

        document.getElementById("score").innerText =
            score;

        document.getElementById("totalMarks").innerText =
            totalMarks;

        document.getElementById("percentage").innerText =
            percentage.toFixed(2) + "%";

        document.getElementById("summaryPercentage").innerText =
            percentage.toFixed(2) + "%";

        // ======================
        // Pass / Fail
        // ======================

        const status =
            percentage >= 35
                ? "PASS"
                : "FAIL";

        document.getElementById("status").innerText =
            status;

        document.getElementById("resultStatus").innerText =
            status;

        // ======================
        // Questions
        // ======================

        const totalQuestions =
            Number(result.totalQuestions || totalMarks);

        const correctAnswers =
            Number(result.correctAnswers || score);

        const wrongAnswers =
            totalQuestions - correctAnswers;

        document.getElementById("totalQuestions").innerText =
            totalQuestions;

        document.getElementById("correctAnswers").innerText =
            correctAnswers;

        document.getElementById("wrongAnswers").innerText =
            wrongAnswers;

      // ======================
// Rank Calculation
// ======================

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const resultsSnapshot =
    await getDocs(
        collection(db,"results")
    );

let resultList = [];

resultsSnapshot.forEach(docSnap=>{

    const r = docSnap.data();

    if(
        (r.examId || "") ===
        (result.examId || "")
    ){

        resultList.push(r);

    }

});

resultList.sort((a,b)=>

    Number(b.percentage||0) -

    Number(a.percentage||0)

);

const rank =

resultList.findIndex(r=>

    r.studentName===result.studentName

)+1;

document.getElementById("rank").innerText =
rank>0 ? rank : "-";

    }

    catch (error) {

        console.error(error);

        alert("Unable To Load Report");

    }

}

loadReport();
