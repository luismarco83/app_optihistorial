import React, { useContext, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { AuthContext } from '../services/session';
import { getConsultasByPaciente, getPacienteById, getPacientes, getVentasByPaciente } from '../services/database';
import { exportarPdf, htmlPacientes, imprimirHtml } from '../services/reportes';

const PRIMARY = '#0A4D8C';

export default function ImprimirPacientesScreen({ route }) {
  const pacienteId = route.params?.pacienteId;
  const { registrar } = useContext(AuthContext);
  const [datos, setDatos] = useState(true);
  const [consultas, setConsultas] = useState(true);
  const [ventas, setVentas] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const armar = async () => {
    if (!datos && !consultas && !ventas) {
      Alert.alert('Elige información', 'Marca al menos datos, consultas o ventas.');
      return null;
    }
    const base = pacienteId
      ? [await getPacienteById(pacienteId)].filter(Boolean)
      : await getPacientes();
    const pacientes = [];
    for (const p of base) {
      pacientes.push({
        ...p,
        consultas: consultas ? await getConsultasByPaciente(p.id) : [],
        ventas: ventas ? await getVentasByPaciente(p.id) : [],
      });
    }
    return htmlPacientes({ pacientes, incluir: { datos, consultas, ventas } });
  };

  const correr = async (modo) => {
    setOcupado(true);
    try {
      const html = await armar();
      if (!html) return;
      if (modo === 'pdf') await exportarPdf(html, 'Pacientes OptiHistorial');
      else await imprimirHtml(html);
      await registrar(modo === 'pdf' ? 'Exportó pacientes a PDF' : 'Imprimió pacientes', pacienteId || 'Todos');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setOcupado(false);
    }
  };

  const fila = (titulo, valor, setValor) => (
    <View style={styles.fila}>
      <Text style={styles.filaText}>{titulo}</Text>
      <Switch value={valor} onValueChange={setValor} trackColor={{ true: PRIMARY }} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.ayuda}>
        {pacienteId ? 'Se imprimirá este paciente.' : 'Se imprimirán todos los pacientes.'} Elige qué incluir.
      </Text>
      {fila('Datos del paciente', datos, setDatos)}
      {fila('Consultas', consultas, setConsultas)}
      {fila('Ventas', ventas, setVentas)}
      <TouchableOpacity style={styles.btn} onPress={() => correr('imprimir')} disabled={ocupado}>
        <Text style={styles.btnText}>Imprimir</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.alt]} onPress={() => correr('pdf')} disabled={ocupado}>
        <Text style={[styles.btnText, { color: PRIMARY }]}>Exportar a PDF</Text>
      </TouchableOpacity>
      {ocupado ? <ActivityIndicator color={PRIMARY} style={{ marginTop: 16 }} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  ayuda: { color: '#555', marginBottom: 12, lineHeight: 20 },
  fila: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  filaText: { flex: 1, fontSize: 16, color: '#222' },
  btn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  alt: { backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY },
  btnText: { color: '#fff', fontWeight: '700' },
});
