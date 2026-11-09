import React from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export const NAVY = '#1B2437';

export default function AccesoMarco({ children }) {
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.ring}>
          <Text style={styles.marcaArriba}>Opti</Text>
          <Text style={styles.marcaAbajo}>Historial</Text>
        </View>
        <View style={styles.tituloRow}>
          <View style={styles.linea} />
          <Text style={styles.titulo}>OPTIHISTORIAL</Text>
          <View style={styles.linea} />
        </View>
        <Text style={styles.subtitulo}>Historiales clínicos para ópticas</Text>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const accesoStyles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 14 },
  label: { color: '#243041', fontSize: 15, fontWeight: '600' },
  link: { color: '#7B8794', fontSize: 13 },
  input: {
    backgroundColor: '#F3F5F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1B2437',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F5F8', borderRadius: 12 },
  inputFlex: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1B2437' },
  ver: { color: '#7B8794', paddingRight: 14, fontWeight: '600' },
  btn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ayuda: { color: '#6B7785', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  clave: { fontSize: 28, fontWeight: '700', color: NAVY, textAlign: 'center', letterSpacing: 2, marginVertical: 16 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 48, paddingBottom: 32 },
  ring: {
    alignSelf: 'center',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: '#D5DCE3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  marcaArriba: { color: '#1A4F9C', fontSize: 20, fontWeight: '700' },
  marcaAbajo: { color: '#1A4F9C', fontSize: 16, fontWeight: '700', marginTop: 1 },
  tituloRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 10 },
  linea: { flex: 1, height: 1, backgroundColor: '#D5DCE3' },
  titulo: { color: '#5E6E82', fontSize: 13, fontWeight: '700', letterSpacing: 2.2 },
  subtitulo: { textAlign: 'center', color: '#9AA6B2', marginTop: 8, marginBottom: 22, fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 22,
    shadowColor: '#1B2437',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
