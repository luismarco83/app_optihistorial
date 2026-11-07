import React, { useState } from 'react';
import { Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import AccesoMarco, { accesoStyles as s } from '../components/AccesoMarco';
import { generarCodigoActivacion } from '../services/licenciaFirma';
import { parseFechaReal } from '../utils/fechas';

export default function GeneradorLicenciaScreen() {
  const [instalacion, setInstalacion] = useState('');
  const [fecha, setFecha] = useState('');
  const [codigo, setCodigo] = useState('');

  const generar = () => {
    const id = instalacion.trim().toUpperCase();
    if (!/^[A-F0-9]{4}-[A-F0-9]{4}$/.test(id)) {
      Alert.alert('Código de óptica', 'Escríbelo como aparece en la app, por ejemplo 4F9C-A21B.');
      return;
    }
    const iso = parseFechaReal(fecha);
    if (!iso) {
      Alert.alert('Fecha', 'Escribe hasta qué día pagaron, en formato dd/mm/aaaa.');
      return;
    }
    const ymd = iso.replace(/-/g, '');
    setCodigo(generarCodigoActivacion(id, ymd));
  };

  return (
    <AccesoMarco>
      <Text style={s.ayuda}>Esta pantalla solo está en tu teléfono. Escribe el código de la óptica y la fecha hasta la que pagó.</Text>
      <Text style={[s.label, { marginTop: 14, marginBottom: 8 }]}>Código de la óptica</Text>
      <TextInput style={s.input} value={instalacion} onChangeText={setInstalacion} autoCapitalize="characters" placeholder="XXXX-XXXX" placeholderTextColor="#A0AAB4" />
      <Text style={[s.label, { marginTop: 14, marginBottom: 8 }]}>Licencia hasta</Text>
      <TextInput style={s.input} value={fecha} onChangeText={setFecha} placeholder="dd/mm/aaaa" placeholderTextColor="#A0AAB4" keyboardType="numbers-and-punctuation" />
      <TouchableOpacity style={s.btn} onPress={generar}>
        <Text style={s.btnText}>Generar código</Text>
      </TouchableOpacity>
      {codigo ? <Text style={s.clave} selectable>{codigo}</Text> : null}
      {codigo ? <Text style={s.ayuda}>Mantenlo presionado para copiarlo y envíaselo a la óptica.</Text> : null}
    </AccesoMarco>
  );
}
