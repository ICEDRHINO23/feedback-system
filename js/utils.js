import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadClasses(selectId) {

    console.log("Loading Classes...");

    const select = document.getElementById(selectId);

    const snap = await getDoc(
        doc(db, "settings", "config")
    );

    console.log("Document Exists:", snap.exists());

    if (!snap.exists()) return;

    console.log("Data:", snap.data());

    const classes = snap.data().classes || [];

    select.innerHTML =
        '<option value="">Select Class</option>';

    classes.forEach(cls => {
        select.innerHTML +=
            `<option value="${cls}">${cls}</option>`;
    });
}

export async function loadSections(selectId) {

    const select = document.getElementById(selectId);

    const snap = await getDoc(
        doc(db, "settings", "config")
    );

    if (!snap.exists()) return;

    const sections = snap.data().sections || [];

    select.innerHTML =
        '<option value="">Select Section</option>';

    sections.forEach(sec => {
        select.innerHTML +=
            `<option value="${sec}">${sec}</option>`;
    });
}
