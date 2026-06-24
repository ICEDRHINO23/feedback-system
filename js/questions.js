```javascript
import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examSelect =
    document.getElementById(
        "examSelect"
    );

// ============================
// LOAD EXAMS
// ============================

async function loadExams() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examSelect.innerHTML =
            '<option value="">Select Exam</option>';

        snapshot.forEach(examDoc => {

            const exam =
                examDoc.data();

            examSelect.innerHTML += `

            <option value="${examDoc.id}">
                ${exam.examName}
            </option>

            `;

        });

    }
    catch(error){

        console.error(error);
    }
}

// ============================
// SAVE / UPDATE QUESTION
// ============================

window.saveQuestion =
async function () {

    try {

        const questionId =
            document.getElementById(
                "questionId"
            ).value;

        const examId =
            document.getElementById(
                "examSelect"
            ).value;

        const questionType =
            document.getElementById(
                "questionType"
            ).value;

        const question =
            document.getElementById(
                "question"
            ).value.trim();

        const marks =
            document.getElementById(
                "marks"
            ).value;

        if (
            !examId ||
            !question ||
            !marks
        ) {

            alert(
                "Please fill all required fields"
            );

            return;
        }

        let data = {

            examId,
            questionType,
            question,
            marks: Number(marks)

        };

        // ====================
        // SINGLE MCQ
        // ====================

        if (
            questionType === "mcq"
        ) {

            data.optionA =
                document.getElementById(
                    "optionA"
                ).value;

            data.optionB =
                document.getElementById(
                    "optionB"
                ).value;

            data.optionC =
                document.getElementById(
                    "optionC"
                ).value;

            data.optionD =
                document.getElementById(
                    "optionD"
                ).value;

            data.answer =
                document.getElementById(
                    "answer"
                ).value;

            if (!data.answer) {

                alert(
                    "Select Correct Answer"
                );

                return;
            }
        }

        // ====================
        // MULTIPLE ANSWERS
        // ====================

        if (
            questionType === "multiple"
        ) {

            data.optionA =
                document.getElementById(
                    "optionA"
                ).value;

            data.optionB =
                document.getElementById(
                    "optionB"
                ).value;

            data.optionC =
                document.getElementById(
                    "optionC"
                ).value;

            data.optionD =
                document.getElementById(
                    "optionD"
                ).value;

            data.answers = [];

            if (
                document.getElementById(
                    "ansA"
                ).checked
            ) {

                data.answers.push("A");
            }

            if (
                document.getElementById(
                    "ansB"
                ).checked
            ) {

                data.answers.push("B");
            }

            if (
                document.getElementById(
                    "ansC"
                ).checked
            ) {

                data.answers.push("C");
            }

            if (
                document.getElementById(
                    "ansD"
                ).checked
            ) {

                data.answers.push("D");
            }

            if (
                data.answers.length === 0
            ) {

                alert(
                    "Select At Least One Correct Answer"
                );

                return;
            }
        }

        // ====================
        // SENTENCE ANSWER
        // ====================

        if (
            questionType === "sentence"
        ) {

            data.modelAnswer =
                document.getElementById(
                    "modelAnswer"
                ).value.trim();
        }

        // ====================
        // UPDATE
        // ====================

        if (questionId) {

            await updateDoc(
                doc(
                    db,
                    "questions",
                    questionId
                ),
                data
            );

            alert(
                "Question Updated Successfully"
            );
        }

        // ====================
        // NEW QUESTION
        // ====================

        else {

            await addDoc(
                collection(
                    db,
                    "questions"
                ),
                data
            );

            alert(
                "Question Saved Successfully"
            );
        }

        clearForm();

        loadQuestions();

    }
    catch(error){

        console.error(error);

        alert(
            "Unable To Save Question"
        );
    }
};

// ============================
// LOAD QUESTIONS
// ============================

async function loadQuestions() {

    try {

        const tbody =
            document.getElementById(
                "questionTable"
            );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "questions"
                )
            );

        tbody.innerHTML = "";

        if (
            snapshot.empty
        ) {

            tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    No Questions Found

                </td>

            </tr>

            `;

            return;
        }

        snapshot.forEach(questionDoc => {

            const q =
                questionDoc.data();

            let answerText = "-";

            if (
                q.questionType === "mcq"
            ) {

                answerText =
                    q.answer;
            }

            if (
                q.questionType === "multiple"
            ) {

                answerText =
                    q.answers
                    ? q.answers.join(", ")
                    : "-";
            }

            if (
                q.questionType === "sentence"
            ) {

                answerText =
                    "Sentence Answer";
            }

            tbody.innerHTML += `

            <tr>

                <td>

                    ${q.question}

                </td>

                <td>

                    ${q.questionType}

                </td>

                <td>

                    ${answerText}

                </td>

                <td>

                    ${q.marks}

                </td>

                <td>

                    <button
                    class="edit-btn"
                    onclick="editQuestion('${questionDoc.id}')">

                    Edit

                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteQuestion('${questionDoc.id}')">

                    Delete

                    </button>

                </td>

            </tr>

            `;
        });

    }
    catch(error){

        console.error(error);
    }
}

