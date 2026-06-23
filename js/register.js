import { db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.registerStudent = async function () {

    const name =
        document.getElementById("name").value.trim();

    const studentClass =
        document.getElementById("studentClass").value;

    const section =
        document.getElementById("section").value;

    const rollNo =
        document.getElementById("rollNo").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if(
        !name ||
        !studentClass ||
        !section ||
        !rollNo ||
        !password ||
        !confirmPassword
    ){
        alert("Please fill all fields");
        return;
    }

    if(password !== confirmPassword){
        alert("Passwords do not match");
        return;
    }

    try{

        const duplicateQuery = query(
            collection(db,"students"),
            where("class","==",studentClass),
            where("section","==",section),
            where("rollno","==",rollNo)
        );

        const duplicateSnap =
            await getDocs(duplicateQuery);

        if(!duplicateSnap.empty){
            alert(
                "Roll Number already registered"
            );
            return;
        }

        await addDoc(
            collection(db,"students"),
            {
                name:name,
                class:studentClass,
                section:section,
                rollno:rollNo,
                password:password,
                academicyear:"2026-27",
                accountexpiry:"2027-03-30",
                status:"active",
                lastlogin:""
            }
        );

        alert(
            "Registration Successful"
        );

        window.location.href =
            "login.html";

    }
    catch(error){

        console.error(error);

        alert(
            "Registration Failed"
        );
    }
};
