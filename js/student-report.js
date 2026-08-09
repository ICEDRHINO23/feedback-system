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

const params =
    new URLSearchParams(
        window.location.search
    );

const resultId =
    params.get("id");


if (!resultId) {

    alert("Result ID not found");

    window.location.href =
        "results.html";

}


// ======================================
// LOAD REPORT
// ======================================

async function loadReport() {

    try {

        console.log(
            "Result ID:",
            resultId
        );


        // ==================================
        // LOAD RESULT
        // ==================================

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
                "Result Not Found"
            );

            return;

        }


        const result =
            resultSnap.data();


        console.log(
            "Result Data:",
            result
        );


        // ==================================
        // LOAD EXAM
        // ==================================

        let exam = {};


        if (result.examId) {

            const examRef =
                doc(
                    db,
                    "exams",
                    result.examId
                );


            const examSnap =
                await getDoc(
                    examRef
                );


            if (examSnap.exists()) {

                exam =
                    examSnap.data();

            }

        }


        console.log(
            "Exam Data:",
            exam
        );


       // ==================================
// STUDENT DETAILS
// ==================================

const studentName =
    result.studentName ||
    result.participantName ||
    "-";


const studentClass =
    result.studentClass ||
    result.examClass ||
    exam.examClass ||
    "-";


const studentSection =
    result.section ||
    result.studentSection ||
    "-";


// ----------------------------------
// FIND ROLL NUMBER
// ----------------------------------

let studentRollNo =
    result.rollNo || "";


if (!studentRollNo) {

    const studentsSnapshot =
        await getDocs(
            collection(
                db,
                "students"
            )
        );


    const targetName =
        String(studentName)
            .trim()
            .toLowerCase();


    const targetClass =
        String(studentClass)
            .trim();


    const targetSection =
        String(studentSection)
            .trim()
            .toLowerCase();


    studentsSnapshot.forEach(
        studentDoc => {

            const student =
                studentDoc.data();


            const dbName =
                String(
                    student.name || ""
                )
                .trim()
                .toLowerCase();


            const dbClass =
                String(
                    student.class || ""
                )
                .trim();


            const dbSection =
                String(
                    student.section || ""
                )
                .trim()
                .toLowerCase();


            if (
                dbName === targetName &&
                dbClass === targetClass &&
                dbSection === targetSection
            ) {

                studentRollNo =
                    student.rollNo || "";

            }

        }
    );

}


// ----------------------------------
// DISPLAY STUDENT DETAILS
// ----------------------------------

document.getElementById(
    "studentName"
).innerText =
    studentName;


document.getElementById(
    "rollNo"
).innerText =
    studentRollNo || "-";


document.getElementById(
    "studentClass"
).innerText =
    studentClass;


document.getElementById(
    "section"
).innerText =
    studentSection;


        // ==================================
        // EXAM DETAILS
        // ==================================

        document.getElementById(
            "examName"
        ).innerText =

            exam.examName ||
            result.examName ||
            "-";


        document.getElementById(
            "subject"
        ).innerText =

            exam.subject ||
            result.subject ||
            "-";


        document.getElementById(
            "submittedDate"
        ).innerText =

            result.submittedAt
                ? new Date(
                    result.submittedAt
                ).toLocaleString()
                : "-";


        // ==================================
        // SCORE
        // ==================================

        const score =
            Number(
                result.score || 0
            );


        const totalMarks =
            Number(
                result.totalMarks || 0
            );


        const percentage =
            Number(
                result.percentage || 0
            );


        document.getElementById(
            "score"
        ).innerText =
            score;


        document.getElementById(
            "totalMarks"
        ).innerText =
            totalMarks;


        document.getElementById(
            "percentage"
        ).innerText =

            percentage.toFixed(2) +
            "%";


        document.getElementById(
            "summaryPercentage"
        ).innerText =

            percentage.toFixed(2) +
            "%";


        // ==================================
        // PASS / FAIL
        // ==================================

        const status =
            percentage >= 35
                ? "PASS"
                : "FAIL";


        document.getElementById(
            "status"
        ).innerText =
            status;


        document.getElementById(
            "resultStatus"
        ).innerText =
            status;


        // ==================================
        // QUESTIONS
        // ==================================

        const totalQuestions =
            Number(
                result.totalQuestions ||
                totalMarks
            );


        const correctAnswers =
            Number(
                result.correctAnswers ||
                score
            );


        const wrongAnswers =
            Math.max(
                0,
                totalQuestions -
                correctAnswers
            );


        document.getElementById(
            "totalQuestions"
        ).innerText =
            totalQuestions;


        document.getElementById(
            "correctAnswers"
        ).innerText =
            correctAnswers;


        document.getElementById(
            "wrongAnswers"
        ).innerText =
            wrongAnswers;


        // ==================================
        // RANK CALCULATION
        // ==================================

        if (result.examId) {

            const resultsSnapshot =
                await getDocs(
                    collection(
                        db,
                        "results"
                    )
                );


            let resultList = [];


            resultsSnapshot.forEach(
                docSnap => {

                    const r =
                        docSnap.data();


                    if (
                        (r.examId || "") ===
                        (result.examId || "")
                    ) {

                        resultList.push({
                            id: docSnap.id,
                            ...r
                        });

                    }

                }
            );


            // Sort highest percentage first

            resultList.sort(
                (a, b) =>

                    Number(
                        b.percentage || 0
                    ) -

                    Number(
                        a.percentage || 0
                    )
            );


            // ==================================
            // FIND CURRENT RESULT
            // ==================================

            const rank =
                resultList.findIndex(
                    r =>
                        r.id === resultId
                ) + 1;


            document.getElementById(
                "rank"
            ).innerText =

                rank > 0
                    ? rank
                    : "-";

        }
        else {

            document.getElementById(
                "rank"
            ).innerText =
                "-";

        }


        console.log(
            "Report Loaded Successfully"
        );

    }
    catch (error) {

        console.error(
            "REPORT ERROR:",
            error
        );


        alert(
            "Unable To Load Report\n\n" +
            error.message
        );

    }

}


// ======================================
// START
// ======================================

loadReport();
