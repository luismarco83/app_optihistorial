import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { verificarCodigoActivacion } from './licenciaFirma';

const KEY_ID = 'optihistorial_instalacion_id';
const KEY_HASTA = 'optihistorial_licencia_hasta';

function hoyISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export async function obtenerIdInstalacion() {
  let id = await SecureStore.getItemAsync(KEY_ID);
  if (id) return id;
  const bytes = await Crypto.getRandomBytesAsync(4);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  id = `${hex.slice(0, 4)}-${hex.slice(4)}`;
  await SecureStore.setItemAsync(KEY_ID, id);
  return id;
}

export async function leerLicencia() {
  const hasta = await SecureStore.getItemAsync(KEY_HASTA);
  const vigente = !!hasta && hasta >= hoyISO();
  return { hasta, vigente };
}

export async function activarLicencia(codigo) {
  const id = await obtenerIdInstalacion();
  const hasta = verificarCodigoActivacion(id, codigo);
  if (!hasta) return { ok: false, error: 'El código no corresponde a esta óptica o está mal escrito.' };
  if (hasta < hoyISO()) return { ok: false, error: 'Ese código ya venció.' };
  await SecureStore.setItemAsync(KEY_HASTA, hasta);
  return { ok: true, hasta };
}
