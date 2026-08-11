import { db } from "./supabase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from "./supabase-firestore.js";

// ===================================
// LOAD CLASSES
// ===================================

async function loadClasses() {

    try {

        const classDropdown =
            document.getElementById("examClass");

        if (!classDropdown) return;

        classDropdown.innerHTML =
            '<option value="">Select Class</option>';

        const settingsSnap =
            await getDocs(
                collection(db, "settings")
            );

        settingsSnap.forEach((docSnap) => {

            const data =
                docSnap.data();

            if (
                data.classes &&
                Array.isArray(data.classes)
            ) {

                data.classes.forEach((cls) => {

                    classDropdown.innerHTML += `
                        <option value="${cls}">
                            Class ${cls}
                        </option>
                    `;

                });

            }

        });

    }
    catch (error) {

        console.error(
            "Class Load Error:",
            error
        );

    }

}

// ===================================
// SAVE EXAM - CREATE OR EDIT
// ===================================

window.saveExam = async function () {

    try {

        const examName =
            document.getElementById("examName").value.trim();

        const subject =
            document.getElementById("subject").value.trim();

        const targetType =
            document.getElementById("targetType").value;

        const examClass =
            document.getElementById("examClass").value;

        const duration =
            document.getElementById("duration").value;

        const totalMarks =
            document.getElementById("totalMarks").value;

        const startDate =
            document.getElementById("startDate").value;

        const endDate =
            document.getElementById("endDate").value;

        const status =
            document.getElementById("status").value;

        const editingExamId =
            document.getElementById("editingExamId").value;

        if (
            !examName ||
            !subject ||
            !targetType ||
            !duration ||
            !totalMarks ||
            !startDate ||
            !endDate
        ) {

            alert(
                "Please fill all fields"
            );

            return;

        }

        const examData = {
            examName,
            subject,
            targetType,
            examClass:
                targetType === "student"
                    ? examClass
                    : "",
            duration:
                Number(duration),
            totalMarks:
                Number(totalMarks),
            startDate,
            endDate,
            status
        };

        // ===================================
        // EDIT EXISTING ASSESSMENT
        // ===================================

        if (editingExamId) {

            const confirmed = confirm(
                "Save changes to this assessment?\n\nQuestions and existing results will not be changed."
            );

            if (!confirmed) return;

            await updateDoc(
                doc(db, "exams", editingExamId),
                examData
            );

            alert(
                "Assessment Updated Successfully"
            );

        }

        // ===================================
        // CREATE NEW ASSESSMENT
        // ===================================

        else {

            await addDoc(
                collection(db, "exams"),
                {
                    ...examData,
                    createdAt:
                        new Date().toISOString()
                }
            );

            alert(
                "Assessment Created Successfully"
            );

        }

        resetForm();
        await loadExams();

    }
    catch (error) {

        console.error(
            "Save Exam Error:",
            error
        );

        alert(
            "Failed To Save Assessment\n\n" +
            error.message
        );

    }

};

// ===================================
// EDIT EXAM
// ===================================

