import { db } from "./supabase-config.js";

import {
    doc,
    getDoc,
    updateDoc
} from "./supabase-firestore.js";


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
// SAVE / PUBLISH RESULT
// ======================================

document
    .getElementById("publishBtn")
    .addEventListener(
        "click",
        async function () {

            try {

                // ==================================
                // VERIFY RESULT
                // ==================================

                if (!result || !resultId) {

                    alert(
                        "Result information not available."
                    );

                    return;

                }


                // ==================================
                // VERIFY TEACHER
                // ==================================

                const teacherName =
                    localStorage.getItem(
                        "teacherName"
                    ) || "";

                const teacherSubject =
                    localStorage.getItem(
                        "teacherSubject"
                    ) || "";


                if (!teacherName) {

                    alert(
                        "Teacher session not found.\n\nPlease login again."
                    );

                    window.location.href =
                        "teacher-login.html";

                    return;

                }


                // ==================================
                // VERIFY SUBJECT
                // ==================================

                const resultSubject =
                    String(
                        result.subject || ""
                    )
                    .trim()
                    .toLowerCase();

                const currentSubject =
                    String(
                        teacherSubject || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    currentSubject &&
                    resultSubject !==
                    currentSubject
                ) {

                    alert(
                        "You are not authorized to evaluate this assessment."
                    );

                    return;

                }


                // ==================================
                // DESCRIPTIVE ANSWERS
                // ==================================

                const subjectiveAnswers =
                    result.subjectiveAnswers || [];


                if (
                    subjectiveAnswers.length === 0
                ) {

                    alert(
                        "No descriptive questions found."
                    );

                    return;

                }


                let teacherMarksTotal =
                    0;

                const updatedSubjective =
                    [];


                // ==================================
                // VALIDATE EVERY QUESTION
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


                    if (!marksInput) {

                        alert(
                            "A descriptive question is missing from the review page."
                        );

                        return;

                    }


                    const rawMarks =
                        marksInput.value.trim();


                    // ==================================
                    // MARKS REQUIRED
                    // ==================================

                    if (
                        rawMarks === ""
                    ) {

                        alert(
                            "Please enter marks for every descriptive question before publishing."
                        );

                        marksInput.focus();

                        return;

                    }


                    const marks =
                        Number(
                            rawMarks
                        );


                    const maxMarks =
                        Number(
                            item.maxMarks || 0
                        );


                    // ==================================
                    // VALIDATE MARKS
                    // ==================================

                    if (
                        !Number.isFinite(
                            marks
                        )
                    ) {

                        alert(
                            "Please enter valid marks."
                        );

                        marksInput.focus();

                        return;

                    }


                    if (
                        marks < 0 ||
                        marks > maxMarks
                    ) {

                        alert(
                            "Marks for a question must be between 0 and " +
                            maxMarks +
                            "."
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
                            remarkInput
                                ? remarkInput.value.trim()
                                : "",

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
                // CONFIRM PUBLISH
                // ==================================

                const confirmed =
                    confirm(

                        "Publish this result?\n\n" +

                        "Student: " +
                        (
                            result.studentName ||
                            "-"
                        ) +

                        "\n\nFinal Marks: " +
                        finalMarks +
                        "/" +
                        totalMarks +

                        "\nPercentage: " +
                        percentage.toFixed(2) +
                        "%"

                    );


                if (!confirmed) {
                    return;
                }


                // ==================================
                // UPDATE FIRESTORE
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


                // ==================================
                // SUCCESS
                // ==================================

                alert(

                    "Evaluation completed successfully!\n\n" +

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
