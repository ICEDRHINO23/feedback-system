import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const examTable =
    document.getElementById("examTable");

// =====================
// LOAD CLASSES
// =====================

async function loadClasses() {

    try {

        const configRef =
            doc(db, "settings", "config");

        const configSnap =
            await getDoc(configRef);

        const classSelect =
            document.getElementById("examClass");

        classSelect.innerHTML =
            '<option value="">Select Class</option>';

        if (!configSnap.exists()) {

            console.log(
                "Config document not found"
            );

            return;
        }

        const classes =
            configSnap.data().classes || [];

        classes.forEach(cls => {

            classSelect.innerHTML += `
                <option value="${cls}">
                    ${cls}
                </option>
            `;

        });

    } catch (error) {

        console.error(
            "Load Classes Error:",
            error
        );
    }
}

// =====================
// CREATE EXAM
// =====================

window.createExam =
async function () {

    const examName =
        document.getElementById(
            "examName"
        ).value.trim();

    const subject =
        document.getElementById(
            "subject"
        ).value.trim();

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
        !examClass ||
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

    try {

        await addDoc(
            collection(db, "exams"),
            {

                examName:
                    examName,

                subject:
                    subject,

                class:
                    examClass,

                duration:
                    duration,

                totalMarks:
                    totalMarks,

                startDate:
                    startDate,

                endDate:
                    endDate,

                createdAt:
                    new Date()
                    .toISOString()

            }
        );

        alert(
            "Exam Created Successfully"
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
            "Failed To Create Exam"
        );
    }
};

// =====================
// LOAD EXAMS
// =====================

async function loadExams() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examTable.innerHTML = "";

        if (snapshot.empty) {

            examTable.innerHTML = `
                <tr>
                    <td colspan="6">
                        No Exams Found
                    </td>
                </tr>
            `;

            return;
        }

        snapshot.forEach(
            examDoc => {

                const exam =
                    examDoc.data();

                examTable.innerHTML += `

                <tr>

                    <td>
                        ${exam.examName || ""}
                    </td>

                    <td>
                        ${exam.subject || ""}
                    </td>

                    <td>
                        ${exam.class || ""}
                    </td>

                    <td>
                        ${exam.duration || ""}
                        Min
                    </td>

                    <td>
                        ${exam.totalMarks || ""}
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

            }
        );

    } catch (error) {

        console.error(
            "Load Exams Error:",
            error
        );

        examTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Error Loading Exams
                </td>
            </tr>
        `;
    }
}

// =====================
// DELETE EXAM
// =====================

window.deleteExam =
async function (id) {

    const confirmDelete =
        confirm(
            "Delete this exam?"
        );

    if (!confirmDelete)
        return;

    try {

        await deleteDoc(
            doc(
                db,
                "exams",
                id
            )
        );

        loadExams();

    } catch (error) {

        console.error(error);

        alert(
            "Unable To Delete Exam"
        );
    }
};

// =====================
// INIT
// =====================

loadClasses();
loadExams();
