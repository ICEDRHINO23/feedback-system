import { db } from "./firebase-config.js";
import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.login = async function () {

    const admissionNo = document
        .getElementById("admissionNo")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value
        .trim();

    if (!admissionNo || !password) {
        alert("Please enter login details");
        return;
    }

    try {

        // Admin Login
       const adminsRef = collection(db, "admins");

const adminQuery = query(
    adminsRef,
    where("username", "==", admissionNo)
);

const adminSnap = await getDocs(adminQuery);

if (!adminSnap.empty) {

    const admin = adminSnap.docs[0].data();

    if (admin.password === password) {

        localStorage.setItem("role", "admin");
        localStorage.setItem("adminName", admissionNo);

        window.location.href =
            "admin/dashboard.html";

        return;
    }
}

        // Student Login
        const studentsRef = collection(db, "students");

        const q = query(
            studentsRef,
            where("admissionNo", "==", admissionNo)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert("Student not found");
            return;
        }

        const student = snapshot.docs[0].data();

        if (student.password !== password) {
            alert("Invalid password");
            return;
        }

        localStorage.setItem(
            "studentName",
            student.name
        );

        localStorage.setItem(
            "admissionNo",
            student.admissionNo
        );

        localStorage.setItem(
            "role",
            "student"
        );

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error(error);
        alert("Login failed");
    }
};
