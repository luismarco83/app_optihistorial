import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatFecha } from '../utils/fechas';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function preparar() {
  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('consultas', {
      name: 'Próximas consultas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
}

async function programar(id, cuando, titulo, cuerpo) {
  if (cuando.getTime() < Date.now() + 5000) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    // no estaba programada
  }
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: titulo, body: cuerpo, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: cuando, channelId: 'consultas' },
  });
}

export async function programarRecordatorio({ consultaId, nombre, fecha }) {
  const listo = await preparar();
  if (!listo) return;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const manana = new Date(anio, mes - 1, dia - 1, 18, 0, 0, 0);
  const hoy = new Date(anio, mes - 1, dia, 8, 0, 0, 0);
  const texto = `${nombre} tiene consulta el ${formatFecha(fecha)}.`;
  await programar(`prox-${consultaId}-antes`, manana, 'Consulta mañana', texto);
  await programar(`prox-${consultaId}-dia`, hoy, 'Consulta hoy', texto);
}
