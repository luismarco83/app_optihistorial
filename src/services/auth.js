import * as Crypto from 'expo-crypto';
import { getDB } from './database';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function hashPassword(password, salt) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

export async function hayAdministrador() {
  const database = await getDB();
  const row = await database.getFirstAsync(
    `SELECT id FROM usuarios WHERE rol = 'admin' AND eliminado = 0 LIMIT 1`
  );
  return !!row;
}

export async function listarUsuarios() {
  const database = await getDB();
  return database.getAllAsync(
    `SELECT id, nombre, rol, fecha_creacion FROM usuarios WHERE eliminado = 0 ORDER BY nombre COLLATE NOCASE`
  );
}

export async function crearUsuario({ nombre, password, rol }) {
  const limpio = nombre.trim();
  const database = await getDB();
  const existe = await database.getFirstAsync(
    `SELECT id FROM usuarios WHERE eliminado = 0 AND lower(nombre) = lower(?)`,
    [limpio]
  );
  if (existe) throw new Error('Ya existe alguien con ese nombre');
  const salt = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const passwordHash = await hashPassword(password, salt);
  const usuario = {
    id: generateId(),
    nombre: limpio,
    rol: rol === 'admin' ? 'admin' : 'usuario',
    fecha_creacion: new Date().toISOString(),
  };
  await database.runAsync(
    `INSERT INTO usuarios (id, nombre, password_hash, salt, rol, fecha_creacion, eliminado)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [usuario.id, usuario.nombre, passwordHash, salt, usuario.rol, usuario.fecha_creacion]
  );
  return usuario;
}

function nuevaClave() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let texto = '';
  for (let i = 0; i < 8; i += 1) {
    texto += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `${texto.slice(0, 4)}-${texto.slice(4)}`;
}

export async function guardarClaveRecuperacion(usuarioId) {
  const clave = nuevaClave();
  const salt = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const hash = await hashPassword(clave, salt);
  const database = await getDB();
  await database.runAsync(
    `UPDATE usuarios SET recuperacion_hash = ?, recuperacion_salt = ? WHERE id = ?`,
    [hash, salt, usuarioId]
  );
  return clave;
}

export async function tieneClaveRecuperacion(usuarioId) {
  const database = await getDB();
  const row = await database.getFirstAsync(
    `SELECT recuperacion_hash FROM usuarios WHERE id = ?`,
    [usuarioId]
  );
  return !!row?.recuperacion_hash;
}

export async function restablecerConClave(clave, nuevaPassword) {
  const database = await getDB();
  const admins = await database.getAllAsync(
    `SELECT id, recuperacion_hash, recuperacion_salt FROM usuarios WHERE rol = 'admin' AND eliminado = 0 AND recuperacion_hash IS NOT NULL`
  );
  const escrita = String(clave || '').trim().toUpperCase();
  for (const admin of admins) {
    const hash = await hashPassword(escrita, admin.recuperacion_salt);
    if (hash === admin.recuperacion_hash) {
      const salt = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const passwordHash = await hashPassword(nuevaPassword, salt);
      await database.runAsync(
        `UPDATE usuarios SET password_hash = ?, salt = ? WHERE id = ?`,
        [passwordHash, salt, admin.id]
      );
      return true;
    }
  }
  return false;
}

export async function ingresar(nombre, password) {
  const database = await getDB();
  const row = await database.getFirstAsync(
    `SELECT * FROM usuarios WHERE eliminado = 0 AND lower(nombre) = lower(?)`,
    [nombre.trim()]
  );
  if (!row) return null;
  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) return null;
  return { id: row.id, nombre: row.nombre, rol: row.rol };
}
