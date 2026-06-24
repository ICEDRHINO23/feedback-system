import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.teacherLogin = async function () {

    try {

        const employeeId =
            document.getElementById(
                "employeeId"
            ).value.trim();

        const password =
            document.getElementById(
                "teacherPassword"
            ).value.trim();

        if (
            !employeeId ||
            !password
        ) {

            alert(
                "Please enter Employee ID and Password"
            );

            return;
        }

        const snapshot =
            await getDocs(
                collection(db, "teachers")
            );

        let teacherFound = false;
        let teacherData = null;
        let teacherDocId = null;

        snapshot.forEach(doc => {

            const teacher =
                doc.data();

            if (
                String(
                    teacher.employeeId
                ) === String(employeeId)
            ) {

                teacherFound = true;
                teacherData = teacher;
                teacherDocId = doc.id;
            }

        });

        if (!teacherFound) {

            alert(
                "Teacher Not Found"
            );

            return;
        }

        if (
            teacherData.password !==
            password
        ) {

            alert(
                "Invalid Password"
            );

            return;
        }

        if (
            teacherData.status !==
            "active"
        ) {

            alert(
                "Account Disabled"
            );

            return;
        }

        localStorage.setItem(
            "role",
            "teacher"
        );

        localStorage.setItem(
            "teacherId",
            teacherDocId
        );

        localStorage.setItem(
            "employeeId",
            teacherData.employeeId
        );

        localStorage.setItem(
            "teacherName",
            teacherData.teacherName
        );

        localStorage.setItem(
            "teacherSubject",
            teacherData.subject
        );

        alert(
            "Login Successful"
        );

        window.location.href =
            "teacher-dashboard.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Login Failed"
        );
    }

};
