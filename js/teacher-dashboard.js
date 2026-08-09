import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================
// LOAD TEACHER DETAILS
// ======================

const teacherName =
    localStorage.getItem("teacherName");

const teacherSubject =
    localStorage.getItem("teacherSubject");

const welcomeText =
    document.getElementById("teacherName");

const subjectText =
    document.getElementById("teacherSubject");

if (welcomeText) {
    welcomeText.innerHTML =
        teacherName || "Teacher";
}

if (subjectText) {
    subjectText.innerHTML =
        teacherSubject || "";
}

// ======================
// LOAD ASSESSMENTS
// ======================

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

            const exam = doc.data();

            // TEACHER ASSESSMENTS ONLY

            if (
                exam.targetType === "teacher" &&
                exam.status === "active"
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
                        ${exam.duration}
                        Minutes
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

        if (totalAssessments === 0) {

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
    catch (error) {

        console.error(
            "Assessment Load Error:",
            error
        );

        document.getElementById(
            "assessmentList"
        ).innerHTML =

        "<p>Unable To Load Assessments</p>";
    }
}

// ======================
// START ASSESSMENT
// ======================

window.startAssessment =
function(examId) {

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

// ======================
// COMPLETED ASSESSMENTS
// ======================

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

        let completed = 0;

        snapshot.forEach(doc => {

            const result =
                doc.data();

            if (
                result.teacherName ===
                teacherName
            ) {

                completed++;
            }

        });

        resultCount.innerHTML =
            completed;

    }
    catch(error){

        console.error(
            "Result Load Error:",
            error
        );
    }
}
// ======================
// PENDING EVALUATIONS
// ======================

async function loadPendingEvaluations() {

    const pendingList =
        document.getElementById(
            "pendingEvaluationList"
        );

    if (!pendingList) {
        return;
    }

    try {

        const teacherSubject =
            localStorage.getItem(
                "teacherSubject"
            ) || "";

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "results"
                )
            );

        let html = "";

        let pendingCount = 0;


        snapshot.forEach(docSnap => {

            const result =
                docSnap.data();


            // ==================================
            // ONLY DESCRIPTIVE RESULTS
            // ==================================

            if (
                result.hasDescriptiveQuestions ===
                    true &&

                result.reviewStatus ===
                    "pending"
            ) {


                // ==================================
                // SUBJECT FILTER
                // ==================================

                const resultSubject =
                    String(
                        result.subject || ""
                    )
                    .trim()
                    .toLowerCase();


                const currentSubject =
                    String(
                        teacherSubject
                    )
                    .trim()
                    .toLowerCase();


                if (
                    currentSubject &&
                    resultSubject !==
                    currentSubject
                ) {

                    return;

                }


                pendingCount++;


                html += `

                <div class="assessment-card">

                    <h3>
                        ${result.examName || "Assessment"}
                    </h3>

                    <p>
                        <strong>
                            Student:
                        </strong>

                        ${result.studentName || "-"}
                    </p>

                    <p>
                        <strong>
                            Roll No:
                        </strong>

                        ${result.rollNo || "-"}
                    </p>

                    <p>
                        <strong>
                            Class:
                        </strong>

                        ${result.studentClass || "-"}
                        -
                        ${result.studentSection || ""}
                    </p>

                    <p>
                        <strong>
                            Subject:
                        </strong>

                        ${result.subject || "-"}
                    </p>

                    <p>
                        <strong>
                            Automatic Marks:
                        </strong>

                        ${result.automaticMarks || 0}
                        /
                        ${result.totalMarks || 0}
                    </p>

                    <p>

                        <strong>
                            Status:
                        </strong>

                        <span
                            style="
                                color:#d97706;
                                font-weight:bold;
                            ">

                            Under Teacher Evaluation

                        </span>

                    </p>


                    <button
                        class="start-btn"
                        onclick="
                            reviewStudentAssessment(
                                '${docSnap.id}'
                            )
                        ">

                        Review Student

                    </button>

                </div>

                `;

            }

        });


        // ==================================
        // NO PENDING EVALUATIONS
        // ==================================

        if (
            pendingCount === 0
        ) {

            pendingList.innerHTML = `

                <div class="assessment-card">

                    <h3>
                        No Pending Evaluations
                    </h3>

                    <p>
                        There are no student
                        assessments waiting
                        for evaluation.
                    </p>

                </div>

            `;

            return;

        }


        pendingList.innerHTML =
            html;


    }
    catch (error) {

        console.error(
            "Pending Evaluation Error:",
            error
        );


        pendingList.innerHTML = `

            <div class="assessment-card">

                <h3>
                    Failed To Load
                </h3>

                <p>
                    Unable To Load
                    Pending Evaluations.
                </p>

            </div>

        `;

    }

}


// ======================
// OPEN STUDENT REVIEW
// ======================

window.reviewStudentAssessment =
function(resultId) {

    window.location.href =
        "teacher-review.html?id=" +
        resultId;

};
// ======================
// LOGOUT
// ======================

window.logout = function() {

    localStorage.removeItem(
        "teacherName"
    );

    localStorage.removeItem(
        "teacherSubject"
    );

    localStorage.removeItem(
        "teacherId"
    );

    localStorage.removeItem(
        "participantRole"
    );

    window.location.href =
        "teacher-login.html";
};

// ======================

loadAssessments();

loadTeacherResults();

loadPendingEvaluations();
