import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA9aRSsJzvXvgGugzPNLg3BZ0lnv-79QiY",
  authDomain: "soulful-swings.firebaseapp.com",
  projectId: "soulful-swings",
  storageBucket: "soulful-swings.firebasestorage.app",
  messagingSenderId: "30759680599",
  appId: "1:30759680599:web:076011764ea95db60c0112",
  measurementId: "G-EDFMS740G7"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const analytics = getAnalytics(app);