window.editExam = async function (examId) {

    try {

        const examSnap =
            await getDoc(
                doc(db, "exams", examId)
            );

        if (!examSnap.exists()) {

            alert(
                "Assessment not found."
            );

            return;

        }

        const exam =
            examSnap.data();

        document.getElementById("editingExamId").value =
            examId;

        document.getElementById("examName").value =
            exam.examName || "";

        document.getElementById("subject").value =
            exam.subject || "";

        document.getElementById("targetType").value =
            exam.targetType || "";

        document.getElementById("examClass").value =
            exam.examClass || "";

        document.getElementById("duration").value =
            exam.duration ?? "";

        document.getElementById("totalMarks").value =
            exam.totalMarks ?? "";

        document.getElementById("startDate").value =
            exam.startDate || "";

        document.getElementById("endDate").value =
            exam.endDate || "";

        document.getElementById("status").value =
            exam.status || "active";

        document.getElementById("formTitle").innerText =
            "Edit Assessment";

        document.getElementById("saveExamBtn").innerText =
            "Save Changes";

        document.getElementById("cancelEditBtn").style.display =
            "block";

        document.getElementById("assessmentFormCard").classList.add(
            "edit-mode"
        );

        updateClassState();

        document.getElementById("assessmentFormCard").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
    catch (error) {

        console.error(
            "Edit Exam Error:",
            error
        );

        alert(
            "Unable To Open Assessment For Editing\n\n" +
            error.message
        );

    }

};

// ===================================
// CANCEL EDIT
// ===================================

window.cancelEdit = function () {

    resetForm();

};

// ===================================
// RESET FORM
// ===================================

function resetForm() {

    document.getElementById("editingExamId").value = "";

    document.getElementById("examName").value = "";
    document.getElementById("subject").value = "";
    document.getElementById("targetType").value = "";
    document.getElementById("examClass").value = "";
    document.getElementById("duration").value = "";
    document.getElementById("totalMarks").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("status").value = "active";

    document.getElementById("formTitle").innerText =
        "Create Assessment";

    document.getElementById("saveExamBtn").innerText =
        "Create Assessment";

    document.getElementById("cancelEditBtn").style.display =
        "none";

    document.getElementById("assessmentFormCard").classList.remove(
        "edit-mode"
    );

    updateClassState();

}

// ===================================
// TARGET / CLASS CONTROL
// ===================================

function updateClassState() {

    const targetType =
        document.getElementById("targetType").value;

    const classDropdown =
        document.getElementById("examClass");

    if (!classDropdown) return;

    if (targetType === "student") {
        classDropdown.disabled = false;
    }
    else {
        classDropdown.disabled = true;
        classDropdown.value = "";
    }

}

// ===================================
// LOAD EXAMS
// ===================================

async function loadExams() {

    try {

        const table =
            document.getElementById("examTable");

        if (!table) return;

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    Loading Assessments...
                </td>
            </tr>
        `;

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        console.log(
            "Exam Count:",
            snapshot.size
        );

        table.innerHTML = "";

        if (snapshot.empty) {

            table.innerHTML = `
                <tr>
                    <td colspan="8">
                        No Assessments Found
                    </td>
                </tr>
            `;

            return;

        }

        snapshot.forEach((docSnap) => {

            const exam =
                docSnap.data();

            const statusText =
                exam.status || "active";

            table.innerHTML += `
                <tr>

                    <td>${exam.examName || ""}</td>

                    <td>${exam.subject || ""}</td>

                    <td>${exam.targetType || ""}</td>

                    <td>${exam.examClass || "-"}</td>

                    <td>${exam.duration || 0}</td>

                    <td>${exam.totalMarks || 0}</td>

                    <td>${statusText}</td>

                    <td>

                        <div class="action-buttons">

                            <button
                                class="edit-btn"
                                onclick="editExam('${docSnap.id}')">
                                Edit
                            </button>

                            <button
                                class="delete-btn"
                                onclick="deleteExam('${docSnap.id}')">
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        });

    }
    catch (error) {

        console.error(
            "Load Exams Error:",
            error
        );

        const table =
            document.getElementById("examTable");

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="8">
                        Error Loading Assessments
                    </td>
                </tr>
            `;

        }

    }

}

// ===================================
// DELETE EXAM
// ===================================

window.deleteExam = async function (examId) {

    try {

        const confirmDelete =
            confirm(
                "Delete this assessment and all related questions and results?"
            );

        if (!confirmDelete) return;

        console.log(
            "Deleting Exam:",
            examId
        );

        // DELETE QUESTIONS

        const questionSnap =
            await getDocs(
                collection(db, "questions")
            );

        for (const questionDoc of questionSnap.docs) {

            const question =
                questionDoc.data();

            if (
                question.examId === examId
            ) {

                await deleteDoc(
                    doc(
                        db,
                        "questions",
                        questionDoc.id
                    )
                );

                console.log(
                    "Deleted Question:",
                    questionDoc.id
                );

            }

        }

        // DELETE RESULTS

        const resultSnap =
            await getDocs(
                collection(db, "results")
            );

        for (const resultDoc of resultSnap.docs) {

            const result =
                resultDoc.data();

            if (
                result.examId === examId
            ) {

                await deleteDoc(
                    doc(
                        db,
                        "results",
                        resultDoc.id
                    )
                );

                console.log(
                    "Deleted Result:",
                    resultDoc.id
                );

            }

        }

        // DELETE EXAM

        await deleteDoc(
            doc(
                db,
                "exams",
                examId
            )
        );

        console.log(
            "Deleted Exam:",
            examId
        );

        alert(
            "Assessment Deleted Successfully"
        );

        await loadExams();

    }
    catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert(
            "Delete Failed: " +
            error.message
        );

    }

};

// ===================================
// START
// ===================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadClasses();
        loadExams();

        document.getElementById("targetType")?.addEventListener(
            "change",
            updateClassState
        );

        updateClassState();

    }
);
