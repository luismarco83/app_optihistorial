import CryptoJS from 'crypto-js';

const SECRET = 'oh-lic-7f3c9a1e5b8d4c2f6a0e9d1b7c4f8a2e6d0c5b9a3f1e';
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function firmarLicencia(instalacionId, ymd) {
  const mac = CryptoJS.HmacSHA256(`${instalacionId}|${ymd}`, SECRET).toString(CryptoJS.enc.Hex);
  let firma = '';
  for (let i = 0; i < 6; i += 1) {
    const byte = parseInt(mac.substr(i * 2, 2), 16);
    firma += ALFABETO[byte % ALFABETO.length];
  }
  return firma;
}

export function verificarCodigoActivacion(instalacionId, codigo) {
  const limpio = String(codigo || '').trim().toUpperCase().replace(/\s/g, '');
  const m = limpio.match(/^(\d{8})-([A-Z2-9]{6})$/);
  if (!m || !instalacionId) return null;
  const ymd = m[1];
  const anio = Number(ymd.slice(0, 4));
  const mes = Number(ymd.slice(4, 6));
  const dia = Number(ymd.slice(6, 8));
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null;
  if (firmarLicencia(instalacionId, ymd) !== m[2]) return null;
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function generarCodigoActivacion(instalacionId, ymd) {
  return `${ymd}-${firmarLicencia(instalacionId, ymd)}`;
}
