import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc
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
        "teacher-dashboard.html";

}


// ======================================
// GLOBAL DATA
// ======================================

let result = {};


// ======================================
// LOAD REVIEW
// ======================================

async function loadReview() {

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


        result =
            resultSnap.data();


        console.log(
            "Review Result:",
            result
        );


        // ==================================
        // STUDENT DETAILS
        // ==================================

        document.getElementById(
            "studentName"
        ).innerText =

            result.studentName ||
            "-";


        document.getElementById(
            "rollNo"
        ).innerText =

            result.rollNo ||
            "-";


        document.getElementById(
            "studentClass"
        ).innerText =

            result.studentClass ||
            "-";


        document.getElementById(
            "studentSection"
        ).innerText =

            result.studentSection ||
            result.section ||
            "-";


        // ==================================
        // EXAM DETAILS
        // ==================================

        document.getElementById(
            "examName"
        ).innerText =

            result.examName ||
            "Assessment";


        document.getElementById(
            "subject"
        ).innerText =

            result.subject ||
            "-";


        document.getElementById(
            "totalMarks"
        ).innerText =

            result.totalMarks ||
            0;


        // ==================================
        // AUTOMATIC MARKS
        // ==================================

        const automaticMarks =
            Number(
                result.automaticMarks || 0
            );


        document.getElementById(
            "automaticMarks"
        ).innerText =
            automaticMarks;


        // ==================================
        // QUESTIONS
        // ==================================

        const questionList =
            document.getElementById(
                "questionList"
            );


        const review =
            result.review || [];


        const subjectiveAnswers =
            result.subjectiveAnswers || [];


        let html = "";


        // ==================================
        // BUILD QUESTIONS
        // ==================================

        review.forEach(
            (question, index) => {

                const isDescriptive =
                    question.questionType ===
                    "sentence";


                const subjective =
                    subjectiveAnswers.find(
                        item =>
                            item.questionId ===
                            question.questionId
                    );


                const studentAnswer =
                    question.selectedAnswer ||
                    "";


                const maximumMarks =
                    Number(
                        question.totalMarks ||
                        question.marks ||
                        0
                    );


                // ==================================
                // DESCRIPTIVE
                // ==================================

                if (isDescriptive) {

                    const existingMarks =
                        subjective &&
                        subjective.teacherMarks !== null
                            ? subjective.teacherMarks
                            : "";


                    const existingRemark =
                        subjective &&
                        subjective.teacherRemark
                            ? subjective.teacherRemark
                            : "";


                    html += `

                    <div
                        class="question-card"
                        data-question-id="${question.questionId}"
                    >

                        <span
                            class="question-type">

                            DESCRIPTIVE
                            • TEACHER EVALUATION

                        </span>


                        <h3>

                            Q${index + 1}.
                            ${question.question || ""}

                        </h3>


                        <p>
                            <strong>
                                Maximum Marks:
                            </strong>

                            ${maximumMarks}

                        </p>


                        <div
                            class="answer-box student-answer">

                            <strong>
                                Student Answer:
                            </strong>

                            <br><br>

                            ${
                                studentAnswer ||
                                "No answer provided."
                            }

                        </div>


                        <div
                            class="marking-area">

                            <label>

                                Teacher Marks
                                (0 - ${maximumMarks})

                            </label>


                            <input
                                type="number"
                                class="marks-input"
                                id="marks_${question.questionId}"
                                min="0"
                                max="${maximumMarks}"
                                step="0.5"
                                value="${existingMarks}"
                            >


                            <br><br>


                            <label>

                                Teacher Remark

                            </label>


                            <textarea
                                class="remark-input"
                                id="remark_${question.questionId}"
                                placeholder="Enter teacher remark..."
                            >${existingRemark}</textarea>

                        </div>

                    </div>

                    `;

                }


                // ==================================
                // AUTOMATIC
                // ==================================

                else {

                    const marks =
                        Number(
                            question.marks || 0
                        );


                    const total =
                        Number(
                            question.totalMarks || 0
                        );


                    html += `

                    <div
                        class="question-card">

                        <span
                            class="question-type">

                            AUTOMATICALLY EVALUATED

                        </span>


                        <h3>

                            Q${index + 1}.
                            ${question.question || ""}

                        </h3>


                        <div
                            class="answer-box student-answer">

                            <strong>
                                Student Answer:
                            </strong>

                            <br><br>

                            ${
                                studentAnswer ||
                                "Not Answered"
                            }

                        </div>


                        <div
                            class="answer-box correct-answer">

                            <strong>
                                Correct Answer:
                            </strong>

                            <br><br>

                            ${
                                question.correctAnswer ||
                                "Not Available"
                            }

                        </div>


                        <p>

                            <strong>
                                Marks:
                            </strong>

                            ${marks}
                            /
                            ${total}

                        </p>

                    </div>

                    `;

                }

            }
        );


        if (html === "") {

            html = `

                <div class="question-card">

                    <h3>
                        No questions available.
                    </h3>

                </div>

            `;

        }


        questionList.innerHTML =
            html;


        calculatePreview();


    }
    catch (error) {

        console.error(
            "Teacher Review Error:",
            error
        );


        alert(
            "Unable to load assessment.\n\n" +
            error.message
        );

    }

}


