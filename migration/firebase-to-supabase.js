import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { supabase } from "../js/supabase-config.js";

const firebaseConfig = {
    apiKey: "AIzaSyDJ7WP7TCT3mZ4WKa20d-b3HSrZ0ZKn0mU",
    authDomain: "feedbacksys-e3fe0.firebaseapp.com",
    projectId: "feedbacksys-e3fe0",
    storageBucket: "feedbacksys-e3fe0.firebasestorage.app",
    messagingSenderId: "556077863051",
    appId: "1:556077863051:web:756ce5148c828b3b5e048e"
};

const firebaseApp = initializeApp(firebaseConfig, "ahps-migration");
const firebaseDb = getFirestore(firebaseApp);
const collections = ["admins", "students", "teachers", "settings", "exams", "questions", "results"];
const logBox = document.getElementById("log");
const startButton = document.getElementById("start");

function log(message) {
    logBox.textContent += `\n${message}`;
    logBox.scrollTop = logBox.scrollHeight;
}

function normalize(value) {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map(normalize);
    if (typeof value === "object") {
        if (typeof value.toDate === "function") return value.toDate().toISOString();
        if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
        const output = {};
        for (const [key, item] of Object.entries(value)) output[key] = normalize(item);
        return output;
    }
    return value;
}

async function migrateCollection(name) {
    log(`Reading Firebase collection: ${name} ...`);
    const snapshot = await getDocs(collection(firebaseDb, name));
    const rows = snapshot.docs.map(item => ({ id: item.id, ...normalize(item.data()) }));
    log(`  Found ${rows.length} document(s).`);
    if (!rows.length) return;

    const { error } = await supabase.from(name).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`${name}: ${error.message}`);
    log(`  Imported ${rows.length} document(s) into Supabase.${name}`);
}

async function migrate() {
    startButton.disabled = true;
    logBox.textContent = "Starting migration...";
    try {
        const { error } = await supabase.from("settings").select("id").limit(1);
        if (error) throw new Error(`Supabase connection/schema check failed: ${error.message}`);

        for (const name of collections) await migrateCollection(name);
        log("\nMigration completed successfully.");
        log("Verify counts in Supabase before switching the live site.");
    } catch (error) {
        console.error(error);
        log(`\nMIGRATION FAILED: ${error.message}`);
        log("No Firebase data is deleted by this tool.");
    } finally {
        startButton.disabled = false;
    }
}

startButton.addEventListener("click", migrate);
