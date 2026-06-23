import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadStudents() {

    const tbody = document.getElementById("studentTable");

    if (!tbody) {
        console.error("studentTable not found");
        return;
    }

    try {

        const snapshot = await getDocs(
            collection(db, "students")
        );

        tbody.innerHTML = "";

        if (snapshot.empty) {

            tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No Students Found
                </td>
            </tr>
            `;

            return;
        }

        snapshot.forEach((studentDoc) => {

            const student = studentDoc.data();

            tbody.innerHTML += `
            <tr>
                <td>${student.name || ""}</td>
                <td>${student.class || ""}</td>
                <td>${student.section || ""}</td>
                <td>${student.rollNo || ""}</td>
                <td>${student.status || "active"}</td>
                <td>${student.lastlogin || "-"}</td>

                <td>

                    <button
                        class="action-btn disable"
                        onclick="toggleStudentStatus(
                            '${studentDoc.id}',
                            '${student.status || "active"}'
                        )">

                        ${student.status || "active"}

                    </button>

                    <button
                        class="action-btn delete"
                        onclick="deleteStudent(
                            '${studentDoc.id}'
                        )">

                        Delete

                    </button>

                </td>

            </tr>
            `;

        });

    } catch (error) {

        console.error(
            "Error Loading Students:",
            error
        );

        tbody.innerHTML = `
        <tr>
            <td colspan="7">
                Error Loading Students
            </td>
        </tr>
        `;
    }
}


// Enable / Disable Student

window.toggleStudentStatus =
async function(id, currentStatus){

    try{

        const newStatus =
            currentStatus === "active"
            ? "disabled"
            : "active";

        await updateDoc(
            doc(db, "students", id),
            {
                status: newStatus
            }
        );

        alert(
            "Student status updated"
        );

        loadStudents();

    }catch(error){

        console.error(error);

        alert(
            "Unable to update status"
        );
    }
};


// Delete Student

window.deleteStudent =
async function(id){

    const confirmDelete =
        confirm(
            "Delete this student?"
        );

    if(!confirmDelete)
        return;

    try{

        await deleteDoc(
            doc(db, "students", id)
        );

        alert(
            "Student deleted"
        );

        loadStudents();

    }catch(error){

        console.error(error);

        alert(
            "Unable to delete student"
        );
    }
};


loadStudents();
