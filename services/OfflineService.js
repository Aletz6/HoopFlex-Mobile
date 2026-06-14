import { getDatabase } from "./database";

function makeLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRemoteLog(log) {
  const remoteId = log?._id?.$oid || log?._id || log?.id;
  if (!remoteId) return null;

  return {
    ...log,
    id: remoteId,
  };
}

function getRoutineId(routine) {
  return routine?.id || routine?.localId || routine?._id?.$oid || routine?._id;
}

function normalizeRemoteRoutine(routine) {
  const remoteId = getRoutineId(routine);
  if (!remoteId) return null;

  return {
    ...routine,
    _id: remoteId,
    id: routine.id || remoteId,
  };
}

const OfflineService = {
  async initialize() {
    await getDatabase();
  },

  async saveTrainingLog(userId, log) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = log.id || makeLocalId("log");
    const payload = { ...log, id, localId: id };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `
          INSERT OR REPLACE INTO training_logs
            (id, user_id, payload_json, updated_at, deleted, sync_status)
          VALUES (?, ?, ?, ?, 0, 'pending')
        `,
        [id, userId, JSON.stringify(payload), now]
      );

      await db.runAsync(
        `
          INSERT OR REPLACE INTO outbox
            (id, entity_type, entity_id, operation, payload_json, created_at, attempts)
          VALUES (?, 'training_log', ?, 'upsert', ?, ?, 0)
        `,
        [makeLocalId("outbox"), id, JSON.stringify(payload), now]
      );
    });

    return payload;
  },

  async listTrainingLogs(userId) {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `
        SELECT payload_json
        FROM training_logs
        WHERE user_id = ? AND deleted = 0
        ORDER BY updated_at DESC
      `,
      [userId]
    );

    return rows
      .map((row) => {
        try {
          return JSON.parse(row.payload_json);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  },

  async saveRoutine(userId, routine) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = getRoutineId(routine) || makeLocalId("routine");
    const payload = {
      ...routine,
      _id: id,
      id: routine.id || id,
      localId: routine.localId || id,
      idUsuario: routine.idUsuario || userId,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `
          INSERT OR REPLACE INTO routines
            (id, user_id, category, payload_json, updated_at, deleted, sync_status)
          VALUES (?, ?, ?, ?, ?, 0, 'pending')
        `,
        [id, userId, payload.category || "Custom", JSON.stringify(payload), now]
      );

      await db.runAsync(
        `
          INSERT OR REPLACE INTO outbox
            (id, entity_type, entity_id, operation, payload_json, created_at, attempts)
          VALUES (?, 'routine', ?, 'upsert', ?, ?, 0)
        `,
        [makeLocalId("outbox"), id, JSON.stringify(payload), now]
      );
    });

    return payload;
  },

  async listRoutines(userId) {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `
        SELECT payload_json
        FROM routines
        WHERE deleted = 0
          AND (
            category != 'Custom'
            OR user_id = ?
            OR user_id IS NULL
          )
        ORDER BY updated_at DESC
      `,
      [userId]
    );

    return rows
      .map((row) => {
        try {
          return JSON.parse(row.payload_json);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  },

  async markRoutineDeleted(userId, id) {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync(
        `
          SELECT payload_json, sync_status
          FROM routines
          WHERE id = ? AND (user_id = ? OR user_id IS NULL)
        `,
        [id, userId]
      );

      const payload = row?.payload_json ? JSON.parse(row.payload_json) : { id };
      const remoteId = payload?.remoteId || payload?._id?.$oid || payload?._id;

      if (row?.sync_status === "pending" && (!remoteId || remoteId === id)) {
        await db.runAsync("DELETE FROM routines WHERE id = ?", [id]);
        await db.runAsync("DELETE FROM outbox WHERE entity_type = 'routine' AND entity_id = ?", [id]);
        return;
      }

      await db.runAsync(
        `
          UPDATE routines
          SET deleted = 1, sync_status = 'pending', updated_at = ?
          WHERE id = ? AND (user_id = ? OR user_id IS NULL)
        `,
        [now, id, userId]
      );

      await db.runAsync(
        `
          INSERT OR REPLACE INTO outbox
            (id, entity_type, entity_id, operation, payload_json, created_at, attempts)
          VALUES (?, 'routine', ?, 'delete', ?, ?, 0)
        `,
        [makeLocalId("outbox"), id, JSON.stringify(payload), now]
      );
    });
  },

  async markTrainingLogDeleted(userId, id) {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync(
        `
          SELECT payload_json
          FROM training_logs
          WHERE id = ? AND user_id = ?
        `,
        [id, userId]
      );

      const payload = row?.payload_json ? JSON.parse(row.payload_json) : { id };

      await db.runAsync(
        `
          UPDATE training_logs
          SET deleted = 1, sync_status = 'pending', updated_at = ?
          WHERE id = ? AND user_id = ?
        `,
        [now, id, userId]
      );

      await db.runAsync(
        `
          INSERT OR REPLACE INTO outbox
            (id, entity_type, entity_id, operation, payload_json, created_at, attempts)
          VALUES (?, 'training_log', ?, 'delete', ?, ?, 0)
        `,
        [makeLocalId("outbox"), id, JSON.stringify(payload), now]
      );
    });
  },

  async getPendingChanges() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `
        SELECT id, entity_type, entity_id, operation, payload_json, created_at, attempts
        FROM outbox
        ORDER BY created_at ASC
      `
    );

    return rows.map((row) => ({
      ...row,
      payload: JSON.parse(row.payload_json),
    }));
  },

  async getPendingSummary() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `
        SELECT entity_type, COUNT(*) AS total
        FROM outbox
        GROUP BY entity_type
      `
    );

    return rows.reduce(
      (summary, row) => {
        const total = Number(row.total) || 0;
        summary.total += total;

        if (row.entity_type === "training_log") {
          summary.logs += total;
        } else if (row.entity_type === "routine") {
          summary.routines += total;
        }

        return summary;
      },
      { total: 0, logs: 0, routines: 0 }
    );
  },

  async markChangesSynced(changeIds) {
    if (!changeIds.length) return;

    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const id of changeIds) {
        const change = await db.getFirstAsync(
          `
            SELECT entity_type, entity_id, operation
            FROM outbox
            WHERE id = ?
          `,
          [id]
        );

        if (change?.entity_type === "training_log") {
          if (change.operation === "delete") {
            await db.runAsync("DELETE FROM training_logs WHERE id = ?", [change.entity_id]);
          } else {
            await db.runAsync(
              `
                UPDATE training_logs
                SET sync_status = 'synced'
                WHERE id = ?
              `,
              [change.entity_id]
            );
          }
        }

        if (change?.entity_type === "routine") {
          if (change.operation === "delete") {
            await db.runAsync("DELETE FROM routines WHERE id = ?", [change.entity_id]);
          } else {
            await db.runAsync(
              `
                UPDATE routines
                SET sync_status = 'synced'
                WHERE id = ?
              `,
              [change.entity_id]
            );
          }
        }

        await db.runAsync("DELETE FROM outbox WHERE id = ?", [id]);
      }
    });
  },

  async attachRemoteTrainingLogId(localId, remoteId) {
    if (!localId || !remoteId) return;

    const db = await getDatabase();
    const row = await db.getFirstAsync(
      `
        SELECT payload_json
        FROM training_logs
        WHERE id = ?
      `,
      [localId]
    );

    if (!row?.payload_json) return;

    const payload = JSON.parse(row.payload_json);
    const nextPayload = {
      ...payload,
      _id: remoteId,
      remoteId,
    };

    await db.runAsync(
      `
        UPDATE training_logs
        SET payload_json = ?
        WHERE id = ?
      `,
      [JSON.stringify(nextPayload), localId]
    );
  },

  async attachRemoteRoutineId(localId, remoteId) {
    if (!localId || !remoteId) return;

    const db = await getDatabase();
    const row = await db.getFirstAsync(
      `
        SELECT payload_json
        FROM routines
        WHERE id = ?
      `,
      [localId]
    );

    if (!row?.payload_json) return;

    const payload = JSON.parse(row.payload_json);
    const nextPayload = {
      ...payload,
      _id: remoteId,
      remoteId,
    };

    await db.runAsync(
      `
        UPDATE routines
        SET payload_json = ?
        WHERE id = ?
      `,
      [JSON.stringify(nextPayload), localId]
    );
  },

  async bumpChangeAttempts(changeIds) {
    if (!changeIds.length) return;

    const db = await getDatabase();
    for (const id of changeIds) {
      await db.runAsync(
        `
          UPDATE outbox
          SET attempts = attempts + 1
          WHERE id = ?
        `,
        [id]
      );
    }
  },

  async mergeRemoteTrainingLogs(userId, logs) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const normalizedLogs = logs.map(normalizeRemoteLog).filter(Boolean);

    await db.withTransactionAsync(async () => {
      for (const log of normalizedLogs) {
        await db.runAsync(
          `
            INSERT OR REPLACE INTO training_logs
              (id, user_id, payload_json, updated_at, deleted, sync_status)
            VALUES (?, ?, ?, ?, 0, 'synced')
          `,
          [log.id, userId, JSON.stringify(log), log.updated_at || now]
        );
      }
    });
  },

  async mergeRemoteRoutines(userId, routines) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const normalizedRoutines = routines.map(normalizeRemoteRoutine).filter(Boolean);

    await db.withTransactionAsync(async () => {
      for (const routine of normalizedRoutines) {
        const routineUserId = routine.idUsuario || null;
        const isVisibleCustom = routine.category !== "Custom" || routineUserId === userId;
        if (!isVisibleCustom) continue;

        await db.runAsync(
          `
            INSERT OR REPLACE INTO routines
              (id, user_id, category, payload_json, updated_at, deleted, sync_status)
            VALUES (?, ?, ?, ?, ?, 0, 'synced')
          `,
          [
            getRoutineId(routine),
            routineUserId,
            routine.category || "Custom",
            JSON.stringify(routine),
            routine.updated_at || now,
          ]
        );
      }
    });
  },

  async getLastSyncAt() {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      `
        SELECT value
        FROM sync_state
        WHERE key = 'training_logs_last_sync_at'
      `
    );

    return row?.value || null;
  },

  async setLastSyncAt(value) {
    const db = await getDatabase();
    await db.runAsync(
      `
        INSERT OR REPLACE INTO sync_state (key, value)
        VALUES ('training_logs_last_sync_at', ?)
      `,
      [value]
    );
  },
};

export default OfflineService;
