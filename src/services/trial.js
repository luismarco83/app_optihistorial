import * as SecureStore from 'expo-secure-store';
import { differenceInDays, addDays, format } from 'date-fns';
import { leerLicencia } from './licencia';

const TRIAL_DAYS = 30;
const WARNING_DAYS = 7; // días antes de mostrar aviso
const KEY_INSTALL_DATE = 'optihistorial_install_date';

/**
 * Obtiene o crea la fecha de instalación (primer uso)
 */
export async function getInstallDate() {
  let dateStr = await SecureStore.getItemAsync(KEY_INSTALL_DATE);
  if (!dateStr) {
    dateStr = new Date().toISOString();
    await SecureStore.setItemAsync(KEY_INSTALL_DATE, dateStr);
  }
  return new Date(dateStr);
}

/**
 * Calcula el estado del periodo de prueba
 * @returns {Promise<{
 *   daysUsed: number,
 *   daysRemaining: number,
 *   isExpired: boolean,
 *   showWarning: boolean,
 *   expireDate: Date,
 *   installDate: Date
 * }>}
 */
export async function getTrialStatus() {
  const installDate = await getInstallDate();
  const now = new Date();
  const expireDate = addDays(installDate, TRIAL_DAYS);
  const daysUsed = differenceInDays(now, installDate);
  const daysRemaining = Math.max(0, TRIAL_DAYS - daysUsed);
  const isExpired = daysUsed >= TRIAL_DAYS;
  const showWarning = !isExpired && daysRemaining <= WARNING_DAYS;
  const licencia = await leerLicencia();
  if (licencia.vigente) {
    return {
      daysUsed,
      daysRemaining,
      isExpired: false,
      showWarning: false,
      expireDate,
      installDate,
      licensed: true,
      licenciaHasta: licencia.hasta,
    };
  }

  return {
    daysUsed,
    daysRemaining,
    isExpired,
    showWarning,
    expireDate,
    installDate,
  };
}

/**
 * Mensaje personalizado según el estado
 */
export function getTrialMessage(status) {
  if (status.isExpired) {
    return {
      title: 'Periodo de prueba finalizado',
      body: `Tu periodo de prueba de ${TRIAL_DAYS} días ha terminado.\n\nPuedes seguir consultando lo guardado, pero no capturar nada nuevo.\n\nEn Configuración escribe el código de activación.`,
    };
  }

  if (status.showWarning) {
    return {
      title: 'Periodo de prueba por terminar',
      body: `Quedan ${status.daysRemaining} día${status.daysRemaining === 1 ? '' : 's'} de prueba.\n\nA partir del ${format(status.expireDate, 'dd/MM/yyyy')} no podrás crear nuevos registros, aunque sí consultar los existentes.`,
    };
  }

  return null;
}
