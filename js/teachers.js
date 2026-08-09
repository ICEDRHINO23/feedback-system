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

    if (!table) {
        console.error("teacherTable element not found");
        return;
    }

    try {

        console.log("Loading teachers...");

        const snapshot =
            await getDocs(
                collection(db, "teachers")
            );

        console.log(
            "Teachers loaded:",
            snapshot.size
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

            const teacherName =
                teacher.teacherName || "-";

            const employeeId =
                teacher.employeeId || "-";

            const subject =
                teacher.subject || "-";

            const status =
                teacher.status || "inactive";

            const password =
                teacher.password || "-";


            table.innerHTML += `

                <tr>

                    <td>
                        ${teacherName}
                    </td>

                    <td>
                        ${employeeId}
                    </td>

                    <td>
                        ${subject}
                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>
                        ${password}
                    </td>

                    <td>

                        <button
                            class="reset-btn"
                            onclick="resetPassword(
                                '${teacherDoc.id}',
                                '${employeeId}'
                            )">
                            Reset
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteTeacher(
                                '${teacherDoc.id}'
                            )">
                            Delete
                        </button>

                    </td>

                </tr>

            `;
        });

    }
    catch (error) {

        console.error(
            "TEACHER LOAD ERROR:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="6">

                    <strong>
                        Failed To Load Teachers
                    </strong>

                    <br><br>

                    ${error.code || "Unknown Error"}

                    <br>

                    ${error.message || error}

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
