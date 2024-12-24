// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and Google Auth Provider
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();