import { db } from "./supabase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    updateDoc
} from "./supabase-firestore.js";

window.addTeacher = addTeacher;
window.editTeacher = editTeacher;
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
                            class="edit-btn"
                            onclick="editTeacher('${teacherDoc.id}')">
                            Edit
                        </button>

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
// ======================================
// EDIT TEACHER
// ======================================

async function editTeacher(id) {

    try {

        const teacherRef =
            doc(db, "teachers", id);

        const teacherSnap =
            await getDoc(teacherRef);

        if (!teacherSnap.exists()) {

            alert("Teacher Not Found");
            return;

        }

        const teacher =
            teacherSnap.data();


        // ==============================
        // GET UPDATED DETAILS
        // ==============================

        const teacherName =
            prompt(
                "Teacher Name:",
                teacher.teacherName || ""
            );

        if (teacherName === null) {
            return;
        }


        const employeeId =
            prompt(
                "Employee ID:",
                teacher.employeeId || ""
            );

        if (employeeId === null) {
            return;
        }


        const subject =
            prompt(
                "Subject:",
                teacher.subject || ""
            );

        if (subject === null) {
            return;
        }


        const status =
            prompt(
                "Status (active / inactive):",
                teacher.status || "active"
            );

        if (status === null) {
            return;
        }


        // ==============================
        // VALIDATION
        // ==============================

        if (
            !teacherName.trim() ||
            !employeeId.trim() ||
            !subject.trim()
        ) {

            alert(
                "Teacher Name, Employee ID and Subject are required."
            );

            return;
        }


        const cleanName =
            teacherName.trim();

        const cleanEmployeeId =
            employeeId.trim();

        const cleanSubject =
            subject.trim();

        const cleanStatus =
            status.trim().toLowerCase();


        if (
            cleanStatus !== "active" &&
            cleanStatus !== "inactive"
        ) {

            alert(
                "Status must be active or inactive."
            );

            return;
        }


        // ==============================
        // PASSWORD
        // ==============================

        let password =
            teacher.password || "";


        if (
            cleanEmployeeId !==
            String(
                teacher.employeeId || ""
            )
        ) {

            password =
                "AHPS" +
                cleanEmployeeId +
                "@2026";

        }


        // ==============================
        // UPDATE FIRESTORE
        // ==============================

        await updateDoc(
            teacherRef,
            {
                teacherName:
                    cleanName,

                employeeId:
                    cleanEmployeeId,

                subject:
                    cleanSubject,

                status:
                    cleanStatus,

                password:
                    password,

                updatedAt:
                    new Date().toISOString()
            }
        );


        alert(
            "Teacher Details Updated Successfully"
        );


        // Reload list

        loadTeachers();

    }
    catch (error) {

        console.error(
            "EDIT TEACHER ERROR:",
            error
        );

        alert(
            "Failed To Update Teacher\n\n" +
            error.message
        );

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