// ============================
// EDIT QUESTION
// ============================

window.editQuestion =
async function(id){

    try {

        const questionRef =
            doc(
                db,
                "questions",
                id
            );

        const snap =
            await getDoc(
                questionRef
            );

        if (
            !snap.exists()
        ) return;

        const q =
            snap.data();

        document.getElementById(
            "questionId"
        ).value = id;

        document.getElementById(
            "examSelect"
        ).value =
            q.examId || "";

        document.getElementById(
            "questionType"
        ).value =
            q.questionType || "mcq";

        document.getElementById(
            "question"
        ).value =
            q.question || "";

        document.getElementById(
            "marks"
        ).value =
            q.marks || "";

        document.getElementById(
            "optionA"
        ).value =
            q.optionA || "";

        document.getElementById(
            "optionB"
        ).value =
            q.optionB || "";

        document.getElementById(
            "optionC"
        ).value =
            q.optionC || "";

        document.getElementById(
            "optionD"
        ).value =
            q.optionD || "";

        document.getElementById(
            "answer"
        ).value =
            q.answer || "";

        if (q.answers) {

            document.getElementById(
                "ansA"
            ).checked =
                q.answers.includes("A");

            document.getElementById(
                "ansB"
            ).checked =
                q.answers.includes("B");

            document.getElementById(
                "ansC"
            ).checked =
                q.answers.includes("C");

            document.getElementById(
                "ansD"
            ).checked =
                q.answers.includes("D");
        }

        document.getElementById(
            "modelAnswer"
        ).value =
            q.modelAnswer || "";

        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }
    catch(error){

        console.error(error);
    }
};

// ============================
// DELETE QUESTION
// ============================

window.deleteQuestion =
async function(id){

    if (
        !confirm(
            "Delete Question?"
        )
    ) return;

    try {

        await deleteDoc(
            doc(
                db,
                "questions",
                id
            )
        );

        loadQuestions();

    }
    catch(error){

        console.error(error);

        alert(
            "Unable To Delete Question"
        );
    }
};

// ============================
// CLEAR FORM
// ============================

function clearForm(){

    document.getElementById(
        "questionId"
    ).value = "";

    document.getElementById(
        "question"
    ).value = "";

    document.getElementById(
        "optionA"
    ).value = "";

    document.getElementById(
        "optionB"
    ).value = "";

    document.getElementById(
        "optionC"
    ).value = "";

    document.getElementById(
        "optionD"
    ).value = "";

    document.getElementById(
        "answer"
    ).value = "";

    document.getElementById(
        "marks"
    ).value = "";

    document.getElementById(
        "modelAnswer"
    ).value = "";

    document.getElementById(
        "ansA"
    ).checked = false;

    document.getElementById(
        "ansB"
    ).checked = false;

    document.getElementById(
        "ansC"
    ).checked = false;

    document.getElementById(
        "ansD"
    ).checked = false;
}

// ============================
// START
// ============================

loadExams();
loadQuestions();
```
