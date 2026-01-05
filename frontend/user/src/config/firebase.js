// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2P6umZ3qfEwHhkG-yNcfL1hfE6Mgt6b0",
  authDomain: "ecommerce-c02c2.firebaseapp.com",
  projectId: "ecommerce-c02c2",
  storageBucket: "ecommerce-c02c2.firebasestorage.app",
  messagingSenderId: "1043403458086",
  appId: "1:1043403458086:web:7f48e1dcc3c92a244088e7",
  measurementId: "G-QWYQYLQBEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };

