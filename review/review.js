import { db } from "../js/firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const resultId = params.get("id");

function cleanOptionText(value){
    return String(value ?? "")
        .trim()
        .replace(/^\s*[A-Da-d]\s*[.)]\s*/, "");
}

function normalizeAnswer(value, options){

    const raw = String(value ?? "").trim();

    if(!raw){
        return "";
    }

    const keyMatch = raw.match(/^([A-Da-d])(?:[.)]|\s|$)/);
    if(keyMatch){
        return keyMatch[1].toUpperCase();
    }

    const cleaned = cleanOptionText(raw).toLowerCase();

    const found = options.find(option =>
        cleanOptionText(option.text).toLowerCase() === cleaned
    );

    return found ? found.key : raw.toUpperCase();
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

        const review = Array.isArray(result.review) ? result.review : [];

        if(review.length === 0){
            document.getElementById("score").innerText = (result.score || 0) + "/" + (result.totalMarks || 0);
            document.getElementById("percentage").innerText = Number(result.percentage || 0).toFixed(2) + "%";
            document.getElementById("correct").innerText = result.correctAnswers || 0;
            document.getElementById("wrong").innerText = Math.max(0, Number(result.totalQuestions || 0) - Number(result.correctAnswers || 0));

            container.innerHTML = `
                <div class="question-card">
                    <h3>📋 Detailed Review Not Available</h3>
                    <p>This assessment was completed before detailed answer review was enabled.</p>
                    <p>Your result has been saved successfully, but the answers selected during the assessment were not stored.</p>
                </div>
            `;
            return;
        }

        let calculatedScore = 0;
        let calculatedCorrect = 0;
        let calculatedTotalMarks = 0;
        let hasPending = false;
        let html = "";

        review.forEach((q,index) => {

            const options = [
                { key:"A", text:cleanOptionText(q.optionA) },
                { key:"B", text:cleanOptionText(q.optionB) },
                { key:"C", text:cleanOptionText(q.optionC) },
                { key:"D", text:cleanOptionText(q.optionD) }
            ];

            const selectedKey = normalizeAnswer(q.selectedAnswer, options);
            const correctKey = normalizeAnswer(q.correctAnswer, options);
            const maxMarks = Number(q.totalMarks ?? q.maxMarks ?? 0);
            const storedMarks = Number(q.marks || 0);
            const isDescriptive = q.questionType === "sentence" || q.evaluationStatus === "pending";

            let isCorrect = false;

            if(isDescriptive){
                hasPending = true;
            } else {
                // Determine correctness from the actual stored answers rather than
                // trusting a stale/inconsistent isCorrect flag in older results.
                isCorrect = !!selectedKey && !!correctKey && selectedKey === correctKey;
                calculatedTotalMarks += maxMarks;

                if(isCorrect){
                    calculatedCorrect++;
                    calculatedScore += maxMarks;
                }
            }

            let optionsHTML = "";

            options.forEach(option => {

                if(!option.text){
                    return;
                }

                let classes = "option";

                if(option.key === correctKey){
                    classes += " correct";
                }

                if(option.key === selectedKey && option.key !== correctKey){
                    classes += " wrong";
                }

                if(option.key === selectedKey){
                    classes += " selected";
                }

                let marker = "";

                if(option.key === selectedKey){
                    marker += " Your Answer";
                }

                if(option.key === correctKey && !isDescriptive){
                    marker += " ✓ Correct Answer";
                }

                optionsHTML += `
                    <div class="${classes}"
                         style="display:block !important;width:100% !important;height:auto !important;min-height:0 !important;max-height:none !important;padding:8px 12px !important;margin:5px 0 !important;line-height:1.3 !important;font-size:15px !important;box-sizing:border-box !important;overflow:visible !important;">
                        <span class="option-label">${option.key}.</span>
                        <span class="option-content">${option.text}</span>
                        <small>${marker}</small>
                    </div>
                `;
            });

            const displayMarks = isDescriptive ? storedMarks : (isCorrect ? maxMarks : 0);
            const statusClass = isDescriptive ? "pending" : (isCorrect ? "correct" : "wrong");
            const statusText = isDescriptive
                ? "🟠 Under Teacher Evaluation"
                : (isCorrect ? "✓ Correct Answer" : "✗ Incorrect Answer");

            html += `
                <div class="question-card">
                    <div class="question-number">Question ${index + 1}</div>
                    <div class="question-text">${q.question || ""}</div>
                    ${optionsHTML}
                    <div class="answer-status ${statusClass}">${statusText}</div>
                    <div class="marks">
                        Marks: ${displayMarks} / ${maxMarks}
                    </div>
                    <div class="explanation">
                        <strong>Explanation</strong>
                        ${q.explanation || "Not Available"}
                    </div>
                </div>
            `;
        });

        // For automatic-only assessments, use the detailed review as the source
        // of truth. This fixes older result documents where summary counts were stale.
        if(!hasPending){
            const percentage = calculatedTotalMarks > 0
                ? (calculatedScore / calculatedTotalMarks) * 100
                : 0;

            document.getElementById("score").innerText = calculatedScore + "/" + calculatedTotalMarks;
            document.getElementById("percentage").innerText = percentage.toFixed(2) + "%";
            document.getElementById("correct").innerText = calculatedCorrect;
            document.getElementById("wrong").innerText = Math.max(0, review.filter(q => q.questionType !== "sentence").length - calculatedCorrect);
        } else {
            document.getElementById("score").innerText = (result.score || 0) + "/" + (result.totalMarks || 0);
            document.getElementById("percentage").innerText = "Pending";
            document.getElementById("correct").innerText = result.correctAnswers || 0;
            document.getElementById("wrong").innerText = "Pending";
        }

        container.innerHTML = html;

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
