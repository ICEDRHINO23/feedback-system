import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const academicYear =
    document.getElementById("academicYear");

const accountExpiry =
    document.getElementById("accountExpiry");

const classesBox =
    document.getElementById("classes");

const sectionsBox =
    document.getElementById("sections");

async function loadSettings(){

    try{

        const docRef =
            doc(
                db,
                "settings",
                "config"
            );

        const docSnap =
            await getDoc(docRef);

        if(docSnap.exists()){

            const data =
                docSnap.data();

            academicYear.value =
                data.academicyear || "";

            accountExpiry.value =
                data.accountExpiry || "";

            classesBox.value =
                (data.classes || [])
                .join(",");

            sectionsBox.value =
                (data.sections || [])
                .join(",");
        }

    }
    catch(error){

        console.error(error);

        alert(
            "Failed to load settings"
        );
    }
}

window.saveSettings =
async function(){

    try{

        const classes =
            classesBox.value
            .split(",")
            .map(item => item.trim())
            .filter(item => item);

        const sections =
            sectionsBox.value
            .split(",")
            .map(item => item.trim())
            .filter(item => item);

        await setDoc(
            doc(
                db,
                "settings",
                "config"
            ),
            {
                academicyear:
                    academicYear.value,

                accountExpiry:
                    accountExpiry.value,

                classes:
                    classes,

                sections:
                    sections
            }
        );

        alert(
            "Settings Saved Successfully"
        );

    }
    catch(error){

        console.error(error);

        alert(
            "Failed to save settings"
        );
    }
};

loadSettings();
