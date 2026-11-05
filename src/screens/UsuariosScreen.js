import React, { useCallback, useContext, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../services/session';
import { crearUsuario, listarUsuarios } from '../services/auth';

const PRIMARY = '#0A4D8C';

export default function UsuariosScreen() {
  const { esAdmin, registrar } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('usuario');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setUsuarios(await listarUsuarios());
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (!esAdmin) {
    return <View style={styles.center}><Text>Solo el administrador puede gestionar usuarios.</Text></View>;
  }

  const agregar = async () => {
    if (!nombre.trim() || password.length < 4) {
      Alert.alert('Datos incompletos', 'Nombre y una contraseña de al menos 4 caracteres.');
      return;
    }
    setGuardando(true);
    try {
      await crearUsuario({ nombre, password, rol });
      await registrar('Creó un usuario', `${nombre.trim()} (${rol})`);
      setNombre('');
      setPassword('');
      setRol('usuario');
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={usuarios}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.box}>
          <Text style={styles.titulo}>Nuevo usuario</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Contraseña" secureTextEntry />
          <View style={styles.row}>
            {['usuario', 'admin'].map((opcion) => (
              <TouchableOpacity key={opcion} style={[styles.chip, rol === opcion && styles.chipOn]} onPress={() => setRol(opcion)}>
                <Text style={[styles.chipText, rol === opcion && styles.chipTextOn]}>
                  {opcion === 'admin' ? 'Administrador' : 'Usuario'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.btn} onPress={agregar} disabled={guardando}>
            {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Agregar</Text>}
          </TouchableOpacity>
          <Text style={styles.titulo}>Quién puede entrar</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.rol}>{item.rol === 'admin' ? 'Administrador' : 'Usuario'}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { padding: 16 },
  titulo: { fontWeight: '700', fontSize: 16, marginBottom: 8, marginTop: 8, color: '#222' },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  chipOn: { backgroundColor: PRIMARY },
  chipText: { color: '#444', fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14 },
  nombre: { fontWeight: '700', color: '#222' },
  rol: { color: '#666', marginTop: 2 },
});
