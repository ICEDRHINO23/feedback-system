import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================
// LOAD CLASSES
// ======================

async function loadClasses() {

    try {

        const classDropdown =
            document.getElementById("examClass");

        if (!classDropdown) return;

        classDropdown.innerHTML =
            `<option value="">Select Class</option>`;

        const settingsSnapshot =
            await getDocs(
                collection(db, "settings")
            );

        settingsSnapshot.forEach((d) => {

            const data = d.data();

            if (data.className) {

                classDropdown.innerHTML += `
                <option value="${data.className}">
                    ${data.className}
                </option>
                `;
            }
        });

    } catch (error) {

        console.error(
            "Load Classes Error:",
            error
        );
    }
}


// ======================
// CREATE EXAM
// ======================

window.createExam =
async function () {

    try {

        const examName =
            document.getElementById(
                "examName"
            ).value.trim();

        const subject =
            document.getElementById(
                "subject"
            ).value.trim();

        const targetType =
            document.getElementById(
                "targetType"
            ).value;

        const examClass =
            document.getElementById(
                "examClass"
            ).value;

        const duration =
            document.getElementById(
                "duration"
            ).value;

        const totalMarks =
            document.getElementById(
                "totalMarks"
            ).value;

        const startDate =
            document.getElementById(
                "startDate"
            ).value;

        const endDate =
            document.getElementById(
                "endDate"
            ).value;

        if (
            !examName ||
            !subject ||
            !duration ||
            !totalMarks
        ) {

            alert(
                "Please fill all required fields"
            );

            return;
        }

        await addDoc(
            collection(db, "exams"),
            {

                examName:
                    examName,

                subject:
                    subject,

                targetType:
                    targetType,

                examClass:
                    examClass,

                duration:
                    Number(duration),

                totalMarks:
                    Number(totalMarks),

                startDate:
                    startDate,

                endDate:
                    endDate,

                status:
                    "active",

                createdAt:
                    new Date()
                    .toISOString()
            }
        );

        alert(
            "Assessment Created Successfully"
        );

        document.getElementById(
            "examName"
        ).value = "";

        document.getElementById(
            "subject"
        ).value = "";

        document.getElementById(
            "duration"
        ).value = "";

        document.getElementById(
            "totalMarks"
        ).value = "";

        document.getElementById(
            "startDate"
        ).value = "";

        document.getElementById(
            "endDate"
        ).value = "";

        loadExams();

    } catch (error) {

        console.error(error);

        alert(
            "Failed To Create Assessment"
        );
    }
};


// ======================
// LOAD EXAMS
// ======================

async function loadExams() {

    try {

        const table =
            document.getElementById(
                "examTable"
            );

        table.innerHTML =
            `
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

            table.innerHTML =
                `
                <tr>
                    <td colspan="7">
                        No Assessments Found
                    </td>
                </tr>
                `;

            return;
        }

        snapshot.forEach((examDoc) => {

            const exam =
                examDoc.data();

            table.innerHTML += `

            <tr>

                <td>
                    ${exam.examName || ""}
                </td>

                <td>
                    ${exam.subject || ""}
                </td>

                <td>
                    ${exam.targetType || "student"}
                </td>

                <td>
                    ${exam.examClass || "-"}
                </td>

                <td>
                    ${exam.duration || 0}
                </td>

                <td>
                    ${exam.totalMarks || 0}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteExam('${examDoc.id}')">

                        Delete

                    </button>

                </td>

            </tr>

            `;
        });

    } catch (error) {

        console.error(error);
    }
}


// ======================
// DELETE EXAM
// ======================

window.deleteExam =
async function (id) {

    try {

        const confirmDelete =
            confirm(
                "Delete Assessment?"
            );

        if (!confirmDelete)
            return;

        await deleteDoc(
            doc(
                db,
                "exams",
                id
            )
        );

        alert(
            "Assessment Deleted"
        );

        loadExams();

    } catch (error) {

        console.error(error);

        alert(
            "Delete Failed"
        );
    }
};


// ======================
// INIT
// ======================

loadClasses();
loadExams();
