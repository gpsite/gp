// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWcu3ShnqJlxxMNlH13fp6G30exSwJniY",
    authDomain: "gprequests-cb1a2.firebaseapp.com",
    projectId: "gprequests-cb1a2",
    storageBucket: "gprequests-cb1a2.firebasestorage.app",
    messagingSenderId: "1094373870550",
    appId: "1:1094373870550:web:6fb626c84fb6aa5a713277",
    measurementId: "G-K04QTYWZJB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };