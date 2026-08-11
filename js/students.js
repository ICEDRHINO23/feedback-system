import { db } from "./supabase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "./supabase-firestore.js";

let allStudents = [];

async function loadStudents() {
    const tbody = document.getElementById("studentTable");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7">Loading Students...</td></tr>`;

    try {
        const snapshot = await getDocs(collection(db, "students"));
        allStudents = [];

        snapshot.forEach((studentDoc) => {
            allStudents.push({
                id: studentDoc.id,
                ...studentDoc.data()
            });
        });

        console.log("Student Management: students loaded =", allStudents.length);

        loadClassFilter();
        loadSectionFilter();
        renderStudents(allStudents);
    } catch (error) {
        console.error("STUDENT LOAD ERROR:", error);
        tbody.innerHTML = `<tr><td colspan="7">Error Loading Students</td></tr>`;
    }
}

function renderStudents(students) {
    const tbody = document.getElementById("studentTable");
    tbody.innerHTML = "";

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">No Students Found</td></tr>`;
        return;
    }

    students.forEach(student => {
        const status = student.status || "active";

        tbody.innerHTML += `
        <tr>
            <td>${student.name || ""}</td>
            <td>${student.class || ""}</td>
            <td>${student.section || ""}</td>
            <td>${student.rollNo || ""}</td>
            <td>${status}</td>
            <td>${student.lastlogin || "-"}</td>
            <td>
                <button class="action-btn edit" onclick="openEditStudent('${student.id}')">Edit</button>
                <button class="action-btn reset" onclick="openPasswordReset('${student.id}')">Reset Password</button>
                <button class="action-btn disable" onclick="toggleStudentStatus('${student.id}','${status}')">${status === "active" ? "Disable" : "Enable"}</button>
                <button class="action-btn delete" onclick="deleteStudent('${student.id}')">Delete</button>
            </td>
        </tr>`;
    });
}

