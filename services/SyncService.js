import NetInfo from "@react-native-community/netinfo";
import { getCurrentUserId } from "./FirebaseService";
import OfflineService from "./OfflineService";
import {
  eliminarLog,
  eliminarRutina,
  guardarLog,
  guardarRutina,
  pullTrainingLogChanges,
  pushSyncBatch,
} from "./api";

let unsubscribeNetInfo = null;
let syncInFlight = null;
let syncRouteWarningShown = false;
let syncApiAvailable = true;
const subscribers = new Set();
let retryTimer = null;

let syncStatus = {
  isSyncing: false,
  isConnected: true,
  pendingTotal: 0,
  pendingLogs: 0,
  pendingRoutines: 0,
  lastError: null,
};

function emitStatus(nextStatus) {
  syncStatus = { ...syncStatus, ...nextStatus };
  subscribers.forEach((listener) => listener(syncStatus));
}

async function canReachInternet() {
  const state = await NetInfo.fetch();
  const isConnected = Boolean(state.isConnected);
  emitStatus({ isConnected });
  return isConnected;
}

const SyncService = {
  async start() {
    await OfflineService.initialize();
    await this.refreshPendingStatus();

    if (!unsubscribeNetInfo) {
      unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        const isConnected = Boolean(state.isConnected);
        emitStatus({ isConnected });

        if (isConnected) {
          SyncService.syncNow();
        }
      });
    }

    if (!retryTimer) {
      retryTimer = setInterval(() => {
        if (syncStatus.pendingTotal > 0 && !syncStatus.isSyncing) {
          SyncService.syncNow();
        }
      }, 15000);
    }

    await this.syncNow();
  },

  stop() {
    if (unsubscribeNetInfo) {
      unsubscribeNetInfo();
      unsubscribeNetInfo = null;
    }

    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
  },

  subscribe(listener) {
    subscribers.add(listener);
    listener(syncStatus);
    return () => subscribers.delete(listener);
  },

  getStatus() {
    return syncStatus;
  },

  async refreshPendingStatus(extra = {}) {
    const pending = await OfflineService.getPendingSummary();
    emitStatus({
      pendingTotal: pending.total,
      pendingLogs: pending.logs,
      pendingRoutines: pending.routines,
      ...extra,
    });
  },

  async pushViaLegacyLogEndpoints(pendingChanges) {
    const acceptedIds = [];

    for (const change of pendingChanges) {
      if (change.entity_type === "training_log") {
        if (change.operation === "delete") {
          const remoteId =
            change.payload?.remoteId ||
            change.payload?._id?.$oid ||
            change.payload?._id;
          if (remoteId) {
            await eliminarLog(remoteId);
            acceptedIds.push(change.id);
          }
          continue;
        }

        const response = await guardarLog(change.payload);
        const insertedId = response?.inserted_id;
        if (insertedId) {
          await OfflineService.attachRemoteTrainingLogId(change.entity_id, insertedId);
        }
        acceptedIds.push(change.id);
      }

      if (change.entity_type === "routine") {
        if (change.operation === "delete") {
          const remoteId =
            change.payload?.remoteId ||
            change.payload?._id?.$oid ||
            change.payload?._id;
          if (remoteId) {
            await eliminarRutina(remoteId);
            acceptedIds.push(change.id);
          }
          continue;
        }

        const response = await guardarRutina(change.payload);
        const insertedId = response?.inserted_id || response?._id || response?.id;
        if (insertedId) {
          await OfflineService.attachRemoteRoutineId(change.entity_id, insertedId);
        }
        acceptedIds.push(change.id);
      }
    }

    return acceptedIds;
  },

  async syncNow() {
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      const userId = getCurrentUserId();
      if (!userId) return;
      if (!(await canReachInternet())) return;

      await this.refreshPendingStatus({ isSyncing: true, lastError: null });
      const pendingChanges = await OfflineService.getPendingChanges();
      if (pendingChanges.length) {
        try {
          if (syncApiAvailable) {
            const payload = {
              userId,
              changes: pendingChanges.map((change) => ({
                clientChangeId: change.id,
                entityType: change.entity_type,
                entityId: change.entity_id,
                operation: change.operation,
                payload: change.payload,
                createdAt: change.created_at,
              })),
            };

            const response = await pushSyncBatch(payload);
            const acceptedIds = response?.acceptedChangeIds || pendingChanges.map((change) => change.id);
            await OfflineService.markChangesSynced(acceptedIds);
          } else {
            const acceptedIds = await this.pushViaLegacyLogEndpoints(pendingChanges);
            if (acceptedIds.length) {
              await OfflineService.markChangesSynced(acceptedIds);
            }
          }
        } catch (error) {
          if (error?.response?.status === 404) {
            syncApiAvailable = false;
            if (!syncRouteWarningShown) {
              console.warn("Sync route /sync/push is not available. Falling back to legacy log endpoints.");
              syncRouteWarningShown = true;
            }

            try {
              const acceptedIds = await this.pushViaLegacyLogEndpoints(pendingChanges);
              if (acceptedIds.length) {
                await OfflineService.markChangesSynced(acceptedIds);
              }
            } catch (legacyError) {
              await OfflineService.bumpChangeAttempts(pendingChanges.map((change) => change.id));
              await this.refreshPendingStatus({
                lastError: legacyError.message || "Legacy sync failed",
              });
              console.error("Error syncing through legacy log endpoints:", legacyError);
              return;
            }
          } else {
            await OfflineService.bumpChangeAttempts(pendingChanges.map((change) => change.id));
            await this.refreshPendingStatus({
              lastError: error.message || "Push sync failed",
            });
            console.error("Error pushing offline changes:", error);
            return;
          }
        }
      }

      if (syncApiAvailable) {
        try {
          const since = await OfflineService.getLastSyncAt();
          const response = await pullTrainingLogChanges({ userId, since });
          await OfflineService.mergeRemoteTrainingLogs(userId, response?.logs || []);
          await OfflineService.setLastSyncAt(response?.serverTime || new Date().toISOString());
        } catch (error) {
          if (error?.response?.status === 404) {
            syncApiAvailable = false;
            if (!syncRouteWarningShown) {
              console.warn("Sync route /sync/training-logs is not available on the current backend instance.");
              syncRouteWarningShown = true;
            }
          } else {
            console.error("Error pulling remote training logs:", error);
          }
        }
      }
    })();

    try {
      await syncInFlight;
    } finally {
      await this.refreshPendingStatus({ isSyncing: false });
      syncInFlight = null;
    }
  },
};

export default SyncService;
