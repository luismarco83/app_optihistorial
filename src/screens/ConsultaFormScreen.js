import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { insertConsulta } from '../services/database';
import { getTrialStatus } from '../services/trial';

const PRIMARY = '#0A4D8C';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function Campo({ label, value, onChange, placeholder }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={styles.campoInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder || '0.00'}
        textAlign="center"
      />
    </View>
  );
}

export default function ConsultaFormScreen({ route, navigation }) {
  const { pacienteId } = route.params;
  const [saving, setSaving] = useState(false);

  const [odEsfera, setOdEsfera] = useState('');
  const [odCilindro, setOdCilindro] = useState('');
  const [odEje, setOdEje] = useState('');
  const [odAdicion, setOdAdicion] = useState('');

  const [oiEsfera, setOiEsfera] = useState('');
  const [oiCilindro, setOiCilindro] = useState('');
  const [oiEje, setOiEje] = useState('');
  const [oiAdicion, setOiAdicion] = useState('');

  const [dp, setDp] = useState('');
  const [avOd, setAvOd] = useState('');
  const [avOi, setAvOi] = useState('');
  const [tipoLente, setTipoLente] = useState('');
  const [observaciones, setObservaciones] = useState('');

  function parseNum(val) {
  if (val === '' || val === null || val === undefined) return null;
  const n = parseFloat(String(val).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function parseIntSafe(val) {
  if (val === '' || val === null || val === undefined) return null;
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : null;
}

const tipos = ['Monofocal', 'Bifocal', 'Progresivo', 'Ocupacional', 'Lentes de contacto', 'Otro'];

  const guardar = async () => {
    const trial = await getTrialStatus();
    if (trial.isExpired) {
      Alert.alert(
        'Periodo de prueba finalizado',
        'No es posible crear nuevas consultas. Puedes seguir consultando los datos existentes.\n\nContacta al desarrollador para continuar.'
      );
      return;
    }

    setSaving(true);
    try {
      const ahora = new Date().toISOString();
      await insertConsulta({
        id: generateId(),
        paciente_id: pacienteId,
        fecha: ahora,
        od_esfera: parseNum(odEsfera),
        od_cilindro: parseNum(odCilindro),
        od_eje: parseIntSafe(odEje),
        od_adicion: parseNum(odAdicion),
        oi_esfera: parseNum(oiEsfera),
        oi_cilindro: parseNum(oiCilindro),
        oi_eje: parseIntSafe(oiEje),
        oi_adicion: parseNum(oiAdicion),
        dp: parseNum(dp),
        av_od: avOd.trim() || null,
        av_oi: avOi.trim() || null,
        tipo_lente: tipoLente || null,
        observaciones: observaciones.trim() || null,
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
        {/* OD */}
        <View style={[styles.bloque, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.bloqueTitulo, { color: PRIMARY }]}>OJO DERECHO (OD)</Text>
          <View style={styles.row}>
            <Campo label="Esfera" value={odEsfera} onChange={setOdEsfera} />
            <Campo label="Cilindro" value={odCilindro} onChange={setOdCilindro} />
          </View>
          <View style={styles.row}>
            <Campo label="Eje" value={odEje} onChange={setOdEje} placeholder="0-180" />
            <Campo label="Adición" value={odAdicion} onChange={setOdAdicion} />
          </View>
        </View>

        {/* OI */}
        <View style={[styles.bloque, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.bloqueTitulo, { color: '#2E7D32' }]}>OJO IZQUIERDO (OI)</Text>
          <View style={styles.row}>
            <Campo label="Esfera" value={oiEsfera} onChange={setOiEsfera} />
            <Campo label="Cilindro" value={oiCilindro} onChange={setOiCilindro} />
          </View>
          <View style={styles.row}>
            <Campo label="Eje" value={oiEje} onChange={setOiEje} placeholder="0-180" />
            <Campo label="Adición" value={oiAdicion} onChange={setOiAdicion} />
          </View>
        </View>

        <View style={styles.row}>
          <Campo label="DP (mm)" value={dp} onChange={setDp} />
          <Campo label="AV OD" value={avOd} onChange={setAvOd} placeholder="20/20" />
          <Campo label="AV OI" value={avOi} onChange={setAvOi} placeholder="20/20" />
        </View>

        <Text style={styles.label}>Tipo de lente</Text>
        <View style={styles.tipos}>
          {tipos.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, tipoLente === t && styles.chipActive]}
              onPress={() => setTipoLente(t)}
            >
              <Text style={[styles.chipText, tipoLente === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Observaciones</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
          placeholder="Notas de la consulta"
        />

        <TouchableOpacity style={styles.btn} onPress={guardar} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar Consulta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  bloque: { borderRadius: 12, padding: 14, marginBottom: 16 },
  bloqueTitulo: { fontWeight: '700', marginBottom: 10, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  campo: { flex: 1 },
  campoLabel: { fontSize: 12, color: '#555', marginBottom: 4, textAlign: 'center' },
  campoInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
  label: { fontSize: 14, color: '#555', marginBottom: 8, marginTop: 8 },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  btn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
