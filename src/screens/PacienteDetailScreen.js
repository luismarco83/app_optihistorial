import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { getPacienteById, getConsultasByPaciente, getVentasByPaciente } from '../services/database';

const PRIMARY = '#0A4D8C';

export default function PacienteDetailScreen({ route, navigation }) {
  const { pacienteId } = route.params;
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getPacienteById(pacienteId);
      const c = await getConsultasByPaciente(pacienteId);
      const v = await getVentasByPaciente(pacienteId);
      setPaciente(p);
      setConsultas(c);
      setVentas(v);
      navigation.setOptions({ title: p?.nombre || 'Detalle' });
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

  if (!paciente) {
    return <View style={styles.center}><Text>Paciente no encontrado</Text></View>;
  }

  const resumenGrad = (c) => {
    const parts = [];
    if (c.od_esfera != null) parts.push(`OD ${c.od_esfera >= 0 ? '+' : ''}${c.od_esfera}`);
    if (c.oi_esfera != null) parts.push(`OI ${c.oi_esfera >= 0 ? '+' : ''}${c.oi_esfera}`);
    return parts.join('  |  ') || 'Sin graduación';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        {paciente.edad != null && <Text style={styles.info}>🎂 {paciente.edad} años</Text>}
        {paciente.telefono && <Text style={styles.info}>📞 {paciente.telefono}</Text>}
        {paciente.email && <Text style={styles.info}>✉️ {paciente.email}</Text>}
        {paciente.notas ? <Text style={styles.notas}>{paciente.notas}</Text> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: PRIMARY }]}
          onPress={() => navigation.navigate('ConsultaForm', { pacienteId })}
        >
          <Text style={styles.btnText}>Nueva Consulta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY }]}
          onPress={() => navigation.navigate('VentaForm', { pacienteId })}
        >
          <Text style={[styles.btnText, { color: PRIMARY }]}>Nueva Venta</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#1a6bb5', marginBottom: 12 }]}
        onPress={() => navigation.navigate('Evolucion', { pacienteId, pacienteNombre: paciente.nombre })}
      >
        <Text style={styles.btnText}>Ver Evolución de Graduaciones</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginBottom: 12 }}
        onPress={() => navigation.navigate('PacienteForm', { paciente })}
      >
        <Text style={{ color: PRIMARY, textAlign: 'center' }}>Editar datos del paciente</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Historial</Text>

      {consultas.length === 0 && ventas.length === 0 && (
        <Text style={styles.empty}>Sin historial aún</Text>
      )}

      {consultas.map((c) => (
        <View key={c.id} style={styles.item}>
          <Text style={styles.itemTitle}>👁️ Consulta · {format(new Date(c.fecha), 'dd/MM/yyyy')}</Text>
          <Text style={styles.itemSub}>{resumenGrad(c)}</Text>
          {c.tipo_lente && <Text style={styles.itemSub}>{c.tipo_lente}</Text>}
        </View>
      ))}

      {ventas.map((v) => (
        <View key={v.id} style={styles.item}>
          <Text style={styles.itemTitle}>🛍️ {v.producto}</Text>
          <Text style={styles.itemSub}>
            {format(new Date(v.fecha_venta), 'dd/MM/yyyy')} · ${Number(v.costo).toFixed(2)} · {v.estado}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  info: { fontSize: 15, color: '#444', marginBottom: 6 },
  notas: { marginTop: 8, color: '#666', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '700', marginBottom: 10, color: '#222' },
  empty: { textAlign: 'center', color: '#999', marginVertical: 30 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  itemTitle: { fontWeight: '600', fontSize: 15, color: '#222' },
  itemSub: { color: '#666', marginTop: 4, fontSize: 13 },
});
