// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyC6Bb36EBk_K9vG7Eg9FKbpIxuxV_PyMBw",
  authDomain: "fsociety254-1fd3e.firebaseapp.com",
  projectId: "fsociety254-1fd3e",
  storageBucket: "fsociety254-1fd3e.firebasestorage.app",
  messagingSenderId: "1086842734651",
  appId: "1:1086842734651:web:9424c5e8495c210156b41e",
  measurementId: "G-LB9QCVXS76"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Authentication state listener
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User authenticated:", user.uid);
    } else {
        // Sign in anonymously
        auth.signInAnonymously().catch(error => {
            console.error("Authentication error:", error);
        });
    }
});

// Make available globally for app.js
window.fsocietyApp = {
    db: db,
    auth: auth,
    firebase: firebase
};