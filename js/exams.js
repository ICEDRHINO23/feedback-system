
import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// LOAD CLASSES
// ===============================

async function loadClasses() {

    try {

        const classDropdown =
            document.getElementById("examClass");

        if (!classDropdown) return;

        const settingsSnap =
            await getDocs(
                collection(db, "settings")
            );

        classDropdown.innerHTML =
            '<option value="">Select Class</option>';

        settingsSnap.forEach(docSnap => {

            const data =
                docSnap.data();

            if (data.classes) {

                data.classes.forEach(cls => {

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

// ===============================
// CREATE ASSESSMENT
// ===============================

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

        loadExams();

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

// ===============================
// LOAD ASSESSMENTS
// ===============================

async function loadExams() {

    try {

        const table =
            document.getElementById("examTable");

        if (!table) return;

        table.innerHTML = `
        <tr>
            <td colspan="7">
                Loading...
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

        snapshot.forEach(docSnap => {

            const exam =
                docSnap.data();

            table.innerHTML += `

            <tr>

                <td>${exam.examName}</td>

                <td>${exam.subject}</td>

                <td>${exam.targetType}</td>

                <td>${exam.examClass || "-"}</td>

                <td>${exam.duration}</td>

                <td>${exam.totalMarks}</td>

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
    }
}

// ===============================
// DELETE ASSESSMENT
// ===============================

window.deleteExam = async function (examId) {

    try {

        const confirmDelete =
            confirm(
                "Delete this assessment and all related questions/results?"
            );

        if (!confirmDelete) return;

        console.log(
            "Deleting Exam:",
            examId
        );

        // Delete Questions

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

        // Delete Results

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

        // Delete Exam

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
            "DELETE ERROR:",
            error
        );

        alert(
            "Delete Failed: " +
            error.message
        );
    }
};

// ===============================
// START
// ===============================

loadClasses();
loadExams();
```
