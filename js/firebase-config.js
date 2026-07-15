import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyDJ7WP7TCT3mZ4WKa20d-b3HSrZ0ZKn0mU",

    authDomain: "feedbacksys-e3fe0.firebaseapp.com",

    projectId: "feedbacksys-e3fe0",

    storageBucket: "feedbacksys-e3fe0.firebasestorage.app",

    messagingSenderId: "556077863051",

    appId: "1:556077863051:web:756ce5148c828b3b5e048e"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);
