import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// LOAD AVAILABLE EXAMS
// ======================================

async function loadExams() {

    const examList =
        document.getElementById("examList");

    try {

        const studentClass =
            localStorage.getItem("studentClass");

        if (!studentClass) {

            examList.innerHTML = `
                <p>Student Class Not Found.</p>
            `;

            return;

        }

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examList.innerHTML = "";

        let found = false;

        snapshot.forEach(docSnap => {

            const exam =
                docSnap.data();

            if (

                String(exam.examClass).trim() ===
                String(studentClass).trim()

                &&

                exam.targetType === "student"

                &&

                exam.status === "active"

            ) {

                found = true;

                examList.innerHTML += `

                <div class="exam-card">

                    <h3>${exam.examName}</h3>

                    <p>
                        Subject :
                        ${exam.subject}
                    </p>

                    <p>
                        Duration :
                        ${exam.duration} Minutes
                    </p>

                    <p>
                        Total Marks :
                        ${exam.totalMarks}
                    </p>

                    <button
                        class="start-btn"
                        onclick="startExam('${docSnap.id}')">
    
                        Start Assessment

                    </button>
                </div>

                `;

            }

        });

        if (!found) {

            examList.innerHTML = `

            <div class="exam-card">

                <h3>No Assessments Available</h3>

                <p>

                    No active assessments for your class.

                </p>

            </div>

            `;

        }

    }

    catch(error){

        console.error(error);

        examList.innerHTML =
            "Unable To Load Assessments";

    }

}

// ======================================
// START EXAM
// ======================================

window.startExam = function(examId){

    localStorage.setItem(
        "currentExamId",
        examId
    );

    window.location.href =
        "student-exam.html";

};
// ======================================
// LOAD PERFORMANCE SUMMARY
// ======================================

async function loadPerformanceSummary() {

    try {

        const studentName =
            localStorage.getItem(
                "studentName"
            );


        if (!studentName) {

            return;

        }


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "results"
                )
            );


        let results = [];


        snapshot.forEach(
            docSnap => {

                const result =
                    docSnap.data();


                if (

                    (
                        result.studentName ||

                        result.participantName

                    ) === studentName

                ) {

                    results.push(result);

                }

            }
        );


        // ==================================
        // NO RESULTS
        // ==================================

        if (
            results.length === 0
        ) {

            document.getElementById(
                "completedCount"
            ).innerText = "0";


            document.getElementById(
                "averagePercentage"
            ).innerText = "0%";


            document.getElementById(
                "bestPercentage"
            ).innerText = "0%";


            document.getElementById(
                "passedCount"
            ).innerText = "0";


            document.getElementById(
                "failedCount"
            ).innerText = "0";


            return;

        }


        // ==================================
        // CALCULATE
        // ==================================

        let totalPercentage = 0;

        let bestPercentage = 0;

        let passed = 0;

        let failed = 0;


        results.forEach(
            result => {

                const percentage =
                    Number(
                        result.percentage || 0
                    );


                totalPercentage +=
                    percentage;


                if (
                    percentage >
                    bestPercentage
                ) {

                    bestPercentage =
                        percentage;

                }


                if (
                    percentage >= 35
                ) {

                    passed++;

                }
                else {

                    failed++;

                }

            }
        );


        const averagePercentage =
            totalPercentage /
            results.length;


        // ==================================
        // DISPLAY
        // ==================================

        document.getElementById(
            "completedCount"
        ).innerText =
            results.length;


        document.getElementById(
            "averagePercentage"
        ).innerText =

            averagePercentage
                .toFixed(2) +
            "%";


        document.getElementById(
            "bestPercentage"
        ).innerText =

            bestPercentage
                .toFixed(2) +
            "%";


        document.getElementById(
            "passedCount"
        ).innerText =
            passed;


        document.getElementById(
            "failedCount"
        ).innerText =
            failed;


    }
    catch(error) {

        console.error(
            "Performance Error:",
            error
        );

    }

}
// ======================================
// LOAD COMPLETED EXAMS
// ======================================

async function loadCompletedExams(){

    const completedDiv =
        document.getElementById(
            "completedExamList"
        );

    try{

        const studentName =
            localStorage.getItem(
                "studentName"
            );

        const snapshot =
            await getDocs(
                collection(db,"results")
            );

        let html = "";

        snapshot.forEach(docSnap=>{

            const result =
                docSnap.data();

           if(

    (result.studentName ||
    result.participantName)
    ===
    studentName

){

    html += `

    <div class="completed-card">

        <div class="completed-header">

            <div>

                <h3>
                    ${result.examName || "-"}
                </h3>

                <p class="completed-subject">
                    Subject:
                    <strong>
                        ${result.subject || "-"}
                    </strong>
                </p>

            </div>

            <div class="percentage-badge
                ${
                    Number(result.percentage || 0) >= 35
                        ? "pass-badge"
                        : "fail-badge"
                }">

                ${Number(result.percentage || 0).toFixed(2)}%

            </div>

        </div>

        <div class="completed-info">

            <div class="info-item">

                <span class="info-label">
                    Score
                </span>

                <span class="info-value">
                    ${result.score || 0}
                    /
                    ${result.totalMarks || 0}
                </span>

            </div>

            <div class="info-item">

                <span class="info-label">
                    Correct
                </span>

                <span class="info-value">
                    ${result.correctAnswers || 0}
                </span>

            </div>

            <div class="info-item">

                <span class="info-label">
                    Status
                </span>

                <span class="info-value
                    ${
                        Number(result.percentage || 0) >= 35
                            ? "pass-text"
                            : "fail-text"
                    }">

                    ${
                        Number(result.percentage || 0) >= 35
                            ? "PASS"
                            : "FAIL"
                    }

                </span>

            </div>

        </div>

        <div class="completed-actions">

            <button
                class="result-btn"
                onclick="viewResult('${docSnap.id}')">

                📄 View Result

            </button>

            <button
                class="review-btn"
                onclick="reviewAssessment('${docSnap.id}')">

                🔍 Review

            </button>

        </div>

    </div>

    `;

}

        if(html===""){

            html=`

            <div class="exam-card">

                <h3>

                    No Completed Assessments

                </h3>

            </div>

            `;

        }

        completedDiv.innerHTML =
            html;

    }

    catch(error){

        console.error(error);

        completedDiv.innerHTML =
            "Unable To Load Results";

    }

}

// ======================================
// RESULT
// ======================================

window.viewResult = function(resultId){

    window.location.href =
        "result.html?id=" + resultId;

};

// ======================================
// REVIEW
// ======================================

window.reviewAssessment = function(resultId){

    window.location.href =
        "review/review.html?id=" + resultId;

};

// ======================================
// LOGOUT
// ======================================

window.logout = function(){

    localStorage.clear();

    window.location.href =
        "login.html";

};

// ======================================
// START
// ======================================

loadExams();

loadCompletedExams();

loadPerformanceSummary();
