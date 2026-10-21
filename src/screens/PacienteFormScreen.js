import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { insertPaciente, updatePaciente } from '../services/database';
import { getTrialStatus } from '../services/trial';

const PRIMARY = '#0A4D8C';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PacienteFormScreen({ route, navigation }) {
  const paciente = route.params?.paciente || null;
  const esEdicion = !!paciente;

  const [nombre, setNombre] = useState(paciente?.nombre || '');
  const [telefono, setTelefono] = useState(paciente?.telefono || '');
  const [email, setEmail] = useState(paciente?.email || '');
  const [edad, setEdad] = useState(paciente?.edad?.toString() || '');
  const [notas, setNotas] = useState(paciente?.notas || '');
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    // Bloqueo de escritura si el periodo de prueba terminó (solo para nuevos)
    if (!esEdicion) {
      const trial = await getTrialStatus();
      if (trial.isExpired) {
        Alert.alert(
          'Periodo de prueba finalizado',
          'No es posible crear nuevos pacientes. Puedes seguir consultando los datos existentes.\n\nContacta al desarrollador para continuar.'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const ahora = new Date().toISOString();
      if (esEdicion) {
        await updatePaciente({
          id: paciente.id,
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          edad: parseInt(edad) || null,
          notas: notas.trim() || null,
        });
      } else {
        await insertPaciente({
          id: generateId(),
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          edad: parseInt(edad) || null,
          notas: notas.trim() || null,
          fecha_creacion: ahora,
          fecha_actualizacion: ahora,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nombre completo *</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholder="Teléfono" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Email" />

        <Text style={styles.label}>Edad</Text>
        <TextInput style={styles.input} value={edad} onChangeText={setEdad} keyboardType="number-pad" placeholder="Edad" />

        <Text style={styles.label}>Notas</Text>
        <TextInput style={[styles.input, { height: 90 }]} value={notas} onChangeText={setNotas} multiline placeholder="Observaciones" />

        <TouchableOpacity style={styles.btn} onPress={guardar} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{esEdicion ? 'Guardar cambios' : 'Crear paciente'}</Text>
          )}
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
  btn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
