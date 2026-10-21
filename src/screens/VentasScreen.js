import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { getAllVentas } from '../services/database';

const PRIMARY = '#0A4D8C';

export default function VentasScreen() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await getAllVentas();
          setVentas(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 60 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ventas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={ventas.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 50 }}>🛍️</Text>
            <Text style={styles.emptyText}>No hay ventas registradas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.producto}>{item.producto}</Text>
              <Text style={styles.sub}>
                {format(new Date(item.fecha_venta), 'dd/MM/yyyy')} · {item.estado}
              </Text>
            </View>
            <Text style={styles.costo}>${Number(item.costo).toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center' },
  emptyText: { color: '#888', marginTop: 12, fontSize: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 12,
  },
  producto: { fontWeight: '600', fontSize: 15, color: '#222' },
  sub: { color: '#777', marginTop: 3, fontSize: 13 },
  costo: { fontWeight: '700', color: PRIMARY, fontSize: 16 },
});
