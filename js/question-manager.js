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
let examMap = {};

function normalize(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeQuestionType(value) {
    const type = normalize(value);
    if (!type || ["mcq", "multiple choice", "multiple-choice"].includes(type)) return "mcq";
    if (["multiple", "multiple answer", "multiple-answer", "multiple answers"].includes(type)) return "multiple";
    if (["sentence", "subjective", "descriptive", "descriptive answer"].includes(type)) return "sentence";
    return type;
}

async function loadExamMap() {
    try {
        const snapshot = await getDocs(collection(db, "exams"));
        examMap = {};
        snapshot.forEach(docSnap => {
            examMap[docSnap.id] = docSnap.data();
        });
    } catch (error) {
        console.warn("Exam metadata could not be loaded:", error);
        examMap = {};
    }
}

function getQuestionExamId(q) {
    return String(q.examId ?? q.examID ?? q.assessmentId ?? q.assessmentID ?? "").trim();
}

function getAssessmentName(exam, id) {
    if (!exam) return id || "Unknown Assessment";
    return String(
        exam.examName ??
        exam.assessmentName ??
        exam.name ??
        exam.title ??
        id ??
        "Unknown Assessment"
    ).trim();
}

function getQuestionClass(q) {
    const direct = String(q.class ?? q.examClass ?? q.className ?? "").trim();
    if (direct) return direct;
    const exam = examMap[getQuestionExamId(q)];
    return exam ? String(exam.examClass ?? exam.class ?? exam.className ?? "").trim() : "";
}

function getQuestionSubject(q) {
    const direct = String(q.subject ?? q.examSubject ?? "").trim();
    if (direct) return direct;
    const exam = examMap[getQuestionExamId(q)];
    return exam ? String(exam.subject ?? exam.examSubject ?? "").trim() : "";
}

async function loadQuestions() {
    const table = document.getElementById("questionTable");
    try {
        table.innerHTML = `<tr><td colspan="6">Loading Questions...</td></tr>`;
        await loadExamMap();
        const snapshot = await getDocs(collection(db, "questions"));
        allQuestions = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const examId = getQuestionExamId(data);
            allQuestions.push({
                id: docSnap.id,
                ...data,
                _examId: examId,
                _assessment: getAssessmentName(examMap[examId], examId),
                _class: getQuestionClass(data),
                _subject: getQuestionSubject(data),
                _type: normalizeQuestionType(data.questionType ?? data.type)
            });
        });

        allQuestions.sort((a, b) => (a.question || "").localeCompare(b.question || ""));
        loadFilters();
        filterQuestions();
    } catch (error) {
        console.error(error);
        table.innerHTML = `<tr><td colspan="6">Error Loading Questions</td></tr>`;
    }
}

