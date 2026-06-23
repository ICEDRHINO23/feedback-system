
import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadClasses(selectId){

    const select =
        document.getElementById(selectId);

    if(!select) return;

    const configRef =
        doc(db,"settings","config");

    const configSnap =
        await getDoc(configRef);

    if(!configSnap.exists()) return;

    const classes =
        configSnap.data().classes || [];

    select.innerHTML =
        '<option value="">Select Class</option>';

    classes.forEach(cls => {

        select.innerHTML +=
        `<option value="${cls}">
            ${cls}
        </option>`;
    });
}

export async function loadSections(selectId){

    const select =
        document.getElementById(selectId);

    if(!select) return;

    const configRef =
        doc(db,"settings","config");

    const configSnap =
        await getDoc(configRef);

    if(!configSnap.exists()) return;

    const sections =
        configSnap.data().sections || [];

    select.innerHTML =
        '<option value="">Select Section</option>';

    sections.forEach(sec => {

        select.innerHTML +=
        `<option value="${sec}">
            ${sec}
        </option>`;
    });
}

export async function getSettings(){

    const configRef =
        doc(db,"settings","config");

    const configSnap =
        await getDoc(configRef);

    if(!configSnap.exists())
        return null;

    return configSnap.data();
}
