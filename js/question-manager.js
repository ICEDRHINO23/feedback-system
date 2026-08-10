import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allQuestions = [];
let currentQuestionId = "";

// ======================================
// HELPERS
// ======================================

function normalize(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function normalizeQuestionType(value) {
    const type = normalize(value);

    if (!type || type === "mcq" || type === "multiple choice" || type === "multiple-choice") {
        return "mcq";
    }

    if (type === "multiple" || type === "multiple answer" || type === "multiple-answer" || type === "multiple answers") {
        return "multiple";
    }

    if (type === "sentence" || type === "subjective" || type === "descriptive" || type === "descriptive answer") {
        return "sentence";
    }

    return type;
}

// ======================================
// LOAD QUESTIONS
// ======================================

async function loadQuestions() {

    const table = document.getElementById("questionTable");

    try {

        table.innerHTML = `
        <tr>
            <td colspan="6">Loading Questions...</td>
        </tr>`;

        const snapshot = await getDocs(collection(db, "questions"));

        allQuestions = [];

        snapshot.forEach((docSnap) => {
            allQuestions.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        allQuestions.sort((a, b) =>
            (a.question || "").localeCompare(b.question || "")
        );

        loadFilters();
        filterQuestions();

    } catch (error) {

        console.error(error);

        table.innerHTML = `
        <tr>
            <td colspan="6">Error Loading Questions</td>
        </tr>`;
    }
}

// ======================================
// RENDER TABLE
// ======================================

function renderQuestions(list) {

    const table = document.getElementById("questionTable");

    table.innerHTML = "";

    if (list.length === 0) {
        table.innerHTML = `
        <tr>
            <td colspan="6">No Questions Found</td>
        </tr>`;
        return;
    }

    list.forEach(q => {

        table.innerHTML += `
        <tr>
            <td>${q.question || "-"}</td>
            <td>${q.subject || "-"}</td>
            <td>${q.class || "-"}</td>
            <td>${normalizeQuestionType(q.questionType)}</td>
            <td>${q.marks || 1}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editQuestion('${q.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn preview-btn" onclick="previewQuestion('${q.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteQuestion('${q.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
}

// ======================================
// LOAD FILTERS
// ======================================

function loadFilters() {

    const classFilter = document.getElementById("classFilter");
    const subjectFilter = document.getElementById("subjectFilter");
    const typeFilter = document.getElementById("typeFilter");

    if (!classFilter || !subjectFilter || !typeFilter) return;

    const previousClass = classFilter.value;
    const previousSubject = subjectFilter.value;
    const previousType = typeFilter.value;

    classFilter.innerHTML = `<option value="">All Classes</option>`;
    subjectFilter.innerHTML = `<option value="">All Subjects</option>`;
    typeFilter.innerHTML = `
        <option value="">Question Type</option>
        <option value="mcq">MCQ</option>
        <option value="multiple">Multiple Answer</option>
        <option value="sentence">Subjective</option>
    `;

    const classes = [...new Set(
        allQuestions
            .map(q => String(q.class ?? "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const subjects = [...new Set(
        allQuestions
            .map(q => String(q.subject ?? "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    classes.forEach(cls => {
        classFilter.innerHTML += `<option value="${cls}">${cls}</option>`;
    });

    subjects.forEach(subject => {
        subjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`;
    });

    // Preserve the user's selected filters after the list is rebuilt.
    if ([...classFilter.options].some(o => o.value === previousClass)) {
        classFilter.value = previousClass;
    }

    if ([...subjectFilter.options].some(o => o.value === previousSubject)) {
        subjectFilter.value = previousSubject;
    }

    if ([...typeFilter.options].some(o => o.value === previousType)) {
        typeFilter.value = previousType;
    }
}

// ======================================
// FILTER QUESTIONS
// ======================================

function filterQuestions() {

    const searchBox = document.getElementById("searchBox");
    const classFilter = document.getElementById("classFilter");
    const subjectFilter = document.getElementById("subjectFilter");
    const typeFilter = document.getElementById("typeFilter");

    if (!searchBox || !classFilter || !subjectFilter || !typeFilter) return;

    const search = normalize(searchBox.value);
    const classValue = normalize(classFilter.value);
    const subjectValue = normalize(subjectFilter.value);
    const typeValue = normalizeQuestionType(typeFilter.value);
    const typeSelected = normalize(typeFilter.value) !== "";

    const filtered = allQuestions.filter(q => {

        const searchMatch = normalize(q.question).includes(search);

        const classMatch =
            classValue === "" ||
            normalize(q.class) === classValue;

        const subjectMatch =
            subjectValue === "" ||
            normalize(q.subject) === subjectValue;

        const typeMatch =
            !typeSelected ||
            normalizeQuestionType(q.questionType) === typeValue;

        return searchMatch && classMatch && subjectMatch && typeMatch;
    });

    renderQuestions(filtered);
}

// ======================================
// PREVIEW QUESTION
// ======================================

window.previewQuestion = function (id) {

    const question = allQuestions.find(q => q.id === id);
    if (!question) return;

    document.getElementById("previewQuestion").innerHTML = question.question || "";

    let optionsHTML = "";

    if (question.optionA) optionsHTML += `<p>A. ${question.optionA}</p>`;
    if (question.optionB) optionsHTML += `<p>B. ${question.optionB}</p>`;
    if (question.optionC) optionsHTML += `<p>C. ${question.optionC}</p>`;
    if (question.optionD) optionsHTML += `<p>D. ${question.optionD}</p>`;

    document.getElementById("previewOptions").innerHTML = optionsHTML;
    document.getElementById("previewAnswer").innerHTML = question.answer || "-";
    document.getElementById("previewMarks").innerHTML = question.marks || 1;
    document.getElementById("previewModal").style.display = "block";
};

// ======================================
// CLOSE PREVIEW
// ======================================

window.closePreview = function () {
    document.getElementById("previewModal").style.display = "none";
};

// ======================================
// EDIT QUESTION
// ======================================

window.editQuestion = function (id) {

    const question = allQuestions.find(q => q.id === id);
    if (!question) return;

    currentQuestionId = id;

    document.getElementById("editQuestion").value = question.question || "";
    document.getElementById("editOptionA").value = question.optionA || "";
    document.getElementById("editOptionB").value = question.optionB || "";
    document.getElementById("editOptionC").value = question.optionC || "";
    document.getElementById("editOptionD").value = question.optionD || "";
    document.getElementById("editAnswer").value = question.answer || "A";
    document.getElementById("editMarks").value = question.marks || 1;
    document.getElementById("editModal").style.display = "block";
};

// ======================================
// CLOSE EDIT
// ======================================

window.closeEdit = function () {
    document.getElementById("editModal").style.display = "none";
};

// ======================================
// UPDATE QUESTION
// ======================================

async function updateQuestion() {

    if (currentQuestionId === "") {
        alert("No Question Selected");
        return;
    }

    try {

        await updateDoc(
            doc(db, "questions", currentQuestionId),
            {
                question: document.getElementById("editQuestion").value,
                optionA: document.getElementById("editOptionA").value,
                optionB: document.getElementById("editOptionB").value,
                optionC: document.getElementById("editOptionC").value,
                optionD: document.getElementById("editOptionD").value,
                answer: document.getElementById("editAnswer").value,
                marks: Number(document.getElementById("editMarks").value)
            }
        );

        closeEdit();
        await loadQuestions();
        alert("Question Updated Successfully");

    } catch (error) {
        console.error(error);
        alert("Unable To Update Question");
    }
}

// ======================================
// DELETE QUESTION
// ======================================

window.deleteQuestion = async function (id) {

    const question = allQuestions.find(q => q.id === id);
    if (!question) return;

    const confirmDelete = confirm(
        "Delete this question?\n\n" +
        question.question +
        "\n\nThis action cannot be undone."
    );

    if (!confirmDelete) return;

    try {

        await deleteDoc(doc(db, "questions", id));

        allQuestions = allQuestions.filter(q => q.id !== id);

        loadFilters();
        filterQuestions();

        alert("Question Deleted Successfully.");

    } catch (error) {
        console.error(error);
        alert("Unable To Delete Question.");
    }
};

// ======================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// ======================================

document.addEventListener("click", function (event) {

    const preview = document.getElementById("previewModal");
    const edit = document.getElementById("editModal");

    if (event.target === preview) closePreview();
    if (event.target === edit) closeEdit();
});

// ======================================
// EVENTS
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    const searchBox = document.getElementById("searchBox");
    const classFilter = document.getElementById("classFilter");
    const subjectFilter = document.getElementById("subjectFilter");
    const typeFilter = document.getElementById("typeFilter");
    const updateBtn = document.getElementById("updateBtn");

    if (searchBox) searchBox.addEventListener("input", filterQuestions);
    if (classFilter) classFilter.addEventListener("change", filterQuestions);
    if (subjectFilter) subjectFilter.addEventListener("change", filterQuestions);
    if (typeFilter) typeFilter.addEventListener("change", filterQuestions);
    if (updateBtn) updateBtn.addEventListener("click", updateQuestion);

    loadQuestions();
});

// ======================================
// ESC KEY
// ======================================

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closePreview();
        closeEdit();
    }
});
