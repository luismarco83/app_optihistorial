import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatFecha } from '../utils/fechas';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

function dinero(n) {
  const num = Number(n);
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : '—';
}

const ESTILO = `
  body { font-family: sans-serif; color: #1a1a1a; padding: 24px; }
  h1 { color: #0A4D8C; font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 0 0 16px; color: #333; }
  .total { font-size: 18px; font-weight: 700; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 6px 4px; font-size: 12px; vertical-align: top; }
  th { color: #0A4D8C; }
  .bloque { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 0 0 14px; }
  .muted { color: #666; font-size: 12px; }
`;

function pagina(titulo, cuerpo) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${ESTILO}</style></head><body>
    <h1>OptiHistorial</h1><h2>${esc(titulo)}</h2>${cuerpo}
    <p class="muted">Generado el ${esc(formatFecha(new Date().toISOString()))}</p>
  </body></html>`;
}

export function htmlVentas({ titulo, ventas, total }) {
  const filas = ventas.map((v) => `<tr>
    <td>${esc(formatFecha(v.fecha_venta))}</td>
    <td>${esc(v.paciente_nombre || 'Sin paciente')}</td>
    <td>${esc(v.producto)}</td>
    <td>${esc(v.estado)}</td>
    <td>${esc(dinero(v.costo))}</td>
  </tr>`).join('');
  return pagina(titulo, `
    <p class="total">Total vendido: ${esc(dinero(total))}</p>
    <p class="muted">El total no incluye ventas canceladas. ${ventas.length} registro(s).</p>
    <table>
      <thead><tr><th>Fecha real</th><th>Paciente</th><th>Producto</th><th>Estado</th><th>Costo</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="5">Sin ventas en este periodo</td></tr>'}</tbody>
    </table>`);
}

function bloqueConsulta(c) {
  const n = (v) => (v == null || v === '' ? '—' : v);
  return `<div class="bloque">
    <strong>Consulta · ${esc(formatFecha(c.fecha))}</strong>
    <div class="muted">Capturada el ${esc(formatFecha(c.fecha_creacion))}</div>
    <div>OD esfera ${esc(n(c.od_esfera))} · cilindro ${esc(n(c.od_cilindro))} · eje ${esc(n(c.od_eje))} · adición ${esc(n(c.od_adicion))}</div>
    <div>OI esfera ${esc(n(c.oi_esfera))} · cilindro ${esc(n(c.oi_cilindro))} · eje ${esc(n(c.oi_eje))} · adición ${esc(n(c.oi_adicion))}</div>
    <div>DP ${esc(n(c.dp))} · AV OD ${esc(n(c.av_od))} · AV OI ${esc(n(c.av_oi))}</div>
    ${c.tipo_lente ? `<div>Tipo de lente: ${esc(c.tipo_lente)}</div>` : ''}
    ${c.observaciones ? `<div>Observaciones: ${esc(c.observaciones)}</div>` : ''}
  </div>`;
}

function bloqueVenta(v) {
  return `<div class="bloque">
    <strong>Venta · ${esc(v.producto)}</strong>
    <div>Fecha real ${esc(formatFecha(v.fecha_venta))}</div>
    <div class="muted">Capturada el ${esc(formatFecha(v.fecha_creacion))}</div>
    ${v.marca ? `<div>Marca: ${esc(v.marca)}</div>` : ''}
    ${v.material ? `<div>Material: ${esc(v.material)}</div>` : ''}
    ${v.tratamientos ? `<div>Tratamientos: ${esc(v.tratamientos)}</div>` : ''}
    <div>${esc(dinero(v.costo))} · ${esc(v.estado)}</div>
    ${v.notas ? `<div>Notas: ${esc(v.notas)}</div>` : ''}
  </div>`;
}

export function htmlPacientes({ pacientes, incluir }) {
  const bloques = pacientes.map((p) => {
    let cuerpo = `<h2 style="margin-top:18px">${esc(p.nombre)}</h2>`;
    if (incluir.datos) {
      cuerpo += `<div class="bloque">
        <div>${p.edad != null ? `${esc(p.edad)} años` : 'Edad no registrada'}</div>
        <div>Teléfono: ${esc(p.telefono || '—')}</div>
        <div>Correo: ${esc(p.email || '—')}</div>
        ${p.notas ? `<div>Notas: ${esc(p.notas)}</div>` : ''}
      </div>`;
    }
    if (incluir.consultas) {
      cuerpo += (p.consultas || []).map(bloqueConsulta).join('') || '<p class="muted">Sin consultas</p>';
    }
    if (incluir.ventas) {
      cuerpo += (p.ventas || []).map(bloqueVenta).join('') || '<p class="muted">Sin ventas</p>';
    }
    return cuerpo;
  }).join('');
  return pagina('Pacientes', bloques || '<p>Sin pacientes</p>');
}

export async function imprimirHtml(html) {
  await Print.printAsync({ html });
}

export async function exportarPdf(html, nombre) {
  const archivo = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(archivo.uri, {
      mimeType: 'application/pdf',
      dialogTitle: nombre || 'Guardar PDF',
      UTI: 'com.adobe.pdf',
    });
  }
  return archivo.uri;
}
