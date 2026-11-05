import React, { useCallback, useContext, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../services/session';
import { borrarAuditoria, listarAuditoria, modificarAuditoria } from '../services/audit';
import { formatFecha } from '../utils/fechas';

const PRIMARY = '#0A4D8C';

export default function AuditoriaScreen() {
  const { esAdmin, registrar } = useContext(AuthContext);
  const [filas, setFilas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [texto, setTexto] = useState('');

  const cargar = useCallback(async () => {
    setFilas(await listarAuditoria());
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (!esAdmin) {
    return <View style={styles.center}><Text>Solo el administrador puede ver y modificar este historial.</Text></View>;
  }

  const guardar = async () => {
    await modificarAuditoria(editando.id, texto.trim());
    await registrar('Modificó el historial de acceso', editando.accion);
    setEditando(null);
    await cargar();
  };

  const borrar = (item) => {
    Alert.alert('Borrar registro', 'Solo un administrador puede quitar esta entrada.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await borrarAuditoria(item.id);
          await registrar('Borró una entrada del historial', item.accion);
          await cargar();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.container}
        data={filas}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no hay registros.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.accion}>{item.accion}</Text>
            <Text style={styles.meta}>{item.usuario_nombre} · {formatFecha(item.fecha)}</Text>
            {item.detalle ? <Text style={styles.detalle}>{item.detalle}</Text> : null}
            <View style={styles.row}>
              <TouchableOpacity onPress={() => { setEditando(item); setTexto(item.detalle || ''); }}>
                <Text style={styles.link}>Modificar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => borrar(item)}>
                <Text style={styles.danger}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={!!editando} transparent animationType="fade" onRequestClose={() => setEditando(null)}>
        <View style={styles.modal}>
          <View style={styles.dialog}>
            <Text style={styles.accion}>Modificar detalle</Text>
            <TextInput style={styles.input} value={texto} onChangeText={setTexto} multiline />
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setEditando(null)}><Text style={styles.link}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={guardar}><Text style={styles.link}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 10, padding: 14 },
  accion: { fontWeight: '700', color: '#222' },
  meta: { color: '#666', marginTop: 4, fontSize: 13 },
  detalle: { color: '#333', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 10 },
  link: { color: PRIMARY, fontWeight: '700' },
  danger: { color: '#B00020', fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, minHeight: 80, padding: 10, marginTop: 10, textAlignVertical: 'top' },
});
