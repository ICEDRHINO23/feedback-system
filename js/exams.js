import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.createExam = async function () {

    try {

        const examName =
            document.getElementById("examName").value;

        const subject =
            document.getElementById("subject").value;

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
            !duration ||
            !totalMarks
        ) {

            alert("Fill all required fields");
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

        alert("Assessment Created");

        location.reload();

    }
    catch (error) {

        console.error(error);

        alert("Creation Failed");
    }
};

async function loadExams() {

    const table =
        document.getElementById("examTable");

    try {

        table.innerHTML = "";

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        snapshot.forEach((docSnap) => {

            const exam =
                docSnap.data();

            table.innerHTML += `

            <tr>

                <td>${exam.examName}</td>

                <td>${exam.subject}</td>

                <td>${exam.targetType}</td>

                <td>
                    ${exam.examClass || "-"}
                </td>

                <td>${exam.duration}</td>

                <td>${exam.totalMarks}</td>

                <td>

                    <button
                    onclick="deleteExam('${docSnap.id}')"
                    style="
                        background:red;
                        color:white;
                        border:none;
                        padding:8px 12px;
                        border-radius:5px;
                        cursor:pointer;
                    ">
                    Delete
                    </button>

                </td>

            </tr>

            `;
        });

    }
    catch (error) {

        console.error(error);

        table.innerHTML =

        `<tr>
            <td colspan="7">
                Failed To Load Assessments
            </td>
        </tr>`;
    }
}

window.deleteExam = async function (examId) {

    if (!confirm(
        "Delete this assessment?"
    )) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                "exams",
                examId
            )
        );

        alert(
            "Assessment Deleted"
        );

        loadExams();

    }
    catch (error) {

        console.error(error);

        alert(
            "Delete Failed"
        );
    }
};

loadExams();
