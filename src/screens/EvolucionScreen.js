import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { getConsultasByPaciente } from '../services/database';

const PRIMARY = '#0A4D8C';
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function EvolucionScreen({ route }) {
  const { pacienteId, pacienteNombre } = route.params || {};
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const data = await getConsultasByPaciente(pacienteId);
      // Ordenar por fecha descendente (más reciente primero)
      const sorted = [...data].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setConsultas(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (loading) {
    return <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />;
  }

  if (consultas.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No hay consultas registradas</Text>
      </View>
    );
  }

  const renderRow = (label, od, oi) => (
    <View style={styles.row} key={label}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{od != null ? (od >= 0 ? `+${od}` : od) : '—'}</Text>
      <Text style={styles.value}>{oi != null ? (oi >= 0 ? `+${oi}` : oi) : '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: isTablet ? 24 : 16 }}>
      {pacienteNombre ? (
        <Text style={styles.header}>{pacienteNombre}</Text>
      ) : null}

      {consultas.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.fecha}>
            {c.fecha ? format(new Date(c.fecha), 'dd/MM/yyyy') : 'Sin fecha'}
          </Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.label, styles.headerText]}> </Text>
            <Text style={[styles.value, styles.headerText]}>OD</Text>
            <Text style={[styles.value, styles.headerText]}>OI</Text>
          </View>

          {renderRow('Esfera', c.od_esfera, c.oi_esfera)}
          {renderRow('Cilindro', c.od_cilindro, c.oi_cilindro)}
          {renderRow('Eje', c.od_eje, c.oi_eje)}
          {renderRow('Adición', c.od_adicion, c.oi_adicion)}

          {(c.av_od || c.av_oi || c.av_ambos) && (
            <View style={styles.avSection}>
              <Text style={styles.avTitle}>Agudeza Visual</Text>
              {c.av_od ? <Text style={styles.av}>AV OD: {c.av_od}</Text> : null}
              {c.av_oi ? <Text style={styles.av}>AV OI: {c.av_oi}</Text> : null}
              {c.av_ambos ? <Text style={styles.av}>AV Ambos: {c.av_ambos}</Text> : null}
            </View>
          )}

          {c.dp ? <Text style={styles.extra}>DP: {c.dp}</Text> : null}
          {c.tipo_lente ? <Text style={styles.extra}>Tipo: {c.tipo_lente}</Text> : null}
          {c.observaciones ? <Text style={styles.obs}>{c.observaciones}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#666', fontSize: 16 },
  header: { fontSize: isTablet ? 22 : 18, fontWeight: '700', color: PRIMARY, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isTablet ? 20 : 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  fecha: { fontSize: 16, fontWeight: '700', color: PRIMARY, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', marginBottom: 6 },
  row: { flexDirection: 'row', paddingVertical: 4 },
  label: { flex: 1.2, fontSize: 14, color: '#555' },
  value: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  headerText: { fontWeight: '700', color: PRIMARY },
  avSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  avTitle: { fontWeight: '600', color: PRIMARY, marginBottom: 4 },
  av: { fontSize: 14, color: '#333', marginBottom: 2 },
  extra: { marginTop: 6, fontSize: 13, color: '#555' },
  obs: { marginTop: 8, fontSize: 13, color: '#666', fontStyle: 'italic' },
});
