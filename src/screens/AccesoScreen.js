import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { crearUsuario, ingresar } from '../services/auth';
import { registrarAccion } from '../services/audit';

const PRIMARY = '#0A4D8C';

export function SetupAdminScreen({ onCreado }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirma, setConfirma] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del administrador.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Contraseña corta', 'Usa al menos 4 caracteres.');
      return;
    }
    if (password !== confirma) {
      Alert.alert('No coincide', 'La confirmación de la contraseña es distinta.');
      return;
    }
    setGuardando(true);
    try {
      const usuario = await crearUsuario({ nombre, password, rol: 'admin' });
      await registrarAccion(usuario, 'Creó la cuenta de administrador', usuario.nombre);
      onCreado(usuario);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>OptiHistorial</Text>
      <Text style={styles.sub}>Crea la cuenta de administrador. Solo esa cuenta puede borrar o modificar el historial de accesos.</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={styles.label}>Confirmar contraseña</Text>
      <TextInput style={styles.input} value={confirma} onChangeText={setConfirma} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={crear} disabled={guardando}>
        {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Crear administrador</Text>}
      </TouchableOpacity>
    </View>
  );
}

export function LoginScreen({ onIngreso }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [entrando, setEntrando] = useState(false);

  const entrar = async () => {
    if (!nombre.trim() || !password) {
      Alert.alert('Faltan datos', 'Escribe nombre y contraseña.');
      return;
    }
    setEntrando(true);
    try {
      const usuario = await ingresar(nombre, password);
      if (!usuario) {
        await registrarAccion(
          { id: null, nombre: nombre.trim() },
          'Intento de ingreso rechazado',
          nombre.trim()
        );
        Alert.alert('No se pudo entrar', 'Nombre o contraseña incorrectos.');
        return;
      }
      await registrarAccion(usuario, 'Ingresó a la app', usuario.rol === 'admin' ? 'Administrador' : 'Usuario');
      onIngreso(usuario);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setEntrando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>OptiHistorial</Text>
      <Text style={styles.sub}>Escribe tu nombre y contraseña para entrar.</Text>
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={entrar} disabled={entrando}>
        {entrando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 28, fontWeight: '700', color: PRIMARY, marginBottom: 8 },
  sub: { color: '#555', marginBottom: 20, lineHeight: 20 },
  label: { color: '#555', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  btn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  btnText: { color: '#fff', fontWeight: '700' },
});
