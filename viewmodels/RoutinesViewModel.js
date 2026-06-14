import NetInfo from "@react-native-community/netinfo";
import { obtenerRutinas } from "../services/api";
import { getCurrentUserId } from "../services/FirebaseService";
import OfflineService from "../services/OfflineService";
import SyncService from "../services/SyncService";
import TrainingViewModel from "./TrainingViewModel";

const EMPTY_GROUPED_ROUTINES = {
  Dribble: [],
  Shooting: [],
  Agility: [],
  Custom: [],
};

function groupRoutinesByCategory(routines, userId) {
  const grouped = {
    Dribble: [],
    Shooting: [],
    Agility: [],
    Custom: [],
  };

  routines.forEach((item) => {
    const cat = item.category;
    if (cat === "Custom" && item.idUsuario === userId) {
      grouped.Custom.push(item);
    } else if (cat === "Dribble") {
      grouped.Dribble.push(item);
    } else if (cat === "Shooting") {
      grouped.Shooting.push(item);
    } else if (cat === "Agility") {
      grouped.Agility.push(item);
    }
  });

  return grouped;
}

const RoutinesViewModel = {
  // Cargar todas las rutinas clasificadas por categoría
  getRoutinesByCategory: async (setRoutines) => {
    try {
      const grouped = await RoutinesViewModel.loadGroupedRoutines();
      setRoutines(grouped);
    } catch (err) {
      console.error("Error al cargar rutinas:", err);
    }
  },

  // Devuelve rutinas agrupadas por categoría para el usuario actual
  loadGroupedRoutines: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return EMPTY_GROUPED_ROUTINES;

      const localRoutines = await OfflineService.listRoutines(userId);
      const netState = await NetInfo.fetch();

      if (!netState.isConnected) {
        return groupRoutinesByCategory(localRoutines, userId);
      }

      try {
        const remoteRoutines = await obtenerRutinas();
        await OfflineService.mergeRemoteRoutines(userId, remoteRoutines || []);
        const refreshedRoutines = await OfflineService.listRoutines(userId);
        return groupRoutinesByCategory(refreshedRoutines, userId);
      } catch (networkError) {
        console.error("Error fetching routines from backend:", networkError);
        return groupRoutinesByCategory(localRoutines, userId);
      }
    } catch (err) {
      console.error("Error al cargar rutinas:", err);
      return EMPTY_GROUPED_ROUTINES;
    }
  },

  // Guardar una nueva rutina
  saveRoutine: async (routineObject, onSuccess) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("Usuario no autenticado");

      const savedRoutine = await OfflineService.saveRoutine(userId, routineObject);
      await SyncService.refreshPendingStatus();
      SyncService.syncNow();

      if (onSuccess) onSuccess();
      return savedRoutine;
    } catch (err) {
      console.error("Error al guardar rutina:", err);
      throw err;
    }
  },

  // Crear y validar un paso, devuelve nuevo arreglo de pasos
  createStep: (stepName, sets, reps, steps) => {
    if (!stepName || !sets || !reps) {
      return { success: false, message: "Please fill in all step fields." };
    }
    const newStep = {
      id: `${Date.now()}`,
      name: stepName,
      sets: parseInt(sets, 10),
      reps: parseInt(reps, 10),
    };
    return { success: true, steps: [...steps, newStep] };
  },

  removeStepAt: (steps, index) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    return newSteps;
  },

  // Crear rutina (valida, agrega userId y guarda)
  createRoutine: async ({ name, level, duration, message, steps }) => {
    if (!name || !level || !duration || !steps || steps.length === 0) {
      return { success: false, message: "Please fill in all fields and add at least one step." };
    }

    try {
      const userId = getCurrentUserId();
      const newRoutine = {
        idUsuario: userId,
        category: "Custom",
        exercise: {
          id: Date.now().toString(),
          name,
          level,
          duration: `${duration} min`,
          steps,
          message,
        },
      };

      await RoutinesViewModel.saveRoutine(newRoutine);
      return { success: true };
    } catch (err) {
      console.error("Error creating routine:", err);
      return { success: false, message: err.message || "Failed to save routine." };
    }
  },

  // Start a timer; returns a stop function
  startTimer: (setTime) => {
    const interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  },

  // Complete training: save log via TrainingViewModel and return result
  completeTraining: async (exercise, time) => {
    try {
      await TrainingViewModel.saveTrainingLog(exercise, time);
      const formatted = TrainingViewModel.formatTime(time);
      return { success: true, message: `You completed this training in ${formatted}!` };
    } catch (error) {
      console.error("Error completing training:", error);
      return { success: false, message: error.message || "Error completing training" };
    }
  },

  // Eliminar rutina por ID
  deleteRoutine: async (id) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("Usuario no autenticado");

      await OfflineService.markRoutineDeleted(userId, id);
      await SyncService.refreshPendingStatus();
      SyncService.syncNow();
      return { success: true };
    } catch (err) {
      console.error("Error al eliminar rutina:", err);
      return { success: false, message: err.message };
    }
  }
};
export default RoutinesViewModel;
