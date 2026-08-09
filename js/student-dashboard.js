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

                <div class="exam-card">

                    <h3>

                        ${result.examName || "-"}

                    </h3>

                    <p>

                        Subject :

                        ${result.subject || "-"}

                    </p>

                    <p>

                        Score :

                        ${result.score}/${result.totalMarks}

                    </p>

                    <p>

                        Percentage :

                        ${result.percentage}%

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
