import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPacienteById, getConsultasByPaciente, getVentasByPaciente, deletePaciente } from '../services/database';
import { formatFecha } from '../utils/fechas';

const PRIMARY = '#0A4D8C';

export default function PacienteDetailScreen({ route, navigation }) {
  const { pacienteId } = route.params;
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState(route.params?.vista === 'ventas' ? 'ventas' : 'consultas');

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

  useFocusEffect(useCallback(() => {
    setVista(route.params?.vista === 'ventas' ? 'ventas' : 'consultas');
    cargar();
  }, [cargar, route.params?.vista]));

  const borrar = () => {
    Alert.alert(
      'Borrar paciente',
      `Se ocultará a ${paciente.nombre} y su historial. Esta acción no se puede deshacer desde la app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaciente(paciente.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const fmtDioptria = (n) => {
    if (n == null || n === '') return '—';
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    if (num > 0) return `+${num.toFixed(2)}`;
    if (num < 0) return num.toFixed(2);
    return '0.00';
  };

  const fmtEje = (n) => {
    if (n == null || n === '') return '—';
    const num = Number(n);
    return Number.isFinite(num) ? String(Math.round(num)) : '—';
  };

  const lineaOjo = (lado, c, prefix) =>
    `${lado}  Esfera ${fmtDioptria(c[`${prefix}_esfera`])}   Cilindro ${fmtDioptria(c[`${prefix}_cilindro`])}   Eje ${fmtEje(c[`${prefix}_eje`])}   Adición ${fmtDioptria(c[`${prefix}_adicion`])}`;

  if (loading) {
    return <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />;
  }

  if (!paciente) {
    return <View style={styles.center}><Text>Paciente no encontrado</Text></View>;
  }

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
        style={{ marginBottom: 8 }}
        onPress={() => navigation.navigate('PacienteForm', { paciente })}
      >
        <Text style={{ color: PRIMARY, textAlign: 'center' }}>Editar datos del paciente</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginBottom: 16 }} onPress={borrar}>
        <Text style={{ color: '#B00020', textAlign: 'center', fontWeight: '600' }}>Borrar paciente</Text>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchBtn, vista === 'consultas' && styles.switchBtnOn]}
          onPress={() => setVista('consultas')}
        >
          <Text style={[styles.switchText, vista === 'consultas' && styles.switchTextOn]}>Consultas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, vista === 'ventas' && styles.switchBtnOn]}
          onPress={() => setVista('ventas')}
        >
          <Text style={[styles.switchText, vista === 'ventas' && styles.switchTextOn]}>Ventas</Text>
        </TouchableOpacity>
      </View>

      {vista === 'consultas' && consultas.length === 0 && (
        <Text style={styles.empty}>Sin consultas</Text>
      )}
      {vista === 'ventas' && ventas.length === 0 && (
        <Text style={styles.empty}>Sin ventas</Text>
      )}

      {vista === 'consultas' && consultas.map((c) => (
        <View key={c.id} style={styles.item}>
          <Text style={styles.itemTitle}>Consulta · {formatFecha(c.fecha)}</Text>
          <Text style={styles.captura}>Capturada el {formatFecha(c.fecha_creacion)}</Text>
          <Text style={styles.itemSub}>{lineaOjo('OD', c, 'od')}</Text>
          <Text style={styles.itemSub}>{lineaOjo('OI', c, 'oi')}</Text>
          <Text style={styles.itemSub}>DP {c.dp != null ? c.dp : '—'}   AV OD {c.av_od || '—'}   AV OI {c.av_oi || '—'}</Text>
          {c.tipo_lente ? <Text style={styles.itemSub}>Tipo de lente: {c.tipo_lente}</Text> : null}
          {c.observaciones ? <Text style={styles.itemSub}>Observaciones: {c.observaciones}</Text> : null}
        </View>
      ))}

      {vista === 'ventas' && ventas.map((v) => (
        <View key={v.id} style={styles.item}>
          <Text style={styles.itemTitle}>Venta · {v.producto}</Text>
          <Text style={styles.realDate}>Fecha real {formatFecha(v.fecha_venta)}</Text>
          <Text style={styles.captura}>Capturada el {formatFecha(v.fecha_creacion)}</Text>
          {v.marca ? <Text style={styles.itemSub}>Marca: {v.marca}</Text> : null}
          {v.material ? <Text style={styles.itemSub}>Material: {v.material}</Text> : null}
          {v.tratamientos ? <Text style={styles.itemSub}>Tratamientos: {v.tratamientos}</Text> : null}
          <Text style={styles.itemSub}>Costo ${Number(v.costo).toFixed(2)} · {v.estado}</Text>
          {v.notas ? <Text style={styles.itemSub}>Notas: {v.notas}</Text> : null}
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
  itemTitle: { fontWeight: '700', fontSize: 16, color: '#222' },
  realDate: { color: PRIMARY, marginTop: 4, fontSize: 14, fontWeight: '600' },
  captura: { color: '#888', marginTop: 2, fontSize: 12 },
  itemSub: { color: '#333', marginTop: 6, fontSize: 14, lineHeight: 20 },
  switchRow: { flexDirection: 'row', backgroundColor: '#e6e6e6', borderRadius: 12, padding: 4, marginBottom: 12 },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  switchBtnOn: { backgroundColor: PRIMARY },
  switchText: { color: '#444', fontWeight: '600' },
  switchTextOn: { color: '#fff' },
});
