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
