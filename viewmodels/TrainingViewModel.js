import { obtenerLogs } from "../services/api";
import { getAuth } from "firebase/auth";
import { getCurrentUserId } from "../services/FirebaseService";
import { TrainingLogModel } from "../models/TrainingLogModel";
import OfflineService from "../services/OfflineService";
import SyncService from "../services/SyncService";

class TrainingViewModel {
  async saveTrainingLog(exercise, timeInSeconds) {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const logObj = {
        idUsuario: user.uid,
        title: exercise.name || "Sin titulo",
        date: new Date().toISOString(),
        duration: this.formatTime(timeInSeconds),
        routineLevel: exercise.level || "Desconocido",
        routineCategory: exercise.category || "Desconocida",
        steps: exercise.steps || [],
      };

      const log = new TrainingLogModel(logObj);
      await OfflineService.saveTrainingLog(user.uid, log);
      await SyncService.refreshPendingStatus();
      SyncService.syncNow();

      return { success: true, queued: true };
    } catch (error) {
      console.error("Error al guardar log offline:", error);
      return { success: false, message: error.message };
    }
  }

  async loadLogsForCurrentUser() {
    try {
      const userId = getCurrentUserId();
      if (!userId) return [];

      const localLogs = await OfflineService.listTrainingLogs(userId);
      if (localLogs.length) {
        SyncService.syncNow();
        return localLogs;
      }

      try {
        const remoteLogs = (await obtenerLogs(userId)) || [];
        await OfflineService.mergeRemoteTrainingLogs(userId, remoteLogs);
        return await OfflineService.listTrainingLogs(userId);
      } catch (networkError) {
        console.error("Error fetching logs from backend:", networkError);
        return localLogs;
      }
    } catch (error) {
      console.error("Error loading training logs:", error);
      return [];
    }
  }

  async deleteLog(id) {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("Usuario no autenticado");

      await OfflineService.markTrainingLogDeleted(userId, id);
      await SyncService.refreshPendingStatus();
      SyncService.syncNow();
      return { success: true };
    } catch (error) {
      console.error("Error deleting local training log:", error);
      return { success: false, message: error.message };
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

export default new TrainingViewModel();
