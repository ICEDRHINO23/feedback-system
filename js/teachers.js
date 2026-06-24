import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.addTeacher = addTeacher;
window.deleteTeacher = deleteTeacher;
window.resetPassword = resetPassword;

async function addTeacher() {

    const teacherName =
        document.getElementById("teacherName").value.trim();

    const employeeId =
        document.getElementById("employeeId").value.trim();

    const subject =
        document.getElementById("subject").value.trim();

    const status =
        document.getElementById("status").value;

    if (
        !teacherName ||
        !employeeId ||
        !subject
    ) {
        alert("Fill all fields");
        return;
    }

    try {

        const password =
            "AHPS" + employeeId + "@2026";

        await addDoc(
            collection(db, "teachers"),
            {
                teacherName,
                employeeId,
                subject,
                status,
                role: "teacher",
                password,
                createdAt:
                    new Date().toISOString()
            }
        );

        alert(
            "Teacher Added Successfully\n\nPassword : " +
            password
        );

        document.getElementById("teacherName").value = "";
        document.getElementById("employeeId").value = "";
        document.getElementById("subject").value = "";

        loadTeachers();

    } catch (error) {

        console.error(error);
        alert("Failed To Add Teacher");
    }
}

async function loadTeachers() {

    const table =
        document.getElementById("teacherTable");

    try {

        const snapshot =
            await getDocs(
                collection(db, "teachers")
            );

        table.innerHTML = "";

        if (snapshot.empty) {

            table.innerHTML = `
            <tr>
                <td colspan="6">
                    No Teachers Found
                </td>
            </tr>
            `;

            return;
        }

        snapshot.forEach((teacherDoc) => {

            const teacher =
                teacherDoc.data();

            table.innerHTML += `

            <tr>

                <td>${teacher.teacherName}</td>

                <td>${teacher.employeeId}</td>

                <td>${teacher.subject}</td>

                <td>${teacher.status}</td>

                <td>${teacher.password}</td>

                <td>

                    <button
                    class="reset-btn"
                    onclick="resetPassword('${teacherDoc.id}','${teacher.employeeId}')">
                    Reset
                    </button>

                    <button
                    class="delete-btn"
                    onclick="deleteTeacher('${teacherDoc.id}')">
                    Delete
                    </button>

                </td>

            </tr>

            `;
        });

    } catch (error) {

        console.error(error);

        table.innerHTML = `
        <tr>
            <td colspan="6">
                Failed To Load Teachers
            </td>
        </tr>
        `;
    }
}

async function deleteTeacher(id) {

    if (
        !confirm(
            "Delete Teacher?"
        )
    ) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "teachers", id)
        );

        loadTeachers();

    } catch (error) {

        console.error(error);
    }
}

async function resetPassword(
    id,
    employeeId
) {

    const newPassword =
        "AHPS" + employeeId + "@2026";

    try {

        await updateDoc(
            doc(db, "teachers", id),
            {
                password:
                    newPassword
            }
        );

        alert(
            "Password Reset\n\n" +
            newPassword
        );

        loadTeachers();

    } catch (error) {

        console.error(error);
    }
}

loadTeachers();
