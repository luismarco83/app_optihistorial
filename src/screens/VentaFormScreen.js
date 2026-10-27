import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { insertVenta } from '../services/database';
import { getTrialStatus } from '../services/trial';

const PRIMARY = '#0A4D8C';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function VentaFormScreen({ route, navigation }) {
  const { pacienteId } = route.params;
  const [saving, setSaving] = useState(false);

  const [producto, setProducto] = useState('');
  const [marca, setMarca] = useState('');
  const [material, setMaterial] = useState('');
  const [tratamientos, setTratamientos] = useState('');
  const [costo, setCosto] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [notas, setNotas] = useState('');

  const guardar = async () => {
    const trial = await getTrialStatus();
    if (trial.isExpired) {
      Alert.alert(
        'Periodo de prueba finalizado',
        'No es posible crear nuevas ventas. Puedes seguir consultando los datos existentes.\n\nContacta al desarrollador para continuar.'
      );
      return;
    }

    if (!producto.trim()) {
      Alert.alert('Error', 'El producto es obligatorio');
      return;
    }
    const costoNum = Number(String(costo).trim().replace(',', '.'));
    if (!Number.isFinite(costoNum)) {
      Alert.alert('Error', 'El costo es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const ahora = new Date().toISOString();
      await insertVenta({
        id: generateId(),
        paciente_id: pacienteId,
        fecha_venta: ahora,
        producto: producto.trim(),
        marca: marca.trim() || null,
        material: material.trim() || null,
        tratamientos: tratamientos.trim() || null,
        costo: costoNum,
        estado,
        notas: notas.trim() || null,
        fecha_creacion: ahora,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Producto / Descripción *</Text>
        <TextInput style={styles.input} value={producto} onChangeText={setProducto} placeholder="Ej. Lente progresivo + montura" />

        <Text style={styles.label}>Marca</Text>
        <TextInput style={styles.input} value={marca} onChangeText={setMarca} />

        <Text style={styles.label}>Material</Text>
        <TextInput style={styles.input} value={material} onChangeText={setMaterial} placeholder="Policarbonato, CR-39..." />

        <Text style={styles.label}>Tratamientos</Text>
        <TextInput style={styles.input} value={tratamientos} onChangeText={setTratamientos} placeholder="Antireflejante, fotocromático..." />

        <Text style={styles.label}>Costo *</Text>
        <TextInput style={styles.input} value={costo} onChangeText={setCosto} keyboardType="decimal-pad" placeholder="0.00" />

        <Text style={styles.label}>Estado</Text>
        <View style={styles.estados}>
          {['pendiente', 'entregado', 'cancelado'].map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.chip, estado === e && styles.chipActive]}
              onPress={() => setEstado(e)}
            >
              <Text style={[styles.chipText, estado === e && styles.chipTextActive]}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notas</Text>
        <TextInput style={[styles.input, { height: 70 }]} value={notas} onChangeText={setNotas} multiline />

        <TouchableOpacity style={styles.btn} onPress={guardar} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrar Venta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  estados: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
