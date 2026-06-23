
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


// =======================
// LOAD CLASSES
// =======================

async function loadClasses() {

    try {

        const configRef =
            doc(db, "settings", "config");

        const configSnap =
            await getDoc(configRef);

        if (!configSnap.exists())
            return;

        const classes =
            configSnap.data().classes || [];

        const classSelect =
            document.getElementById("examClass");

        classSelect.innerHTML =
            '<option value="">Select Class</option>';

        classes.forEach(cls => {

            classSelect.innerHTML += `
            <option value="${cls}">
                ${cls}
            </option>
            `;

        });

    } catch(error){

        console.error(error);
    }
}


// =======================
// CREATE EXAM
// =======================

window.createExam =
async function(){

    const examName =
        document.getElementById("examName")
        .value.trim();

    const subject =
        document.getElementById("subject")
        .value.trim();

    const examClass =
        document.getElementById("examClass")
        .value;

    const duration =
        document.getElementById("duration")
        .value;

    const totalMarks =
        document.getElementById("totalMarks")
        .value;

    const startDate =
        document.getElementById("startDate")
        .value;

    const endDate =
        document.getElementById("endDate")
        .value;

    if(
        !examName ||
        !subject ||
        !examClass ||
        !duration ||
        !totalMarks ||
        !startDate ||
        !endDate
    ){
        alert("Fill all fields");
        return;
    }

    try {

        await addDoc(
            collection(db, "exams"),
            {
                examName,
                subject,
                class: examClass,
                duration,
                totalMarks,
                startDate,
                endDate,
                createdAt:
                    new Date().toISOString()
            }
        );

        alert("Exam Created");

        document.getElementById("examName").value="";
        document.getElementById("subject").value="";
        document.getElementById("duration").value="";
        document.getElementById("totalMarks").value="";
        document.getElementById("startDate").value="";
        document.getElementById("endDate").value="";

        loadExams();

    } catch(error){

        console.error(error);

        alert("Failed to create exam");
    }

};


// =======================
// LOAD EXAMS
// =======================

async function loadExams(){

    try {

        const snapshot =
            await getDocs(
                collection(db, "exams")
            );

        examTable.innerHTML = "";

        if(snapshot.empty){

            examTable.innerHTML = `
            <tr>
                <td colspan="5">
                    No Exams Created
                </td>
            </tr>
            `;

            return;
        }

        snapshot.forEach(examDoc => {

            const exam =
                examDoc.data();

            examTable.innerHTML += `

            <tr>

                <td>
                    ${exam.examName}
                </td>

                <td>
                    ${exam.subject}
                </td>

                <td>
                    ${exam.class}
                </td>

                <td>
                    ${exam.duration} Min
                </td>

                <td>

                    <button
                        onclick="deleteExam('${examDoc.id}')">
                        Delete
                    </button>

                </td>

            </tr>

            `;

        });

    } catch(error){

        console.error(error);
    }
}


// =======================
// DELETE EXAM
// =======================

window.deleteExam =
async function(id){

    if(
        !confirm(
            "Delete this exam?"
        )
    ){
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                "exams",
                id
            )
        );

        loadExams();

    } catch(error){

        console.error(error);

        alert(
            "Unable to delete exam"
        );
    }
};


// =======================
// INIT
// =======================

loadClasses();
loadExams();
