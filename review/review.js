import { db } from "../js/firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================================
// GET RESULT ID
// =======================================

const params =
    new URLSearchParams(window.location.search);

const resultId =
    params.get("id");

if (!resultId) {

    alert("Review not found");

    window.location.href =
        "../dashboard.html";

}

// =======================================
// LOAD REVIEW
// =======================================

async function loadReview() {

    try {

        const resultRef =
            doc(db, "results", resultId);

        const resultSnap =
            await getDoc(resultRef);

        if (!resultSnap.exists()) {

            alert("Result not found");

            return;

        }

        const result =
            resultSnap.data();

        document.getElementById("studentName").innerText =
            result.studentName || "-";

        document.getElementById("examName").innerText =
            result.examName || "-";

        document.getElementById("subject").innerText =
            result.subject || "-";

        document.getElementById("score").innerText =
            result.score + " / " + result.totalMarks;

        document.getElementById("percentage").innerText =
            result.percentage + "%";

        const reviewDiv =
            document.getElementById("reviewContainer");

        reviewDiv.innerHTML = "";

        // Questions
        if (
            result.review &&
            result.review.length > 0
        ) {

            result.review.forEach((q,index)=>{

                reviewDiv.innerHTML += `

                <div class="question-card">

                    <h3>

                        Question ${index+1}

                    </h3>

                    <p>

                        ${q.question}

                    </p>

                    <p>

                        <b>Your Answer :</b>

                        ${q.selectedAnswer}

                    </p>

                    <p>

                        <b>Correct Answer :</b>

                        ${q.correctAnswer}

                    </p>

                    <p>

                        <b>Marks :</b>

                        ${q.marks}

                    </p>

                    <p>

                        <b>Explanation :</b>

                        ${q.explanation || "Not Available"}

                    </p>

                </div>

                `;

            });

        }
        else{

            reviewDiv.innerHTML =
            "<h3>No review data available.</h3>";

        }

    }

    catch(error){

        console.error(error);

        alert("Unable to load review.");

    }

}

loadReview();
