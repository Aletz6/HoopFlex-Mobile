import axios from "axios";
import { getFirebaseToken } from "./FirebaseService"; 

const api = axios.create({
  baseURL: "https://hoopflex-api.onrender.com", 
  timeout: 10000 
});

api.interceptors.request.use(async (config) => {
  const token = await getFirebaseToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Logs
export async function guardarLog(log) {
  const res = await api.post("/logs/", log);
  return res.data;
}

export async function obtenerLogs(idUsuario) {
  const res = await api.get(`/logs/${idUsuario}`);
  return res.data;
}

export async function eliminarLog(idLog) {
  const res = await api.delete(`/logs/${idLog}`);
  return res.data;
}

export async function pushSyncBatch(payload) {
  const res = await api.post("/sync/push", payload);
  return res.data;
}

export async function pullTrainingLogChanges({ userId, since }) {
  const res = await api.get("/sync/training-logs", {
    params: {
      userId,
      since: since || undefined,
    },
  });
  return res.data;
}

// Rutinas
export const guardarRutina = async (rutina) => {
  const res = await api.post("/routines/", rutina);
  return res.data;
}

export const obtenerRutinas = async () => {
  const res = await api.get("/routines/");
  return res.data;
}

export const obtenerRutinasUsuario = async (idUsuario) => {
  const res = await api.get(`/routines/${idUsuario}`);
  return res.data;
}

export const eliminarRutina = async (idRutina) => {
  const res = await api.delete(`/routines/${idRutina}`);
  return res.data;
}

// Achievements
export const obtenerLogrosYDesbloqueados = async (idUsuario) => {
  const res = await api.get(`/achievements/${idUsuario}`);
  return res.data;
}

// Perfil de Usuario
export const obtenerPerfilUsuario = async (idUsuario) => {
  try {
    const res = await api.get(`/perfil/${idUsuario}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return null;
  }
}

export const guardarPerfilUsuario = async (idUsuario, perfil) => {
  try {
    const res = await api.put(`/perfil/${idUsuario}`, perfil);
    return { ok: true, data: res.data };
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return { ok: false };
  }
}


export default api;