function loadClassFilter() {
    const filter = document.getElementById("classFilter");
    if (!filter) return;

    filter.innerHTML = `<option value="">All Classes</option>`;

    const classes = [...new Set(
        allStudents.map(s => s.class).filter(Boolean).map(String)
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    classes.forEach(cls => {
        filter.innerHTML += `<option value="${escapeHtml(cls)}">${escapeHtml(cls)}</option>`;
    });
}

function loadSectionFilter() {
    const filter = document.getElementById("sectionFilter");
    if (!filter) return;

    filter.innerHTML = `<option value="">All Sections</option>`;

    const sections = [...new Set(
        allStudents.map(s => s.section).filter(Boolean).map(String)
    )].sort();

    sections.forEach(sec => {
        filter.innerHTML += `<option value="${escapeHtml(sec)}">${escapeHtml(sec)}</option>`;
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function filterStudents() {
    const searchBox = document.getElementById("searchBox");
    const classFilter = document.getElementById("classFilter");
    const sectionFilter = document.getElementById("sectionFilter");

    const search = (searchBox?.value || "").trim().toLowerCase();
    const selectedClass = classFilter?.value || "";
    const selectedSection = sectionFilter?.value || "";

    const filtered = allStudents.filter(student => {
        const searchMatch =
            search === "" ||
            String(student.name || "").toLowerCase().includes(search) ||
            String(student.rollNo || "").toLowerCase().includes(search);

        const classMatch =
            selectedClass === "" ||
            String(student.class || "") === String(selectedClass);

        const sectionMatch =
            selectedSection === "" ||
            String(student.section || "") === String(selectedSection);

        return searchMatch && classMatch && sectionMatch;
    });

    renderStudents(filtered);
}

function clearFilters() {
    const searchBox = document.getElementById("searchBox");
    const classFilter = document.getElementById("classFilter");
    const sectionFilter = document.getElementById("sectionFilter");

    if (searchBox) searchBox.value = "";
    if (classFilter) classFilter.value = "";
    if (sectionFilter) sectionFilter.value = "";

    renderStudents(allStudents);
}

function fillSelect(selectId, values, currentValue) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = "";

    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        if (String(value) === String(currentValue)) option.selected = true;
        select.appendChild(option);
    });
}

window.openEditStudent = function(id) {
    const student = allStudents.find(s => s.id === id);
    if (!student) return;

    document.getElementById("editStudentId").value = id;
    document.getElementById("editName").value = student.name || "";
    document.getElementById("editRollNo").value = student.rollNo || "";
    document.getElementById("editAcademicYear").value = student.academicyear || "2026-27";
    document.getElementById("editAccountExpiry").value = student.accountExpiry || "";

    const classes = [...new Set(allStudents.map(s => s.class).filter(Boolean).map(String))];
    const sections = [...new Set(allStudents.map(s => s.section).filter(Boolean).map(String))];

    if (student.class && !classes.includes(String(student.class))) classes.push(String(student.class));
    if (student.section && !sections.includes(String(student.section))) sections.push(String(student.section));

    classes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    sections.sort();

    fillSelect("editClass", classes, student.class);
    fillSelect("editSection", sections, student.section);

    document.getElementById("editModal").style.display = "flex";
};

window.closeEditModal = function() {
    document.getElementById("editModal").style.display = "none";
};

window.saveStudentEdit = async function() {
    const id = document.getElementById("editStudentId").value;
    const name = document.getElementById("editName").value.trim();
    const studentClass = document.getElementById("editClass").value;
    const section = document.getElementById("editSection").value;
    const rollNo = document.getElementById("editRollNo").value.trim();
    const academicyear = document.getElementById("editAcademicYear").value.trim();
    const accountExpiry = document.getElementById("editAccountExpiry").value;

    if (!name || !studentClass || !section || !rollNo) {
        alert("Name, class, section and roll number are required.");
        return;
    }

    try {
        await updateDoc(doc(db, "students", id), {
            name,
            class: studentClass,
            section,
            rollNo,
            academicyear,
            accountExpiry
        });

        alert("Student details updated successfully.");
        closeEditModal();
        await loadStudents();
    } catch (error) {
        console.error("STUDENT UPDATE ERROR:", error);
        alert("Unable to update student details.");
    }
};

window.openPasswordReset = function(id) {
    const student = allStudents.find(s => s.id === id);
    if (!student) return;

    document.getElementById("resetStudentId").value = id;
    document.getElementById("resetStudentName").value = `${student.name || "Student"} | Class ${student.class || ""} | Roll ${student.rollNo || ""}`;
    document.getElementById("resetPassword").value = "";
    document.getElementById("resetPasswordConfirm").value = "";
    document.getElementById("passwordModal").style.display = "flex";
};

window.closePasswordModal = function() {
    document.getElementById("passwordModal").style.display = "none";
};

window.savePasswordReset = async function() {
    const id = document.getElementById("resetStudentId").value;
    const password = document.getElementById("resetPassword").value.trim();
    const confirmPassword = document.getElementById("resetPasswordConfirm").value.trim();

    if (!password || password.length < 4) {
        alert("Password must contain at least 4 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (!confirm("Reset this student's password?")) return;

    try {
        await updateDoc(doc(db, "students", id), { password });
        alert("Student password reset successfully.");
        closePasswordModal();
        await loadStudents();
    } catch (error) {
        console.error("PASSWORD RESET ERROR:", error);
        alert("Unable to reset password.");
    }
};

window.toggleStudentStatus = async function(id, currentStatus) {
    try {
        const newStatus = currentStatus === "active" ? "disabled" : "active";
        await updateDoc(doc(db, "students", id), { status: newStatus });
        await loadStudents();
    } catch (error) {
        console.error("STATUS UPDATE ERROR:", error);
        alert("Unable to update status");
    }
};

window.deleteStudent = async function(id) {
    if (!confirm("Delete this student?")) return;

    try {
        await deleteDoc(doc(db, "students", id));
        await loadStudents();
    } catch (error) {
        console.error("STUDENT DELETE ERROR:", error);
        alert("Unable to delete student");
    }
};

document.getElementById("searchBox")?.addEventListener("input", filterStudents);
document.getElementById("classFilter")?.addEventListener("change", filterStudents);
document.getElementById("sectionFilter")?.addEventListener("change", filterStudents);
document.getElementById("clearFilters")?.addEventListener("click", clearFilters);

// Prevent browser autofill from carrying the admin username into the student search.
window.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("searchBox");
    if (searchBox) searchBox.value = "";
});

loadStudents();
