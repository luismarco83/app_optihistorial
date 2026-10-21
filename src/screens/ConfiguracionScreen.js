import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { exportAllData } from '../services/database';

const PRIMARY = '#0A4D8C';

export default function ConfiguracionScreen() {
  const [exportando, setExportando] = useState(false);

  const exportarRespaldo = async () => {
    setExportando(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const fecha = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const path = `${FileSystem.cacheDirectory}OptiHistorial_${fecha}.json`;

      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Guardar respaldo OptiHistorial',
        });
      } else {
        Alert.alert('Respaldo generado', `Archivo guardado en: ${path}`);
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
          <Text style={styles.sub}>Genera un archivo y lo guarda donde quieras</Text>
        </View>
        {exportando ? <ActivityIndicator color={PRIMARY} /> : <Text style={styles.chevron}>›</Text>}
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
