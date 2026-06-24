import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
// CREATE EXAM
// ===================================

window.createExam = async function () {

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

        await addDoc(
            collection(db, "exams"),
            {
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
                status: "active",
                createdAt:
                    new Date().toISOString()
            }
        );

        alert(
            "Assessment Created Successfully"
        );

        document.getElementById("examName").value = "";
        document.getElementById("subject").value = "";
        document.getElementById("duration").value = "";
        document.getElementById("totalMarks").value = "";
        document.getElementById("startDate").value = "";
        document.getElementById("endDate").value = "";

        await loadExams();

    }
    catch (error) {

        console.error(
            "Create Exam Error:",
            error
        );

        alert(
            "Failed To Create Assessment"
        );

    }

};

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
                <td colspan="7">
                    Loading Assessments...
                </td>
            </tr>
        `;

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        table.innerHTML = "";

        if (snapshot.empty) {

            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        No Assessments Found
                    </td>
                </tr>
            `;

            return;

        }

        snapshot.forEach((docSnap) => {

            const exam =
                docSnap.data();

            table.innerHTML += `
                <tr>

                    <td>${exam.examName || ""}</td>

                    <td>${exam.subject || ""}</td>

                    <td>${exam.targetType || ""}</td>

                    <td>${exam.examClass || "-"}</td>

                    <td>${exam.duration || 0}</td>

                    <td>${exam.totalMarks || 0}</td>

                    <td>

                        <button
                            class="delete-btn"
                            onclick="deleteExam('${docSnap.id}')">

                            Delete

                        </button>

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
                    <td colspan="7">
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

    }
);
