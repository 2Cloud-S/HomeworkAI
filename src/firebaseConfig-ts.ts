// firebaseConfig-ts.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDG8LAV3MHjmFXDZShaYu3eRxLsXCuXtXs",
  authDomain: "studymonkey-7fe8b.firebaseapp.com",
  projectId: "studymonkey-7fe8b",
  storageBucket: "studymonkey-7fe8b.appspot.com",
  messagingSenderId: "74038524822",
  appId: "1:74038524822:web:4c3217b21e14f1be3d9475",
  measurementId: "G-TG0EDZTSWX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider)
    .catch((error) => {
      console.error('Google Sign-In Error:', error);
      throw error;
    });
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      console.error('Email Sign-In Error:', error);
      throw error;
    });
};

export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      console.error('Email Sign-Up Error:', error);
      throw error;
    });
};

export const signOut = () => {
  return auth.signOut()
    .catch((error) => {
      console.error('Sign-Out Error:', error);
      throw error;
    });
};
