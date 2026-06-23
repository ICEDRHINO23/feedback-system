import { db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.login = async function () {

    try {

        // =========================
        // ADMIN LOGIN
        // =========================

        const adminUser =
            document.getElementById("admissionNo");

        const adminPass =
            document.getElementById("adminPassword");

        if (
            adminUser &&
            adminPass &&
            adminUser.value.trim() !== ""
        ) {

            const username =
                adminUser.value.trim();

            const password =
                adminPass.value.trim();

            const adminQuery = query(
                collection(db, "admins"),
                where("username", "==", username)
            );

            const adminSnap =
                await getDocs(adminQuery);

            if (!adminSnap.empty) {

                const admin =
                    adminSnap.docs[0].data();

                if (
                    admin.password === password
                ) {

                    localStorage.setItem(
                        "role",
                        "admin"
                    );

                    localStorage.setItem(
                        "adminName",
                        username
                    );

                    window.location.href =
                        "admin/dashboard.html";

                    return;
                }
            }

            alert("Invalid Admin Login");
            return;
        }

        // =========================
        // STUDENT LOGIN
        // =========================

        const studentClass =
            document.getElementById("studentClass").value;

        const section =
            document.getElementById("section").value;

        const rollNo =
            document.getElementById("rollNo").value.trim();

        const password =
            document.getElementById("password").value.trim();

        if (
            !studentClass ||
            !section ||
            !rollNo ||
            !password
        ) {

            alert(
                "Please fill all login details"
            );

            return;
        }

        const studentQuery = query(
            collection(db, "students"),
            where("class", "==", studentClass),
            where("section", "==", section),
            where("rollNo", "==", rollNo)
        );

        const snapshot =
            await getDocs(studentQuery);

        if (snapshot.empty) {

            alert("Student not found");
            return;

        }

        const student =
            snapshot.docs[0].data();

        // Password Check

        if (
            student.password !== password
        ) {

            alert("Invalid Password");
            return;

        }

        // Status Check

        if (
            student.status &&
            student.status !== "active"
        ) {

            alert(
                "Account Disabled. Contact Administrator."
            );

            return;
        }

        // Expiry Check

        if (student.accountExpiry) {

            const today =
                new Date();

            const expiryDate =
                new Date(
                    student.accountExpiry
                );

            if (
                today > expiryDate
            ) {

                alert(
                    "Academic Year Expired. Contact Administrator."
                );

                return;
            }
        }

        // Update Last Login

        await updateDoc(
            doc(
                db,
                "students",
                snapshot.docs[0].id
            ),
            {
                lastlogin:
                    new Date().toLocaleString()
            }
        );

        // Save Session

        localStorage.setItem(
            "role",
            "student"
        );

        localStorage.setItem(
            "studentName",
            student.name || ""
        );

        localStorage.setItem(
            "studentClass",
            student.class || ""
        );

        localStorage.setItem(
            "studentSection",
            student.section || ""
        );

        localStorage.setItem(
            "rollNo",
            student.rollNo || ""
        );

        localStorage.setItem(
            "academicYear",
            student.academicyear || ""
        );

        alert(
            "Login Successful"
        );

        window.location.href =
            "dashboard.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Login Failed"
        );
    }
};