// ======================================
// CALCULATE PREVIEW
// ======================================

function calculatePreview() {

    const automaticMarks =
        Number(
            result.automaticMarks || 0
        );


    let teacherMarks = 0;


    const subjectiveAnswers =
        result.subjectiveAnswers || [];


    subjectiveAnswers.forEach(
        item => {

            const input =
                document.getElementById(
                    `marks_${item.questionId}`
                );


            if (input) {

                const value =
                    Number(
                        input.value
                    );


                if (
                    !isNaN(value)
                ) {

                    teacherMarks +=
                        value;

                }

            }

        }
    );


    const finalMarks =
        automaticMarks +
        teacherMarks;


    const totalMarks =
        Number(
            result.totalMarks || 0
        );


    const percentage =
        totalMarks > 0
            ? (
                finalMarks /
                totalMarks
            ) * 100
            : 0;


    document.getElementById(
        "teacherMarks"
    ).innerText =
        teacherMarks;


    document.getElementById(
        "finalMarks"
    ).innerText =
        finalMarks;


    document.getElementById(
        "percentage"
    ).innerText =
        percentage.toFixed(2) +
        "%";

}


// ======================================
// SAVE / PUBLISH
// ======================================

document
    .getElementById(
        "publishBtn"
    )
    .addEventListener(
        "click",
        async function () {

            try {

                const subjectiveAnswers =
                    result.subjectiveAnswers ||
                    [];


                let teacherMarksTotal =
                    0;


                const updatedSubjective =
                    [];


                // ==================================
                // VALIDATE & COLLECT MARKS
                // ==================================

                for (
                    const item
                    of subjectiveAnswers
                ) {

                    const marksInput =
                        document.getElementById(
                            `marks_${item.questionId}`
                        );


                    const remarkInput =
                        document.getElementById(
                            `remark_${item.questionId}`
                        );


                    const marks =
                        Number(
                            marksInput.value
                        );


                    const maxMarks =
                        Number(
                            item.maxMarks || 0
                        );


                    if (
                        isNaN(marks) ||
                        marks < 0 ||
                        marks > maxMarks
                    ) {

                        alert(
                            "Please enter valid marks for all descriptive questions."
                        );

                        marksInput.focus();

                        return;

                    }


                    teacherMarksTotal +=
                        marks;


                    updatedSubjective.push({

                        ...item,

                        teacherMarks:
                            marks,

                        teacherRemark:
                            remarkInput.value.trim(),

                        evaluationStatus:
                            "completed"

                    });

                }


                // ==================================
                // FINAL SCORE
                // ==================================

                const automaticMarks =
                    Number(
                        result.automaticMarks || 0
                    );


                const totalMarks =
                    Number(
                        result.totalMarks || 0
                    );


                const finalMarks =
                    automaticMarks +
                    teacherMarksTotal;


                const percentage =
                    totalMarks > 0
                        ? (
                            finalMarks /
                            totalMarks
                        ) * 100
                        : 0;


                // ==================================
                // TEACHER
                // ==================================

                const teacherName =
                    localStorage.getItem(
                        "teacherName"
                    ) || "Teacher";


                // ==================================
                // UPDATE RESULT
                // ==================================

                const resultRef =
                    doc(
                        db,
                        "results",
                        resultId
                    );


                await updateDoc(
                    resultRef,
                    {

                        subjectiveAnswers:
                            updatedSubjective,

                        descriptiveMarks:
                            teacherMarksTotal,

                        score:
                            finalMarks,

                        percentage:
                            Number(
                                percentage.toFixed(2)
                            ),

                        reviewStatus:
                            "completed",

                        resultPublished:
                            true,

                        reviewedBy:
                            teacherName,

                        reviewedAt:
                            new Date()
                                .toISOString()

                    }
                );


                alert(
                    "Evaluation completed successfully.\n\n" +

                    "Final Marks: " +
                    finalMarks +
                    "/" +
                    totalMarks +

                    "\nPercentage: " +
                    percentage.toFixed(2) +
                    "%"
                );


                window.location.href =
                    "teacher-dashboard.html";

            }
            catch (error) {

                console.error(
                    "PUBLISH ERROR:",
                    error
                );


                alert(
                    "Failed to publish result.\n\n" +
                    error.message
                );

            }

        }
    );


// ======================================
// LIVE MARK PREVIEW
// ======================================

document.addEventListener(
    "input",
    function (event) {

        if (
            event.target.classList.contains(
                "marks-input"
            )
        ) {

            calculatePreview();

        }

    }
);


// ======================================
// START
// ======================================

loadReview();
