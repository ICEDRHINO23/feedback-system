import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const teacherTable =
    document.getElementById(
        "teacherTable"
    );

// =========================
// ADD TEACHER
// =========================

window.addTeacher =
async function(){

    try{

        const teacherName =
            document.getElementById(
                "teacherName"
            ).value.trim();

        const employeeId =
            document.getElementById(
                "employeeId"
            ).value.trim();

        const subject =
            document.getElementById(
                "subject"
            ).value.trim();

        if(
            !teacherName ||
            !employeeId ||
            !subject
        ){
            alert(
                "Please fill all fields"
            );
            return;
        }

        const password =
            "AHPS" +
            employeeId +
            "@2026";

        await addDoc(
            collection(
                db,
                "teachers"
            ),
            {
                teacherName:
                    teacherName,

                employeeId:
                    employeeId,

                subject:
                    subject,

                password:
                    password,

                role:
                    "teacher",

                status:
                    "active",

                mustChangePassword:
                    true,

                createdAt:
                    new Date()
                    .toISOString()
            }
        );

        alert(
            "Teacher Added Successfully\n\n" +
            "Employee ID : " +
            employeeId +
            "\nPassword : " +
            password
        );

        document.getElementById(
            "teacherName"
        ).value = "";

        document.getElementById(
            "employeeId"
        ).value = "";

        document.getElementById(
            "subject"
        ).value = "";

        loadTeachers();

    }
    catch(error){

        console.error(error);

        alert(
            "Failed To Add Teacher"
        );
    }
};

// =========================
// LOAD TEACHERS
// =========================

async function loadTeachers(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "teachers"
                )
            );

        teacherTable.innerHTML =
            "";

        if(
            snapshot.empty
        ){

            teacherTable.innerHTML = `
            <tr>
                <td colspan="6">
                    No Teachers Found
                </td>
            </tr>
            `;

            return;
        }

        snapshot.forEach(
            teacherDoc => {

            const teacher =
                teacherDoc.data();

            teacherTable.innerHTML += `

            <tr>

                <td>
                    ${teacher.teacherName || ""}
                </td>

                <td>
                    ${teacher.employeeId || ""}
                </td>

                <td>
                    ${teacher.subject || ""}
                </td>

                <td>
                    ${teacher.status || "active"}
                </td>

                <td>
                    ${teacher.password || ""}
                </td>

                <td>

                    <button
                    class="reset-btn"
                    onclick="resetPassword(
                    '${teacherDoc.id}',
                    '${teacher.employeeId}'
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
    catch(error){

        console.error(error);

        teacherTable.innerHTML = `
        <tr>
            <td colspan="6">
                Error Loading Teachers
            </td>
        </tr>
        `;
    }
}

// =========================
// DELETE TEACHER
// =========================

window.deleteTeacher =
async function(id){

    if(
        !confirm(
            "Delete this teacher?"
        )
    ){
        return;
    }

    try{

        await deleteDoc(
            doc(
                db,
                "teachers",
                id
            )
        );

        alert(
            "Teacher Deleted"
        );

        loadTeachers();

    }
    catch(error){

        console.error(error);

        alert(
            "Unable To Delete Teacher"
        );
    }
};

// =========================
// RESET PASSWORD
// =========================

window.resetPassword =
async function(
    id,
    employeeId
){

    try{

        const newPassword =
            "AHPS" +
            employeeId +
            "@2026";

        await updateDoc(
            doc(
                db,
                "teachers",
                id
            ),
            {
                password:
                    newPassword,

                mustChangePassword:
                    true
            }
        );

        alert(
            "Password Reset Successfully\n\n" +
            "New Password : " +
            newPassword
        );

        loadTeachers();

    }
    catch(error){

        console.error(error);

        alert(
            "Password Reset Failed"
        );
    }
};

// =========================
// INITIAL LOAD
// =========================

loadTeachers();
