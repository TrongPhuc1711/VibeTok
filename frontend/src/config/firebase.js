import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAgrXLTQ_sMf_T4GXOk9XRN-0MJU5fFh0g",
  authDomain: "vibetok-99999.firebaseapp.com",
  projectId: "vibetok-99999",
  storageBucket: "vibetok-99999.firebasestorage.app",
  messagingSenderId: "832702188257",
  appId: "1:832702188257:web:a3d0c36ff8fc75c5e245a0",
  measurementId: "G-MDQEW6MH7Y"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo Auth
export const auth = getAuth(app);
export default app;
