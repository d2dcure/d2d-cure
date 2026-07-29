// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Add SDKs for Firebase products that you want to use:
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKweu4KTh7idLT1dP5RvAiuBO9mAD7-WU",
  authDomain: "d2dcure-3f3df.firebaseapp.com",
  projectId: "d2dcure-3f3df",
  storageBucket: "d2dcure-3f3df.appspot.com",
  messagingSenderId: "796422843294",
  appId: "1:796422843294:web:afee4bd408f54b1be4048f",
  measurementId: "G-QH1YCERBND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);