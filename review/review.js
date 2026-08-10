import { db } from "../js/firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const resultId = params.get("id");

function cleanOptionText(value){
    let text = String(value ?? "").trim();
    text = text.replace(/^\s*[A-Da-d]\s*[.)]\s*/, "");
    return text;
}

async function loadReview(){

    const container = document.getElementById("reviewContainer");

    if(!resultId){
        container.innerHTML = `<div class="question-card">Result ID not found.</div>`;
        return;
    }

    try{
        const resultRef = doc(db, "results", resultId);
        const resultSnap = await getDoc(resultRef);

        if(!resultSnap.exists()){
            container.innerHTML = `<div class="question-card">Result not found.</div>`;
            return;
        }

        const result = resultSnap.data();

        document.getElementById("examName").innerText = result.examName || "Assessment";
        document.getElementById("subject").innerText = "Subject: " + (result.subject || "-");

        const score = Number(result.score || 0);
        const totalMarks = Number(result.totalMarks || 0);
        const percentage = Number(result.percentage || 0);
        const correct = Number(result.correctAnswers || 0);
        const totalQuestions = Number(result.totalQuestions || 0);
        const wrong = totalQuestions - correct;

        document.getElementById("score").innerText = score + "/" + totalMarks;
        document.getElementById("percentage").innerText = percentage.toFixed(2) + "%";
        document.getElementById("correct").innerText = correct;
        document.getElementById("wrong").innerText = wrong;

        const review = Array.isArray(result.review) ? result.review : [];

        if(review.length === 0){
            container.innerHTML = `
                <div class="question-card">
                    <h3>📋 Detailed Review Not Available</h3>
                    <p>This assessment was completed before detailed answer review was enabled.</p>
                    <p>Your result has been saved successfully, but the answers selected during the assessment were not stored.</p>
                </div>
            `;
            return;
        }

        let html = "";

        review.forEach((q,index) => {

            const selected = q.selectedAnswer || "";
            const correctAnswer = q.correctAnswer || "";
            const isCorrect = q.isCorrect === true;

            let optionsHTML = "";

            const options = [
                { key:"A", text:cleanOptionText(q.optionA) },
                { key:"B", text:cleanOptionText(q.optionB) },
                { key:"C", text:cleanOptionText(q.optionC) },
                { key:"D", text:cleanOptionText(q.optionD) }
            ];

            options.forEach(option => {

                let classes = "option";

                if(option.key === correctAnswer) classes += " correct";
                if(option.key === selected && option.key !== correctAnswer) classes += " wrong";
                if(option.key === selected) classes += " selected";

                let marker = "";
                if(option.key === selected) marker += " Your Answer";
                if(option.key === correctAnswer) marker += " ✓ Correct Answer";

                /*
                 * The inline !important rules are intentional here.
                 * They guarantee compact review options even if an older
                 * cached stylesheet or another rule sets a fixed height.
                 */
                optionsHTML += `
                    <div class="${classes}"
                         style="display:block !important;width:100% !important;height:auto !important;min-height:0 !important;max-height:none !important;padding:8px 12px !important;margin:5px 0 !important;line-height:1.3 !important;font-size:15px !important;box-sizing:border-box !important;overflow:visible !important;">
                        <span class="option-label">${option.key}.</span>
                        <span class="option-content">${option.text}</span>
                        <small>${marker}</small>
                    </div>
                `;
            });

            const statusClass = isCorrect ? "correct" : "wrong";
            const statusText = isCorrect ? "✓ Correct Answer" : "✗ Incorrect Answer";

            html += `
                <div class="question-card">
                    <div class="question-number">Question ${index + 1}</div>
                    <div class="question-text">${q.question || ""}</div>
                    ${optionsHTML}
                    <div class="answer-status ${statusClass}">${statusText}</div>
                    <div class="marks">
                        Marks: ${q.marks || 0} / ${q.totalMarks || 0}
                    </div>
                    <div class="explanation">
                        <strong>Explanation</strong>
                        ${q.explanation || "Not Available"}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Final enforcement after dynamic HTML insertion.
        container.querySelectorAll(".option").forEach(option => {
            option.style.setProperty("height", "auto", "important");
            option.style.setProperty("min-height", "0", "important");
            option.style.setProperty("max-height", "none", "important");
            option.style.setProperty("padding", "8px 12px", "important");
            option.style.setProperty("margin", "5px 0", "important");
            option.style.setProperty("display", "block", "important");
            option.style.setProperty("box-sizing", "border-box", "important");
        });

    }
    catch(error){
        console.error("Review Loading Error:", error);
        container.innerHTML = `
            <div class="question-card">
                <h3>Unable to Load Review</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

loadReview();
