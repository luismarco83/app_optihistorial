import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllVentas } from '../services/database';
import { formatFecha, MESES, etiquetaMes, partesFecha } from '../utils/fechas';
import { exportarPdf, htmlVentas, imprimirHtml } from '../services/reportes';
import { AuthContext } from '../services/session';

const PRIMARY = '#0A4D8C';

function indice(anio, mes) {
  return anio * 12 + mes;
}

export default function VentasScreen() {
  const { registrar } = useContext(AuthContext);
  const ahora = new Date();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState('mes');
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [desdeAnio, setDesdeAnio] = useState(ahora.getFullYear());
  const [desdeMes, setDesdeMes] = useState(1);
  const [hastaAnio, setHastaAnio] = useState(ahora.getFullYear());
  const [hastaMes, setHastaMes] = useState(ahora.getMonth() + 1);
  const [ocupado, setOcupado] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try {
        setVentas(await getAllVentas());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []));

  const filtradas = useMemo(() => {
    return ventas.filter((v) => {
      const p = partesFecha(v.fecha_venta);
      if (!p) return false;
      const n = indice(p.anio, p.mes);
      if (modo === 'mes') return p.anio === anio && p.mes === mes;
      if (modo === 'anio') return p.anio === anio;
      const a = indice(desdeAnio, desdeMes);
      const b = indice(hastaAnio, hastaMes);
      const ini = Math.min(a, b);
      const fin = Math.max(a, b);
      return n >= ini && n <= fin;
    });
  }, [ventas, modo, anio, mes, desdeAnio, desdeMes, hastaAnio, hastaMes]);

  const total = filtradas.reduce((sum, v) => (
    v.estado === 'cancelado' ? sum : sum + (Number(v.costo) || 0)
  ), 0);

  const titulo = modo === 'mes'
    ? etiquetaMes(anio, mes)
    : modo === 'anio'
      ? `Año ${anio}`
      : `${etiquetaMes(desdeAnio, desdeMes)} a ${etiquetaMes(hastaAnio, hastaMes)}`;

  const resumenAnio = useMemo(() => {
    if (modo !== 'anio') return [];
    return MESES.map((nombre, i) => {
      const delMes = filtradas.filter((v) => partesFecha(v.fecha_venta)?.mes === i + 1 && v.estado !== 'cancelado');
      const suma = delMes.reduce((s, v) => s + (Number(v.costo) || 0), 0);
      return { nombre, suma, n: delMes.length };
    }).filter((m) => m.n > 0);
  }, [modo, filtradas]);

  const documento = async (tipo) => {
    setOcupado(true);
    try {
      const html = htmlVentas({ titulo: `Ventas · ${titulo}`, ventas: filtradas, total });
      if (tipo === 'pdf') await exportarPdf(html, `Ventas ${titulo}`);
      else await imprimirHtml(html);
      await registrar(tipo === 'pdf' ? 'Exportó ventas a PDF' : 'Imprimió ventas', titulo);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setOcupado(false);
    }
  };

  const chipMes = (valor, setValor, anioFijo) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
      {MESES.map((nombre, i) => {
        const activo = valor === i + 1;
        return (
          <TouchableOpacity key={nombre} style={[styles.mes, activo && styles.mesOn]} onPress={() => setValor(i + 1)}>
            <Text style={[styles.mesText, activo && styles.mesTextOn]}>{nombre.slice(0, 3)}</Text>
          </TouchableOpacity>
        );
      })}
      <Text style={styles.anioFijo}> {anioFijo}</Text>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <View style={styles.modos}>
          {[
            ['mes', 'Un mes'],
            ['meses', 'Varios meses'],
            ['anio', 'Un año'],
          ].map(([id, label]) => (
            <TouchableOpacity key={id} style={[styles.modo, modo === id && styles.modoOn]} onPress={() => setModo(id)}>
              <Text style={[styles.modoText, modo === id && styles.modoTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {modo !== 'meses' && (
          <View style={styles.yearRow}>
            <TouchableOpacity onPress={() => setAnio((n) => n - 1)}><Text style={styles.step}>‹</Text></TouchableOpacity>
            <Text style={styles.year}>{anio}</Text>
            <TouchableOpacity onPress={() => setAnio((n) => n + 1)}><Text style={styles.step}>›</Text></TouchableOpacity>
          </View>
        )}
        {modo === 'mes' && chipMes(mes, setMes)}
        {modo === 'meses' && (
          <View>
            <Text style={styles.rango}>Desde {desdeAnio}</Text>
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setDesdeAnio((n) => n - 1)}><Text style={styles.step}>‹</Text></TouchableOpacity>
              <Text style={styles.year}>{desdeAnio}</Text>
              <TouchableOpacity onPress={() => setDesdeAnio((n) => n + 1)}><Text style={styles.step}>›</Text></TouchableOpacity>
            </View>
            {chipMes(desdeMes, setDesdeMes)}
            <Text style={styles.rango}>Hasta {hastaAnio}</Text>
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setHastaAnio((n) => n - 1)}><Text style={styles.step}>‹</Text></TouchableOpacity>
              <Text style={styles.year}>{hastaAnio}</Text>
              <TouchableOpacity onPress={() => setHastaAnio((n) => n + 1)}><Text style={styles.step}>›</Text></TouchableOpacity>
            </View>
            {chipMes(hastaMes, setHastaMes)}
          </View>
        )}

        <Text style={styles.total}>Total {titulo}: ${total.toFixed(2)}</Text>
        <Text style={styles.nota}>No incluye ventas canceladas.</Text>
        {resumenAnio.map((m) => (
          <Text key={m.nombre} style={styles.mesTotal}>{m.nombre}: ${m.suma.toFixed(2)} · {m.n} venta{m.n === 1 ? '' : 's'}</Text>
        ))}
        <View style={styles.acciones}>
          <TouchableOpacity style={styles.btn} onPress={() => documento('imprimir')} disabled={ocupado}>
            <Text style={styles.btnText}>Imprimir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => documento('pdf')} disabled={ocupado}>
            <Text style={[styles.btnText, { color: PRIMARY }]}>Exportar PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtradas.length === 0 && styles.emptyContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay ventas en este periodo</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.producto}>Venta · {item.producto}</Text>
                <Text style={styles.sub}>{item.paciente_nombre || 'Sin paciente'}</Text>
                <Text style={styles.sub}>Fecha real {formatFecha(item.fecha_venta)} · {item.estado}</Text>
                <Text style={styles.captura}>Capturada el {formatFecha(item.fecha_creacion)}</Text>
              </View>
              <Text style={styles.costo}>${Number(item.costo).toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  panel: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modos: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 10, padding: 3 },
  modo: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  modoOn: { backgroundColor: PRIMARY },
  modoText: { color: '#444', fontWeight: '600', fontSize: 13 },
  modoTextOn: { color: '#fff' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  year: { fontSize: 18, fontWeight: '700', marginHorizontal: 16, color: '#222' },
  step: { fontSize: 28, color: PRIMARY, paddingHorizontal: 12 },
  mes: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f2f2f2', marginRight: 6 },
  mesOn: { backgroundColor: PRIMARY },
  mesText: { color: '#444', fontWeight: '600' },
  mesTextOn: { color: '#fff' },
  rango: { marginTop: 8, color: '#555', fontWeight: '600' },
  anioFijo: { alignSelf: 'center', color: '#888' },
  total: { marginTop: 12, fontSize: 18, fontWeight: '700', color: PRIMARY },
  nota: { color: '#888', fontSize: 12, marginTop: 2 },
  mesTotal: { color: '#333', marginTop: 2 },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnAlt: { backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY },
  btnText: { color: '#fff', fontWeight: '700' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 12,
  },
  producto: { fontWeight: '600', fontSize: 15, color: '#222' },
  sub: { color: '#777', marginTop: 3, fontSize: 13 },
  captura: { color: '#999', marginTop: 2, fontSize: 12 },
  costo: { fontWeight: '700', color: PRIMARY, fontSize: 16 },
});