function renderQuestions(list) {
    const table = document.getElementById("questionTable");
    table.innerHTML = "";

    if (!list.length) {
        table.innerHTML = `<tr><td colspan="6">No Questions Found</td></tr>`;
        return;
    }

    list.forEach(q => {
        table.innerHTML += `
        <tr>
            <td>${q.question || "-"}</td>
            <td>${q._subject || q.subject || "-"}</td>
            <td>${q._class || q.class || "-"}</td>
            <td>${q._type}</td>
            <td>${q.marks || 1}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editQuestion('${q.id}')" title="Edit Question"><i class="fas fa-edit"></i></button>
                <button class="action-btn preview-btn" onclick="previewQuestion('${q.id}')" title="Preview Question"><i class="fas fa-eye"></i></button>
                <button class="action-btn delete-btn" onclick="deleteQuestion('${q.id}')" title="Delete Question"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
}

// ======================================
// DYNAMIC FILTERS
// ======================================

function loadFilters() {
    const classFilter = document.getElementById("classFilter");
    const subjectFilter = document.getElementById("subjectFilter");
    const assessmentFilter = document.getElementById("assessmentFilter");
    const typeFilter = document.getElementById("typeFilter");

    if (!classFilter || !subjectFilter || !assessmentFilter || !typeFilter) return;

    const previousClass = classFilter.value;
    const previousSubject = subjectFilter.value;
    const previousAssessment = assessmentFilter.value;
    const previousType = typeFilter.value;

    classFilter.innerHTML = `<option value="">All Classes</option>`;
    subjectFilter.innerHTML = `<option value="">All Subjects</option>`;
    assessmentFilter.innerHTML = `<option value="">All Assessments</option>`;
    typeFilter.innerHTML = `
        <option value="">Question Type</option>
        <option value="mcq">MCQ</option>
        <option value="multiple">Multiple Answer</option>
        <option value="sentence">Subjective</option>`;

    const classes = [...new Set(allQuestions.map(q => q._class).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

    const subjects = [...new Set(allQuestions.map(q => q._subject).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b)));

    const assessments = [...new Map(
        allQuestions
            .filter(q => q._examId)
            .map(q => [q._examId, q._assessment])
    ).entries()]
        .sort((a, b) => String(a[1]).localeCompare(String(b[1])));

    classes.forEach(cls => {
        const option = document.createElement("option");
        option.value = cls;
        option.textContent = `Class ${cls}`;
        classFilter.appendChild(option);
    });

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });

    assessments.forEach(([examId, assessmentName]) => {
        const option = document.createElement("option");
        option.value = examId;
        option.textContent = assessmentName || examId;
        assessmentFilter.appendChild(option);
    });

    if ([...classFilter.options].some(o => o.value === previousClass)) classFilter.value = previousClass;
    if ([...subjectFilter.options].some(o => o.value === previousSubject)) subjectFilter.value = previousSubject;
    if ([...assessmentFilter.options].some(o => o.value === previousAssessment)) assessmentFilter.value = previousAssessment;
    if ([...typeFilter.options].some(o => o.value === previousType)) typeFilter.value = previousType;
}

function filterQuestions() {
    const search = normalize(document.getElementById("searchBox")?.value);
    const classValue = normalize(document.getElementById("classFilter")?.value);
    const subjectValue = normalize(document.getElementById("subjectFilter")?.value);
    const assessmentValue = String(document.getElementById("assessmentFilter")?.value ?? "").trim();
    const typeRaw = normalize(document.getElementById("typeFilter")?.value);
    const typeSelected = typeRaw !== "";
    const typeValue = normalizeQuestionType(typeRaw);

    const filtered = allQuestions.filter(q => {
        const searchMatch = normalize(q.question).includes(search);
        const classMatch = !classValue || normalize(q._class) === classValue;
        const subjectMatch = !subjectValue || normalize(q._subject) === subjectValue;
        const assessmentMatch = !assessmentValue || q._examId === assessmentValue;
        const typeMatch = !typeSelected || q._type === typeValue;
        return searchMatch && classMatch && subjectMatch && assessmentMatch && typeMatch;
    });

    renderQuestions(filtered);
}

// ======================================
// PREVIEW
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

    document.getElementById("previewOptions").innerHTML = optionsHTML || "<p>No options</p>";
    document.getElementById("previewAnswer").innerHTML = question.answer || "-";
    document.getElementById("previewMarks").innerHTML = question.marks || 1;
    document.getElementById("previewModal").style.display = "block";
};

window.closePreview = function () {
    document.getElementById("previewModal").style.display = "none";
};

// ======================================
// EDIT QUESTION
// ======================================

function updateEditOptionsVisibility(type) {
    const optionsSection = document.getElementById("editOptionsSection");
    if (!optionsSection) return;
    optionsSection.style.display = type === "sentence" ? "none" : "block";
}

window.editQuestion = function (id) {
    const question = allQuestions.find(q => q.id === id);
    if (!question) return;

    currentQuestionId = id;

    document.getElementById("editAssessment").value = question._assessment || "Unknown Assessment";
    document.getElementById("editQuestion").value = question.question || "";
    document.getElementById("editOptionA").value = question.optionA || "";
    document.getElementById("editOptionB").value = question.optionB || "";
    document.getElementById("editOptionC").value = question.optionC || "";
    document.getElementById("editOptionD").value = question.optionD || "";
    document.getElementById("editAnswer").value = question.answer || "A";
    document.getElementById("editMarks").value = question.marks ?? 1;

    updateEditOptionsVisibility(question._type);
    document.getElementById("editModal").style.display = "block";
};

window.closeEdit = function () {
    document.getElementById("editModal").style.display = "none";
};

async function updateQuestion() {
    if (!currentQuestionId) {
        alert("No Question Selected");
        return;
    }

    const questionText = document.getElementById("editQuestion").value.trim();
    const marks = Number(document.getElementById("editMarks").value);

    if (!questionText) {
        alert("Please enter the question.");
        document.getElementById("editQuestion").focus();
        return;
    }

    if (!Number.isFinite(marks) || marks < 0) {
        alert("Please enter valid marks.");
        document.getElementById("editMarks").focus();
        return;
    }

    try {
        const existingQuestion = allQuestions.find(q => q.id === currentQuestionId);
        const updateData = {
            question: questionText,
            answer: document.getElementById("editAnswer").value,
            marks: marks
        };

        // Preserve the existing behaviour for objective questions.
        if (!existingQuestion || existingQuestion._type !== "sentence") {
            updateData.optionA = document.getElementById("editOptionA").value.trim();
            updateData.optionB = document.getElementById("editOptionB").value.trim();
            updateData.optionC = document.getElementById("editOptionC").value.trim();
            updateData.optionD = document.getElementById("editOptionD").value.trim();
        }

        await updateDoc(doc(db, "questions", currentQuestionId), updateData);

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

    if (!confirm("Delete this question?\n\n" + question.question + "\n\nThis action cannot be undone.")) return;

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
// MODAL / KEYBOARD EVENTS
// ======================================

document.addEventListener("click", function (event) {
    const preview = document.getElementById("previewModal");
    const edit = document.getElementById("editModal");

    if (event.target === preview) closePreview();
    if (event.target === edit) closeEdit();
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closePreview();
        closeEdit();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchBox")?.addEventListener("input", filterQuestions);
    document.getElementById("classFilter")?.addEventListener("change", filterQuestions);
    document.getElementById("subjectFilter")?.addEventListener("change", filterQuestions);
    document.getElementById("assessmentFilter")?.addEventListener("change", filterQuestions);
    document.getElementById("typeFilter")?.addEventListener("change", filterQuestions);
    document.getElementById("updateBtn")?.addEventListener("click", updateQuestion);
    loadQuestions();
});
