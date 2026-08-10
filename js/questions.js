import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examSelect =
    document.getElementById("examSelect");

// ============================
// LOAD ASSESSMENTS
// ============================

async function loadExams() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examSelect.innerHTML =
            '<option value="">Select Assessment</option>';

        snapshot.forEach(examDoc => {

            const exam = examDoc.data();

            examSelect.innerHTML += `
                <option value="${examDoc.id}">
                    ${exam.examName || "Unnamed Assessment"}
                </option>
            `;

        });

    }
    catch(error){

        console.error("Assessment Load Error:", error);

        examSelect.innerHTML =
            '<option value="">Unable to load assessments</option>';
    }
}

// ============================
// CREATE QUESTION ONLY
// ============================

window.saveQuestion =
async function () {

    try {

        const examId =
            document.getElementById("examSelect").value;

        const questionType =
            document.getElementById("questionType").value;

        const question =
            document.getElementById("question").value.trim();

        const marksValue =
            document.getElementById("marks").value;

        if (!examId || !question || !marksValue) {

            alert("Please fill all required fields");
            return;
        }

        const marks = Number(marksValue);

        if (!Number.isFinite(marks) || marks < 0) {

            alert("Please enter valid marks");
            return;
        }

        const data = {
            examId,
            questionType,
            question,
            marks
        };

        // ====================
        // SINGLE MCQ
        // ====================

        if (questionType === "mcq") {

            data.optionA =
                document.getElementById("optionA").value.trim();

            data.optionB =
                document.getElementById("optionB").value.trim();

            data.optionC =
                document.getElementById("optionC").value.trim();

            data.optionD =
                document.getElementById("optionD").value.trim();

            data.answer =
                document.getElementById("answer").value;

            if (
                !data.optionA ||
                !data.optionB ||
                !data.optionC ||
                !data.optionD
            ) {

                alert("Please enter all four options");
                return;
            }

            if (!data.answer) {

                alert("Select Correct Answer");
                return;
            }
        }

        // ====================
        // MULTIPLE ANSWERS
        // ====================

        if (questionType === "multiple") {

            data.optionA =
                document.getElementById("optionA").value.trim();

            data.optionB =
                document.getElementById("optionB").value.trim();

            data.optionC =
                document.getElementById("optionC").value.trim();

            data.optionD =
                document.getElementById("optionD").value.trim();

            if (
                !data.optionA ||
                !data.optionB ||
                !data.optionC ||
                !data.optionD
            ) {

                alert("Please enter all four options");
                return;
            }

            data.answers = [];

            if (document.getElementById("ansA").checked) {
                data.answers.push("A");
            }

            if (document.getElementById("ansB").checked) {
                data.answers.push("B");
            }

            if (document.getElementById("ansC").checked) {
                data.answers.push("C");
            }

            if (document.getElementById("ansD").checked) {
                data.answers.push("D");
            }

            if (data.answers.length === 0) {

                alert("Select At Least One Correct Answer");
                return;
            }
        }

        // ====================
        // DESCRIPTIVE ANSWER
        // ====================

        if (questionType === "sentence") {

            data.modelAnswer =
                document.getElementById("modelAnswer").value.trim();
        }

        await addDoc(
            collection(db, "questions"),
            data
        );

        alert("Question Saved Successfully");

        clearForm();

    }
    catch(error){

        console.error("Question Save Error:", error);

        alert(
            "Unable To Save Question\n\n" +
            error.message
        );
    }
};

// ============================
// CLEAR FORM
// ============================

function clearForm(){

    document.getElementById("questionId").value = "";
    document.getElementById("question").value = "";
    document.getElementById("optionA").value = "";
    document.getElementById("optionB").value = "";
    document.getElementById("optionC").value = "";
    document.getElementById("optionD").value = "";
    document.getElementById("answer").value = "";
    document.getElementById("marks").value = "";
    document.getElementById("modelAnswer").value = "";

    document.getElementById("ansA").checked = false;
    document.getElementById("ansB").checked = false;
    document.getElementById("ansC").checked = false;
    document.getElementById("ansD").checked = false;

    document.getElementById("questionType").value = "mcq";

    updateQuestionType();
}

// ============================
// START
// ============================

loadExams();
