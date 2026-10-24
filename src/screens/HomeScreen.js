import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPacientes } from '../services/database';
import { getTrialStatus, getTrialMessage } from '../services/trial';

const PRIMARY = '#0A4D8C';

export default function HomeScreen({ navigation }) {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [trialMsg, setTrialMsg] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPacientes(busqueda);
      setPacientes(data);
      const status = await getTrialStatus();
      setTrialMsg(getTrialMessage(status));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PacienteDetail', { pacienteId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nombre?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.sub}>
          {[item.edad ? `${item.edad} años` : null, item.telefono].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre o teléfono..."
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={cargar}
          returnKeyType="search"
        />
      </View>

      {trialMsg && (
        <View style={[styles.warning, trialMsg.title.includes('finalizado') && styles.warningExpired]}>
          <Text style={styles.warningTitle}>{trialMsg.title}</Text>
          <Text style={styles.warningBody}>{trialMsg.body}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pacientes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={pacientes.length === 0 && styles.emptyContainer}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>
                {busqueda ? 'Sin resultados' : 'No hay pacientes aún'}
              </Text>
              <Text style={styles.emptySub}>Presiona + para agregar el primero</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PacienteForm')}
      >
        <Text style={styles.fabText}>+ Nuevo Paciente</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  warning: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  warningExpired: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#D32F2F',
  },
  warningTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  warningBody: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBox: { padding: 16, paddingRight: 16, backgroundColor: '#fff' },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 12,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1, marginLeft: 12 },
  nombre: { fontSize: 16, fontWeight: '600', color: '#222' },
  sub: { fontSize: 13, color: '#777', marginTop: 2 },
  chevron: { fontSize: 24, color: '#ccc' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#666' },
  emptySub: { fontSize: 14, color: '#999', marginTop: 6 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 15 },

});
