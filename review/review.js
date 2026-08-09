import { db } from "../js/firebase-config.js";

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


// ======================================
// LOAD REVIEW
// ======================================

async function loadReview(){

    const container =
        document.getElementById(
            "reviewContainer"
        );


    if(!resultId){

        container.innerHTML = `
            <div class="question-card">
                Result ID not found.
            </div>
        `;

        return;

    }


    try{

        console.log(
            "Review Result ID:",
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


        if(!resultSnap.exists()){

            container.innerHTML = `
                <div class="question-card">
                    Result not found.
                </div>
            `;

            return;

        }


        const result =
            resultSnap.data();


        console.log(
            "Review Result:",
            result
        );


        // ==================================
        // SUMMARY
        // ==================================

        document.getElementById(
            "examName"
        ).innerText =
            result.examName ||
            "Assessment";


        document.getElementById(
            "subject"
        ).innerText =
            "Subject: " +
            (
                result.subject ||
                "-"
            );


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


        const correct =
            Number(
                result.correctAnswers || 0
            );


        const totalQuestions =
            Number(
                result.totalQuestions || 0
            );


        const wrong =
            totalQuestions -
            correct;


        document.getElementById(
            "score"
        ).innerText =
            score +
            "/" +
            totalMarks;


        document.getElementById(
            "percentage"
        ).innerText =
            percentage.toFixed(2) +
            "%";


        document.getElementById(
            "correct"
        ).innerText =
            correct;


        document.getElementById(
            "wrong"
        ).innerText =
            wrong;


        // ==================================
        // REVIEW ARRAY
        // ==================================

        const review =
            Array.isArray(
                result.review
            )
            ? result.review
            : [];


        if(review.length === 0){

            container.innerHTML = `
                <div class="question-card">

                    <h3>
                        Review Not Available
                    </h3>

                    <p>
                        No question review data
                        was saved for this assessment.
                    </p>

                </div>
            `;

            return;

        }


        // ==================================
        // BUILD REVIEW
        // ==================================

        let html = "";


        review.forEach(
            (q,index) => {

                const selected =
                    q.selectedAnswer || "";


                const correctAnswer =
                    q.correctAnswer || "";


                const isCorrect =
                    q.isCorrect === true;


                let optionsHTML = "";


                const options = [

                    {
                        key:"A",
                        text:q.optionA || ""
                    },

                    {
                        key:"B",
                        text:q.optionB || ""
                    },

                    {
                        key:"C",
                        text:q.optionC || ""
                    },

                    {
                        key:"D",
                        text:q.optionD || ""
                    }

                ];


                options.forEach(
                    option => {

                        let classes =
                            "option";


                        if(
                            option.key ===
                            correctAnswer
                        ){

                            classes +=
                                " correct";

                        }


                        if(
                            option.key ===
                            selected &&
                            option.key !==
                            correctAnswer
                        ){

                            classes +=
                                " wrong";

                        }


                        if(
                            option.key ===
                            selected
                        ){

                            classes +=
                                " selected";

                        }


                        let marker = "";


                        if(
                            option.key ===
                            selected
                        ){

                            marker +=
                                " Your Answer";

                        }


                        if(
                            option.key ===
                            correctAnswer
                        ){

                            marker +=
                                " ✓ Correct Answer";

                        }


                        optionsHTML += `

                            <div
                                class="${classes}"
                            >

                                <span
                                    class="option-label"
                                >

                                    ${option.key}.

                                </span>

                                ${option.text}

                                <small>

                                    ${marker}

                                </small>

                            </div>

                        `;

                    }
                );


                const statusClass =
                    isCorrect
                    ? "correct"
                    : "wrong";


                const statusText =
                    isCorrect
                    ? "✓ Correct Answer"
                    : "✗ Incorrect Answer";


                html += `

                    <div
                        class="question-card"
                    >

                        <div
                            class="question-number"
                        >

                            Question ${index + 1}

                        </div>


                        <div
                            class="question-text"
                        >

                            ${q.question || ""}

                        </div>


                        ${optionsHTML}


                        <div
                            class="answer-status ${statusClass}"
                        >

                            ${statusText}

                        </div>


                        <div class="marks">

                            Marks:
                            ${q.marks || 0}
                            /
                            ${q.totalMarks || 0}

                        </div>


                        <div
                            class="explanation"
                        >

                            <strong>
                                Explanation
                            </strong>

                            ${
                                q.explanation ||
                                "Not Available"
                            }

                        </div>

                    </div>

                `;

            }
        );


        container.innerHTML =
            html;


    }
    catch(error){

        console.error(
            "Review Loading Error:",
            error
        );


        container.innerHTML = `

            <div class="question-card">

                <h3>
                    Unable to Load Review
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}


// ======================================
// START
// ======================================

loadReview();
