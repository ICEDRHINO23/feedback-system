```javascript
import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const studentTable =
    document.getElementById("studentTable");

const classFilter =
    document.getElementById("classFilter");

const sectionFilter =
    document.getElementById("sectionFilter");

const searchBox =
    document.getElementById("searchBox");

let studentsData = [];


// LOAD SETTINGS

async function loadSettings() {

    try {

        const configRef =
            doc(db, "settings", "config");

        const configSnap =
            await getDoc(configRef);

        if (!configSnap.exists()) return;

        const settings =
            configSnap.data();

        classFilter.innerHTML =
            '<option value="">All Classes</option>';

        sectionFilter.innerHTML =
            '<option value="">All Sections</option>';

        settings.classes.forEach(cls => {

            classFilter.innerHTML +=
                `<option value="${cls}">
                    ${cls}
                </option>`;
        });

        settings.sections.forEach(sec => {

            sectionFilter.innerHTML +=
                `<option value="${sec}">
                    ${sec}
                </option>`;
        });

    } catch(error){

        console.error(error);
    }
}


// LOAD STUDENTS

async function loadStudents() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "students")
            );

        studentsData = [];

        snapshot.forEach(docSnap => {

            studentsData.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        renderStudents(studentsData);

    } catch(error){

        console.error(error);
    }
}


// DISPLAY STUDENTS

function renderStudents(data) {

    studentTable.innerHTML = "";

    if (data.length === 0) {

        studentTable.innerHTML = `
        <tr>
            <td colspan="7">
                No Students Found
            </td>
        </tr>`;

        return;
    }

    data.forEach(student => {

        studentTable.innerHTML += `

        <tr>

            <td>${student.name || ""}</td>

            <td>${student.class || ""}</td>

            <td>${student.section || ""}</td>

            <td>${student.rollNo || ""}</td>

            <td>${student.status || "active"}</td>

            <td>${student.lastlogin || "-"}</td>

            <td>

                <button
                    class="action-btn disable"
                    onclick="toggleStatus('${student.id}')">

                    ${
                        student.status === "inactive"
                        ? "Enable"
                        : "Disable"
                    }

                </button>

                <button
                    class="action-btn delete"
                    onclick="deleteStudent('${student.id}')">

                    Delete

                </button>

            </td>

        </tr>

        `;
    });
}


// SEARCH & FILTER

function filterStudents() {

    const search =
        searchBox.value.toLowerCase();

    const cls =
        classFilter.value;

    const sec =
        sectionFilter.value;

    const filtered =
        studentsData.filter(student => {

            const matchName =
                (student.name || "")
                .toLowerCase()
                .includes(search);

            const matchRoll =
                (student.rollNo || "")
                .toLowerCase()
                .includes(search);

            const matchClass =
                cls === "" ||
                student.class === cls;

            const matchSection =
                sec === "" ||
                student.section === sec;

            return (
                (matchName || matchRoll)
                &&
                matchClass
                &&
                matchSection
            );
        });

    renderStudents(filtered);
}


// ENABLE / DISABLE

window.toggleStatus =
async function(id){

    try {

        const student =
            studentsData.find(
                s => s.id === id
            );

        const newStatus =
            student.status === "inactive"
            ? "active"
            : "inactive";

        await updateDoc(
            doc(db, "students", id),
            {
                status: newStatus
            }
        );

        loadStudents();

    } catch(error){

        console.error(error);
    }
};


// DELETE STUDENT

window.deleteStudent =
async function(id){

    const confirmDelete =
        confirm(
            "Delete this student?"
        );

    if (!confirmDelete)
        return;

    try {

        await deleteDoc(
            doc(db, "students", id)
        );

        loadStudents();

    } catch(error){

        console.error(error);
    }
};


// EVENTS

searchBox.addEventListener(
    "keyup",
    filterStudents
);

classFilter.addEventListener(
    "change",
    filterStudents
);

sectionFilter.addEventListener(
    "change",
    filterStudents
);


// INIT

loadSettings();
loadStudents();
```
