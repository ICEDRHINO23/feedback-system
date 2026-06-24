import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================
// LOAD CLASSES FROM settings/config
// =====================================

async function loadClasses() {

    try {

        const classDropdown =
            document.getElementById(
                "examClass"
            );

        if (!classDropdown) return;

        classDropdown.innerHTML =
            `<option value="">Select Class</option>`;

        const settingsDoc =
            await getDoc(
                doc(
                    db,
                    "settings",
                    "config"
                )
            );

        if (settingsDoc.exists()) {

            const data =
                settingsDoc.data();

            if (
                data.classes &&
                Array.isArray(
                    data.classes
                )
            ) {

                data.classes.forEach(
                    cls => {

                    classDropdown.innerHTML += `
                    <option value="${cls}">
                        Class ${cls}
                    </option>
                    `;

                });
            }
        }

    } catch (error) {

        console.error(
            "Class Load Error:",
            error
        );
    }
}


// =====================================
// CREATE ASSESSMENT
// =====================================

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


// =====================================
// LOAD ASSESSMENTS
// =====================================

async function loadExams() {

    try {

        const table =
            document.getElementById(
                "examTable"
            );

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

        snapshot.forEach(
            examDoc => {

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

        console.error(
            "Load Exam Error:",
            error
        );
    }
}


// =====================================
// DELETE ASSESSMENT
// =====================================

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


// =====================================
// INITIAL LOAD
// =====================================

loadClasses();
loadExams();
