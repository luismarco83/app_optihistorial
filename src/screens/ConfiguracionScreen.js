import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { exportAllData } from '../services/database';
import { AuthContext } from '../services/session';

const PRIMARY = '#0A4D8C';

export default function ConfiguracionScreen({ navigation }) {
  const [exportando, setExportando] = useState(false);
  const { esAdmin, registrar, salir, usuario } = useContext(AuthContext);

  const exportarRespaldo = async () => {
    setExportando(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const fecha = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const path = `${FileSystem.cacheDirectory}OptiHistorial_${fecha}.json`;

      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('No se guardó', 'Elige la carpeta Descargas para guardar el respaldo en el teléfono.');
          return;
        }
        const destino = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          `OptiHistorial_${fecha}.json`,
          'application/json'
        );
        await FileSystem.writeAsStringAsync(destino, json, { encoding: FileSystem.EncodingType.UTF8 });
        await registrar('Guardó un respaldo', `OptiHistorial_${fecha}.json`);
        Alert.alert('Respaldo guardado', 'El archivo quedó en la carpeta que elegiste.');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        Alert.alert(
          'Respaldo listo',
          'El archivo se generó correctamente. Elige dónde guardarlo (Descargas, Drive, WhatsApp, etc.).',
          [
            {
              text: 'Guardar / Compartir',
              onPress: async () => {
                await Sharing.shareAsync(path, {
                  mimeType: 'application/json',
                  dialogTitle: 'Guardar respaldo OptiHistorial',
                });
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Respaldo generado', `Archivo guardado en:\n${path}`);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={exportarRespaldo} disabled={exportando}>
        <Text style={styles.icon}>💾</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Respaldo local</Text>
          <Text style={styles.sub}>Lo guarda en Descargas u otra carpeta del teléfono</Text>
        </View>
        {exportando ? <ActivityIndicator color={PRIMARY} /> : <Text style={styles.chevron}>›</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ImprimirPacientes')}>
        <Text style={styles.icon}>🖨️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Imprimir pacientes</Text>
          <Text style={styles.sub}>Elige datos, consultas o ventas, e imprime o exporta a PDF</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {esAdmin && (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Usuarios')}>
          <Text style={styles.icon}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Usuarios</Text>
            <Text style={styles.sub}>Agrega quién puede entrar y si es administrador</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

      {esAdmin && (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Auditoria')}>
          <Text style={styles.icon}>📒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Historial de acceso</Text>
            <Text style={styles.sub}>Quién entró y qué hizo. Solo el administrador lo borra o modifica</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.item} onPress={() => salir()}>
        <Text style={styles.icon}>🔒</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cerrar sesión</Text>
          <Text style={styles.sub}>Entraste como {usuario?.nombre}</Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.item, { opacity: 0.5 }]}>
        <Text style={styles.icon}>☁️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Google Drive</Text>
          <Text style={styles.sub}>Próximamente en Etapa 2</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>Pronto</Text></View>
      </View>

      <View style={styles.item}>
        <Text style={styles.icon}>ℹ️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Acerca de</Text>
          <Text style={styles.sub}>OptiHistorial v1.0.0{'\n'}Historiales clínicos para ópticas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    gap: 12,
  },
  icon: { fontSize: 24 },
  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  sub: { fontSize: 13, color: '#777', marginTop: 2 },
  chevron: { fontSize: 22, color: '#ccc' },
  badge: { backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, color: '#666' },
});
