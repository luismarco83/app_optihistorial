import { getDB } from './database';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function registrarAccion(usuario, accion, detalle) {
  if (!usuario) return;
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO auditoria (id, fecha, usuario_id, usuario_nombre, accion, detalle)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      new Date().toISOString(),
      usuario.id || null,
      usuario.nombre || 'Sin nombre',
      accion,
      detalle || null,
    ]
  );
}

export async function listarAuditoria() {
  const database = await getDB();
  return database.getAllAsync(`SELECT * FROM auditoria ORDER BY fecha DESC`);
}

export async function modificarAuditoria(id, detalle) {
  const database = await getDB();
  await database.runAsync(`UPDATE auditoria SET detalle = ? WHERE id = ?`, [detalle || null, id]);
}

export async function borrarAuditoria(id) {
  const database = await getDB();
  await database.runAsync(`DELETE FROM auditoria WHERE id = ?`, [id]);
}
