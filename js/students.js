import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allStudents = [];

async function loadStudents() {

    const tbody = document.getElementById("studentTable");

    if (!tbody) return;

    try {

        const snapshot = await getDocs(collection(db, "students"));

        allStudents = [];

        snapshot.forEach((studentDoc) => {

            allStudents.push({
                id: studentDoc.id,
                ...studentDoc.data()
            });

        });

        renderStudents(allStudents);

        loadClassFilter();

        loadSectionFilter();

    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
        <tr>
            <td colspan="7">
                Error Loading Students
            </td>
        </tr>`;
    }

}

function renderStudents(students) {

    const tbody = document.getElementById("studentTable");

    tbody.innerHTML = "";

    if (students.length === 0) {

        tbody.innerHTML = `
        <tr>
            <td colspan="7">
                No Students Found
            </td>
        </tr>`;

        return;
    }

    students.forEach(student => {

        tbody.innerHTML += `

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
                    onclick="toggleStudentStatus('${student.id}','${student.status || "active"}')">

                    ${student.status || "active"}

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

function loadClassFilter() {

    const filter = document.getElementById("classFilter");

    if (!filter) return;

    filter.innerHTML = `<option value="">All Classes</option>`;

    const classes = [...new Set(allStudents.map(s => s.class))].sort();

    classes.forEach(cls => {

        if (!cls) return;

        filter.innerHTML += `
            <option value="${cls}">
                ${cls}
            </option>`;
    });

}

function loadSectionFilter() {

    const filter = document.getElementById("sectionFilter");

    if (!filter) return;

    filter.innerHTML = `<option value="">All Sections</option>`;

    const sections = [...new Set(allStudents.map(s => s.section))].sort();

    sections.forEach(sec => {

        if (!sec) return;

        filter.innerHTML += `
            <option value="${sec}">
                ${sec}
            </option>`;
    });

}

function filterStudents() {

    const search = document
        .getElementById("searchBox")
        .value
        .toLowerCase();

    const selectedClass =
        document
        .getElementById("classFilter")
        .value;

    const selectedSection =
        document
        .getElementById("sectionFilter")
        .value;

    const filtered = allStudents.filter(student => {

        const searchMatch =
            (student.name || "")
            .toLowerCase()
            .includes(search);

        const classMatch =
            selectedClass === "" ||
            student.class === selectedClass;

        const sectionMatch =
            selectedSection === "" ||
            student.section === selectedSection;

        return searchMatch && classMatch && sectionMatch;

    });

    renderStudents(filtered);

}

window.toggleStudentStatus = async function(id, currentStatus){

    try{

        const newStatus =
            currentStatus === "active"
            ? "disabled"
            : "active";

        await updateDoc(doc(db,"students",id),{
            status:newStatus
        });

        loadStudents();

    }catch(error){

        console.error(error);

        alert("Unable to update status");

    }

};

window.deleteStudent = async function(id){

    if(!confirm("Delete this student?"))
        return;

    try{

        await deleteDoc(doc(db,"students",id));

        loadStudents();

    }catch(error){

        console.error(error);

        alert("Unable to delete student");

    }

};

document.getElementById("searchBox")?.addEventListener(
    "input",
    filterStudents
);

document.getElementById("classFilter")?.addEventListener(
    "change",
    filterStudents
);

document.getElementById("sectionFilter")?.addEventListener(
    "change",
    filterStudents
);

loadStudents();
