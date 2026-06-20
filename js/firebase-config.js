import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMU2iDhUY4y6L_5f_Tn47wupyT6hcF0PA",
  authDomain: "feedback-system-477c1.firebaseapp.com",
  projectId: "feedback-system-477c1",
  storageBucket: "feedback-system-477c1.firebasestorage.app",
  messagingSenderId: "768253862075",
  appId: "1:768253862075:web:d757a34c0528da8a27499e",
  measurementId: "G-R6STTZCZBQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
