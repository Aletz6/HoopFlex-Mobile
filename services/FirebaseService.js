import { auth } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

/**
 * Iniciar sesión con email y contraseña
 */
export const loginUser = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

/**
 * Registrar un nuevo usuario
 */
export const registerUser = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

/**
 * Cerrar sesión
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener el token JWT del usuario autenticado
 */
export async function getFirebaseToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  } else {
    throw new Error("Usuario no autenticado");
  }
}

/**
 * Obtener el UID del usuario autenticado
 */
export function getCurrentUserId() {
  const user = auth.currentUser;
  return user?.uid || null;
}
