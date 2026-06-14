import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBccvRFgz6-kFjQnM_dPZCBIeGW48Fx7jY",
  authDomain: "hoopflex-f5f97.firebaseapp.com",
  projectId: "hoopflex-f5f97",
  storageBucket: "hoopflex-f5f97.appspot.com",
  messagingSenderId: "167077999574",
  appId: "1:167077999574:web:4cbd6a0b889acb28faaa77",
  measurementId: "G-NMBFPMKV0Z"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Esta función obtiene el token del usuario logueado
export async function getFirebaseToken() {
  const user = getAuth().currentUser;
  if (user) {
    return await user.getIdToken();
  }
  throw new Error("No hay usuario logueado");
}

export { auth, getAuth };
