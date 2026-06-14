import * as ImagePicker from "expo-image-picker";
import {
  obtenerPerfilUsuario,
  guardarPerfilUsuario,
  obtenerLogs,
} from "../services/api";
import { getCurrentUserId } from "../services/FirebaseService";
import OfflineService from "../services/OfflineService";

class ProfileViewModel {
  async loadForCurrentUser() {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { profile: null, logs: [], workoutsData: { labels: [], datasets: [{ data: [] }] }, totalSeconds: 0 };

      const profile = (await obtenerPerfilUsuario(userId)) || {
        nombre: "",
        edad: "",
        peso: "",
        talla: "",
        fotoUrl: "",
      };
      let logs = await OfflineService.listTrainingLogs(userId);
      if (!logs.length) {
        logs = (await obtenerLogs(userId)) || [];
        await OfflineService.mergeRemoteTrainingLogs(userId, logs);
        logs = await OfflineService.listTrainingLogs(userId);
      }
      const workoutsData = this.workoutsPerDay(logs);
      const totalSeconds = this.totalTime(logs);

      return { profile, logs, workoutsData, totalSeconds };
    } catch (error) {
      console.error("Error loading profile data:", error);
      return { profile: null, logs: [], workoutsData: { labels: [], datasets: [{ data: [] }] }, totalSeconds: 0 };
    }
  }

  async pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        return `data:image/jpeg;base64,${result.assets[0].base64}`;
      }
      return null;
    } catch (error) {
      console.error("Error picking image:", error);
      return null;
    }
  }

  async saveProfile(profile) {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("Usuario no autenticado");
      const datosAGuardar = { ...profile, idUsuario: userId };
      await guardarPerfilUsuario(userId, datosAGuardar);
      return { success: true };
    } catch (error) {
      console.error("Error saving profile:", error);
      return { success: false, message: error.message || "Error saving profile" };
    }
  }

  workoutsPerDay(logs) {
    const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const conteo = Array(7).fill(0);
    logs.forEach((log) => {
      try {
        const dia = new Date(log.date).getDay();
        conteo[dia]++;
      } catch (e) {
        // ignore malformed dates
      }
    });
    return { labels: dias, datasets: [{ data: conteo }] };
  }

  totalTime(logs) {
    return logs.reduce((total, log) => {
      try {
        const [min, sec] = log.duration.split(":").map(Number);
        return total + min * 60 + sec;
      } catch (e) {
        return total;
      }
    }, 0);
  }

  formatMMSS(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

export default new ProfileViewModel();

