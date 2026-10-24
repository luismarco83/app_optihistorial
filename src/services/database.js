import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDB() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('optihistorial.db');
  await initTables();
  return db;
}

async function initTables() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS pacientes (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      edad INTEGER,
      notas TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      sincronizado INTEGER DEFAULT 0,
      eliminado INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS consultas (
      id TEXT PRIMARY KEY NOT NULL,
      paciente_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      od_esfera REAL,
      od_cilindro REAL,
      od_eje INTEGER,
      od_adicion REAL,
      oi_esfera REAL,
      oi_cilindro REAL,
      oi_eje INTEGER,
      oi_adicion REAL,
      dp REAL,
      av_od TEXT,
      av_oi TEXT,
      tipo_lente TEXT,
      observaciones TEXT,
      foto_receta_path TEXT,
      fecha_creacion TEXT NOT NULL,
      sincronizado INTEGER DEFAULT 0,
      eliminado INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id TEXT PRIMARY KEY NOT NULL,
      paciente_id TEXT NOT NULL,
      consulta_id TEXT,
      fecha_venta TEXT NOT NULL,
      producto TEXT NOT NULL,
      marca TEXT,
      material TEXT,
      tratamientos TEXT,
      costo REAL NOT NULL,
      estado TEXT NOT NULL,
      notas TEXT,
      fecha_creacion TEXT NOT NULL,
      sincronizado INTEGER DEFAULT 0,
      eliminado INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre);
    CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
    CREATE INDEX IF NOT EXISTS idx_ventas_paciente ON ventas(paciente_id);
  `);
}

// ========== PACIENTES ==========

function normalizeText(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getPacientes(busqueda = '') {
  const database = await getDB();
  const all = await database.getAllAsync(
    `SELECT * FROM pacientes WHERE eliminado = 0 ORDER BY nombre ASC`
  );
  if (!busqueda.trim()) return all;

  const q = normalizeText(busqueda);
  return all.filter((p) => {
    const nombre = normalizeText(p.nombre);
    const telefono = normalizeText(p.telefono);
    return nombre.includes(q) || telefono.includes(q);
  });
}

export async function getPacienteById(id) {
  const database = await getDB();
  return await database.getFirstAsync(
    `SELECT * FROM pacientes WHERE id = ? AND eliminado = 0`,
    [id]
  );
}

export async function insertPaciente(paciente) {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO pacientes (id, nombre, telefono, email, edad, notas, fecha_creacion, fecha_actualizacion, sincronizado, eliminado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      paciente.id,
      paciente.nombre,
      paciente.telefono || null,
      paciente.email || null,
      paciente.edad || null,
      paciente.notas || null,
      paciente.fecha_creacion,
      paciente.fecha_actualizacion,
      0,
      0,
    ]
  );
}

export async function updatePaciente(paciente) {
  const database = await getDB();
  await database.runAsync(
    `UPDATE pacientes SET nombre = ?, telefono = ?, email = ?, edad = ?, notas = ?, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?`,
    [
      paciente.nombre,
      paciente.telefono || null,
      paciente.email || null,
      paciente.edad || null,
      paciente.notas || null,
      new Date().toISOString(),
      paciente.id,
    ]
  );
}

export async function deletePaciente(id) {
  const database = await getDB();
  await database.runAsync(
    `UPDATE pacientes SET eliminado = 1, sincronizado = 0 WHERE id = ?`,
    [id]
  );
}

// ========== CONSULTAS ==========

export async function getConsultasByPaciente(pacienteId) {
  const database = await getDB();
  return await database.getAllAsync(
    `SELECT * FROM consultas WHERE paciente_id = ? AND eliminado = 0 ORDER BY fecha DESC`,
    [pacienteId]
  );
}

export async function insertConsulta(consulta) {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO consultas (
      id, paciente_id, fecha, od_esfera, od_cilindro, od_eje, od_adicion,
      oi_esfera, oi_cilindro, oi_eje, oi_adicion, dp, av_od, av_oi,
      tipo_lente, observaciones, foto_receta_path, fecha_creacion, sincronizado, eliminado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      consulta.id,
      consulta.paciente_id,
      consulta.fecha,
      consulta.od_esfera ?? null,
      consulta.od_cilindro ?? null,
      consulta.od_eje ?? null,
      consulta.od_adicion ?? null,
      consulta.oi_esfera ?? null,
      consulta.oi_cilindro ?? null,
      consulta.oi_eje ?? null,
      consulta.oi_adicion ?? null,
      consulta.dp ?? null,
      consulta.av_od || null,
      consulta.av_oi || null,
      consulta.tipo_lente || null,
      consulta.observaciones || null,
      consulta.foto_receta_path || null,
      consulta.fecha_creacion,
      0,
      0,
    ]
  );
}

// ========== VENTAS ==========

export async function getVentasByPaciente(pacienteId) {
  const database = await getDB();
  return await database.getAllAsync(
    `SELECT * FROM ventas WHERE paciente_id = ? AND eliminado = 0 ORDER BY fecha_venta DESC`,
    [pacienteId]
  );
}

export async function getAllVentas() {
  const database = await getDB();
  return await database.getAllAsync(
    `SELECT * FROM ventas WHERE eliminado = 0 ORDER BY fecha_venta DESC`
  );
}

export async function insertVenta(venta) {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO ventas (
      id, paciente_id, consulta_id, fecha_venta, producto, marca, material,
      tratamientos, costo, estado, notas, fecha_creacion, sincronizado, eliminado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      venta.id,
      venta.paciente_id,
      venta.consulta_id || null,
      venta.fecha_venta,
      venta.producto,
      venta.marca || null,
      venta.material || null,
      venta.tratamientos || null,
      venta.costo,
      venta.estado,
      venta.notas || null,
      venta.fecha_creacion,
      0,
      0,
    ]
  );
}

export async function updateVenta(venta) {
  const database = await getDB();
  await database.runAsync(
    `UPDATE ventas SET producto = ?, marca = ?, material = ?, tratamientos = ?, costo = ?, estado = ?, notas = ?, sincronizado = 0 WHERE id = ?`,
    [
      venta.producto,
      venta.marca || null,
      venta.material || null,
      venta.tratamientos || null,
      venta.costo,
      venta.estado,
      venta.notas || null,
      venta.id,
    ]
  );
}

// ========== EXPORTAR ==========

export async function exportAllData() {
  const pacientes = await getPacientes();
  let consultas = [];
  let ventas = [];

  for (const p of pacientes) {
    const c = await getConsultasByPaciente(p.id);
    const v = await getVentasByPaciente(p.id);
    consultas = consultas.concat(c);
    ventas = ventas.concat(v);
  }

  return {
    version: 1,
    fecha_exportacion: new Date().toISOString(),
    pacientes,
    consultas,
    ventas,
  };
}
