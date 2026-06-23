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

                if (admin.password === password) {

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

        console.log("Searching Student...");
        console.log("Class:", studentClass);
        console.log("Section:", section);
        console.log("Roll No:", rollNo);

        // =========================
        // DEBUG MODE
        // =========================

        const snapshot = await getDocs(
            collection(db, "students")
        );

        console.log(
            "Total Students:",
            snapshot.size
        );

        let foundStudent = null;
        let foundDocId = null;

        snapshot.forEach((studentDoc) => {

            const student =
                studentDoc.data();

            console.log(student);

            if (
                String(student.class) === String(studentClass) &&
                String(student.section) === String(section) &&
                String(student.rollNo) === String(rollNo)
            ) {

                foundStudent = student;
                foundDocId = studentDoc.id;
            }
        });

        if (!foundStudent) {

            alert("Student not found");

            return;
        }

        if (
            foundStudent.password !== password
        ) {

            alert("Invalid Password");

            return;
        }

        if (
            foundStudent.status !== "active"
        ) {

            alert(
                "Account Disabled. Contact Administrator."
            );

            return;
        }

        const today = new Date();

        const expiryDate =
            new Date(
                foundStudent.accountExpiry
            );

        if (today > expiryDate) {

            alert(
                "Academic Year Expired"
            );

            return;
        }

        await updateDoc(
            doc(
                db,
                "students",
                foundDocId
            ),
            {
                lastlogin:
                    new Date().toISOString()
            }
        );

        localStorage.setItem(
            "role",
            "student"
        );

        localStorage.setItem(
            "studentName",
            foundStudent.name
        );

        localStorage.setItem(
            "studentClass",
            foundStudent.class
        );

        localStorage.setItem(
            "studentSection",
            foundStudent.section
        );

        localStorage.setItem(
            "rollNo",
            foundStudent.rollNo
        );

        localStorage.setItem(
            "academicYear",
            foundStudent.academicyear
        );

        alert("Login Successful");

        window.location.href =
            "dashboard.html";

    }
    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        alert(
            "Login Failed. Check Console."
        );
    }
};
