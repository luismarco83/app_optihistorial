import React, { useState, useContext, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { exportAllData, importarRespaldo } from '../services/database';
import { AuthContext } from '../services/session';
import { activarLicencia, leerLicencia, obtenerIdInstalacion } from '../services/licencia';
import { formatFecha } from '../utils/fechas';

const PRIMARY = '#0A4D8C';

export default function ConfiguracionScreen({ navigation }) {
  const [exportando, setExportando] = useState(false);
  const { esAdmin, registrar, salir, usuario } = useContext(AuthContext);
  const [idOptica, setIdOptica] = useState('');
  const [licenciaHasta, setLicenciaHasta] = useState(null);
  const [codigoLicencia, setCodigoLicencia] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      setIdOptica(await obtenerIdInstalacion());
      const licencia = await leerLicencia();
      setLicenciaHasta(licencia.hasta);
    })();
  }, []));

  const escribirRespaldo = async (destinoTitulo) => {
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
          Alert.alert('No se guardó', destinoTitulo === 'Google Drive'
            ? 'Abre el menú del selector y elige Google Drive.'
            : 'Elige la carpeta Descargas para guardar el respaldo en el teléfono.');
          return;
        }
        const destino = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          `OptiHistorial_${fecha}.json`,
          'application/json'
        );
        await FileSystem.writeAsStringAsync(destino, json, { encoding: FileSystem.EncodingType.UTF8 });
        await registrar('Guardó un respaldo', destinoTitulo);
        Alert.alert('Respaldo guardado', destinoTitulo === 'Google Drive'
          ? 'El archivo quedó en la carpeta de Drive que elegiste.'
          : 'El archivo quedó en la carpeta que elegiste.');
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

  const exportarRespaldo = () => escribirRespaldo('el teléfono');
  const exportarDrive = () => {
    Alert.alert(
      'Google Drive',
      'En la siguiente pantalla abre el menú lateral y elige Google Drive. Luego selecciona la carpeta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Elegir carpeta', onPress: () => escribirRespaldo('Google Drive') },
      ]
    );
  };

  const restaurar = async () => {
    try {
      const elegido = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (elegido.canceled) return;
      const uri = elegido.assets?.[0]?.uri;
      const texto = await FileSystem.readAsStringAsync(uri);
      const data = JSON.parse(texto);
      const n = Array.isArray(data.pacientes) ? data.pacientes.length : 0;
      Alert.alert(
        'Restaurar respaldo',
        `Se reemplazarán los pacientes, consultas y ventas de este teléfono por los ${n} pacientes del archivo. Las contraseñas no cambian.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              try {
                const resumen = await importarRespaldo(data);
                await registrar('Restauró un respaldo', `${resumen.pacientes} pacientes`);
                Alert.alert('Listo', `${resumen.pacientes} pacientes, ${resumen.consultas} consultas y ${resumen.ventas} ventas.`);
              } catch (e) {
                Alert.alert('No se restauró', e.message);
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('No se restauró', 'Elige un archivo JSON de OptiHistorial.');
    }
  };

  const activar = async () => {
    const resultado = await activarLicencia(codigoLicencia);
    if (!resultado.ok) {
      Alert.alert('No se activó', resultado.error);
      return;
    }
    setLicenciaHasta(resultado.hasta);
    setCodigoLicencia('');
    await registrar('Activó la licencia', resultado.hasta);
    Alert.alert('Licencia activa', `Puedes capturar hasta el ${formatFecha(resultado.hasta)}.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {esAdmin && (
        <View style={styles.licencia}>
          <Text style={styles.title}>Licencia de esta óptica</Text>
          <Text style={styles.codigo} selectable>{idOptica}</Text>
          <Text style={styles.sub}>
            {licenciaHasta ? `Activa hasta el ${formatFecha(licenciaHasta)}.` : 'Sin licencia. Al terminar la prueba solo se podrá consultar.'}
          </Text>
          <TextInput
            style={styles.campo}
            value={codigoLicencia}
            onChangeText={setCodigoLicencia}
            autoCapitalize="characters"
            placeholder="Código de activación"
            placeholderTextColor="#A0AAB4"
          />
          <TouchableOpacity style={styles.activar} onPress={activar}>
            <Text style={styles.activarText}>Activar</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.item} onPress={exportarRespaldo} disabled={exportando}>
        <Text style={styles.icon}>💾</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Respaldo local</Text>
          <Text style={styles.sub}>Lo guarda en Descargas u otra carpeta del teléfono</Text>
        </View>
        {exportando ? <ActivityIndicator color={PRIMARY} /> : <Text style={styles.chevron}>›</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={restaurar}>
        <Text style={styles.icon}>📂</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Restaurar respaldo</Text>
          <Text style={styles.sub}>Carga un archivo JSON y reemplaza el historial de este teléfono</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
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

      <TouchableOpacity style={styles.item} onPress={exportarDrive} disabled={exportando}>
        <Text style={styles.icon}>☁️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Google Drive</Text>
          <Text style={styles.sub}>Elige la carpeta de Drive cuando se abra el selector</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.item}>
        <Text style={styles.icon}>ℹ️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Acerca de</Text>
          <Text style={styles.sub}>OptiHistorial v1.0.0{'\n'}Historiales clínicos para ópticas</Text>
        </View>
      </View>
    </ScrollView>
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
  licencia: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 12, padding: 16 },
  codigo: { fontSize: 22, fontWeight: '700', color: PRIMARY, letterSpacing: 1, marginVertical: 6 },
  campo: { backgroundColor: '#F3F5F8', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginTop: 10 },
  activar: { backgroundColor: '#1B2437', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  activarText: { color: '#fff', fontWeight: '700' },
});
