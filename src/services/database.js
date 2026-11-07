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

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      rol TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      eliminado INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id TEXT PRIMARY KEY NOT NULL,
      fecha TEXT NOT NULL,
      usuario_id TEXT,
      usuario_nombre TEXT NOT NULL,
      accion TEXT NOT NULL,
      detalle TEXT
    );
  `);
  await asegurarColumnas();
}

async function asegurarColumnas() {
  const usuarios = await db.getAllAsync(`PRAGMA table_info(usuarios)`);
  if (!usuarios.some((c) => c.name === 'recuperacion_hash')) {
    await db.execAsync(`ALTER TABLE usuarios ADD COLUMN recuperacion_hash TEXT`);
    await db.execAsync(`ALTER TABLE usuarios ADD COLUMN recuperacion_salt TEXT`);
  }
  const consultas = await db.getAllAsync(`PRAGMA table_info(consultas)`);
  if (!consultas.some((c) => c.name === 'proxima_consulta')) {
    await db.execAsync(`ALTER TABLE consultas ADD COLUMN proxima_consulta TEXT`);
  }
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
  const ahora = new Date().toISOString();
  await database.runAsync(
    `UPDATE consultas SET eliminado = 1, sincronizado = 0 WHERE paciente_id = ?`,
    [id]
  );
  await database.runAsync(
    `UPDATE ventas SET eliminado = 1, sincronizado = 0 WHERE paciente_id = ?`,
    [id]
  );
  await database.runAsync(
    `UPDATE pacientes SET eliminado = 1, sincronizado = 0, fecha_actualizacion = ? WHERE id = ?`,
    [ahora, id]
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
      tipo_lente, observaciones, foto_receta_path, proxima_consulta, fecha_creacion, sincronizado, eliminado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      consulta.proxima_consulta || null,
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
    `SELECT v.*, p.nombre AS paciente_nombre
     FROM ventas v
     LEFT JOIN pacientes p ON p.id = v.paciente_id
     WHERE v.eliminado = 0
     ORDER BY v.fecha_venta DESC`
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

export async function getProximasConsultas() {
  const database = await getDB();
  return database.getAllAsync(
    `SELECT c.id, c.paciente_id, c.proxima_consulta, c.fecha, p.nombre AS paciente_nombre
     FROM consultas c
     JOIN pacientes p ON p.id = c.paciente_id
     WHERE c.eliminado = 0 AND p.eliminado = 0 AND c.proxima_consulta IS NOT NULL
     ORDER BY c.proxima_consulta ASC`
  );
}

export async function importarRespaldo(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.pacientes) || !Array.isArray(data.consultas) || !Array.isArray(data.ventas)) {
    throw new Error('Este archivo no es un respaldo de OptiHistorial.');
  }
  const database = await getDB();
  await database.withTransactionAsync(async () => {
    await database.execAsync(`DELETE FROM consultas; DELETE FROM ventas; DELETE FROM pacientes;`);
    for (const p of data.pacientes) {
      await database.runAsync(
        `INSERT INTO pacientes (id, nombre, telefono, email, edad, notas, fecha_creacion, fecha_actualizacion, sincronizado, eliminado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.nombre, p.telefono || null, p.email || null, p.edad || null, p.notas || null, p.fecha_creacion, p.fecha_actualizacion || p.fecha_creacion, p.sincronizado || 0, p.eliminado || 0]
      );
    }
    for (const c of data.consultas) {
      await database.runAsync(
        `INSERT INTO consultas (
          id, paciente_id, fecha, od_esfera, od_cilindro, od_eje, od_adicion,
          oi_esfera, oi_cilindro, oi_eje, oi_adicion, dp, av_od, av_oi,
          tipo_lente, observaciones, foto_receta_path, proxima_consulta, fecha_creacion, sincronizado, eliminado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.paciente_id, c.fecha, c.od_esfera ?? null, c.od_cilindro ?? null, c.od_eje ?? null, c.od_adicion ?? null, c.oi_esfera ?? null, c.oi_cilindro ?? null, c.oi_eje ?? null, c.oi_adicion ?? null, c.dp ?? null, c.av_od || null, c.av_oi || null, c.tipo_lente || null, c.observaciones || null, c.foto_receta_path || null, c.proxima_consulta || null, c.fecha_creacion, c.sincronizado || 0, c.eliminado || 0]
      );
    }
    for (const v of data.ventas) {
      await database.runAsync(
        `INSERT INTO ventas (
          id, paciente_id, consulta_id, fecha_venta, producto, marca, material,
          tratamientos, costo, estado, notas, fecha_creacion, sincronizado, eliminado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.paciente_id, v.consulta_id || null, v.fecha_venta, v.producto, v.marca || null, v.material || null, v.tratamientos || null, v.costo, v.estado, v.notas || null, v.fecha_creacion, v.sincronizado || 0, v.eliminado || 0]
      );
    }
  });
  return { pacientes: data.pacientes.length, consultas: data.consultas.length, ventas: data.ventas.length };
}
