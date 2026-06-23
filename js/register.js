import { db } from "./firebase-config.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    loadClasses,
    loadSections
} from "./utils.js";

// Load classes and sections from Firebase
loadClasses("studentClass");
loadSections("section");

window.registerStudent = async function () {

    const name = document.getElementById("name").value.trim();
    const studentClass = document.getElementById("studentClass").value;
    const section = document.getElementById("section").value;
    const rollNo = document.getElementById("rollNo").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (
        !name ||
        !studentClass ||
        !section ||
        !rollNo ||
        !password ||
        !confirmPassword
    ) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    try {

        await addDoc(
            collection(db, "students"),
            {
                name: name,
                class: studentClass,
                section: section,
                rollNo: rollNo,
                password: password,
                academicyear: "2026-27",
                accountExpiry: "2027-03-30",
                status: "active",
                lastlogin: ""
            }
        );

        alert("Registration Successful");

        window.location.href = "login.html";

    } catch (error) {

        console.error(error);
        alert("Registration Failed");

    }
};
