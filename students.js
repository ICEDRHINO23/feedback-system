import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadStudents() {

    const tbody =
        document.getElementById("studentsTable");

    try {

        const snapshot =
            await getDocs(collection(db, "students"));

        tbody.innerHTML = "";

        if (snapshot.empty) {

            tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No Students Found
                </td>
            </tr>`;
            return;
        }

        snapshot.forEach(doc => {

            const student = doc.data();

            tbody.innerHTML += `
            <tr>
                <td>${student.name || ""}</td>
                <td>${student.class || ""}</td>
                <td>${student.section || ""}</td>
                <td>${student.rollNo || ""}</td>
                <td>${student.status || "active"}</td>
                <td>${student.lastlogin || "-"}</td>
                <td>Active</td>
            </tr>`;
        });

    } catch(error) {

        console.error(error);

        tbody.innerHTML = `
        <tr>
            <td colspan="7">
                Error Loading Students
            </td>
        </tr>`;
    }
}

loadStudents();
