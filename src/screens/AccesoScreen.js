import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
import AccesoMarco, { accesoStyles as s } from '../components/AccesoMarco';
import { crearUsuario, ingresar, guardarClaveRecuperacion, restablecerConClave } from '../services/auth';
import { registrarAccion } from '../services/audit';

function Boton({ titulo, onPress, ocupado }) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} disabled={ocupado}>
      {ocupado ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{titulo}</Text>}
    </TouchableOpacity>
  );
}

export function SetupAdminScreen({ onCreado }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirma, setConfirma] = useState('');
  const [ver, setVer] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del administrador.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Contraseña corta', 'Usa al menos 4 caracteres.');
      return;
    }
    if (password !== confirma) {
      Alert.alert('No coincide', 'La confirmación de la contraseña es distinta.');
      return;
    }
    setGuardando(true);
    try {
      const usuario = await crearUsuario({ nombre, password, rol: 'admin' });
      const clave = await guardarClaveRecuperacion(usuario.id);
      await registrarAccion(usuario, 'Creó la cuenta de administrador', usuario.nombre);
      onCreado(usuario, clave);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AccesoMarco>
      <Text style={s.ayuda}>Crea la cuenta de administrador. Solo esa cuenta puede borrar el historial de accesos.</Text>
      <ViewLabel>Nombre</ViewLabel>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} autoCapitalize="words" placeholder="Tu nombre" placeholderTextColor="#A0AAB4" />
      <ViewLabel>Contraseña</ViewLabel>
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry={!ver} placeholder="Mínimo 4 caracteres" placeholderTextColor="#A0AAB4" />
      <ViewLabel>Confirmar contraseña</ViewLabel>
      <TextInput style={s.input} value={confirma} onChangeText={setConfirma} secureTextEntry={!ver} placeholder="Repite la contraseña" placeholderTextColor="#A0AAB4" />
      <TouchableOpacity onPress={() => setVer((v) => !v)} style={{ marginTop: 8 }}>
        <Text style={s.link}>{ver ? 'Ocultar contraseña' : 'Ver contraseña'}</Text>
      </TouchableOpacity>
      <Boton titulo="Crear administrador" onPress={crear} ocupado={guardando} />
    </AccesoMarco>
  );
}

export function LoginScreen({ onIngreso }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [recuperar, setRecuperar] = useState(false);

  const entrar = async () => {
    if (!nombre.trim() || !password) {
      Alert.alert('Faltan datos', 'Escribe nombre y contraseña.');
      return;
    }
    setEntrando(true);
    try {
      const usuario = await ingresar(nombre, password);
      if (!usuario) {
        await registrarAccion({ id: null, nombre: nombre.trim() }, 'Intento de ingreso rechazado', nombre.trim());
        Alert.alert('No se pudo entrar', 'Nombre o contraseña incorrectos.');
        return;
      }
      await registrarAccion(usuario, 'Ingresó a la app', usuario.rol === 'admin' ? 'Administrador' : 'Usuario');
      onIngreso(usuario);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setEntrando(false);
    }
  };

  if (recuperar) {
    return <RecuperarScreen onVolver={() => setRecuperar(false)} />;
  }

  return (
    <AccesoMarco>
      <ViewLabel>Nombre</ViewLabel>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} autoCapitalize="words" placeholder="Tu nombre" placeholderTextColor="#A0AAB4" />
      <View style={s.labelRow}>
        <Text style={s.label}>Contraseña</Text>
        <TouchableOpacity onPress={() => setRecuperar(true)}>
          <Text style={s.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
      <View style={s.inputRow}>
        <TextInput
          style={s.inputFlex}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!ver}
          placeholder="Contraseña"
          placeholderTextColor="#A0AAB4"
        />
        <TouchableOpacity onPress={() => setVer((v) => !v)}>
          <Text style={s.ver}>{ver ? 'Ocultar' : 'Ver'}</Text>
        </TouchableOpacity>
      </View>
      <Boton titulo="Iniciar sesión" onPress={entrar} ocupado={entrando} />
    </AccesoMarco>
  );
}

function RecuperarScreen({ onVolver }) {
  const [clave, setClave] = useState('');
  const [password, setPassword] = useState('');
  const [confirma, setConfirma] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const guardar = async () => {
    if (password.length < 4 || password !== confirma) {
      Alert.alert('Contraseña', 'Escribe una contraseña de al menos 4 caracteres y confírmala.');
      return;
    }
    setOcupado(true);
    try {
      const ok = await restablecerConClave(clave, password);
      if (!ok) {
        Alert.alert('Clave incorrecta', 'Esa no es la clave de recuperación del administrador.');
        return;
      }
      Alert.alert('Listo', 'Ya puedes entrar con la contraseña nueva.');
      onVolver();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <AccesoMarco>
      <Text style={s.ayuda}>Escribe la clave de recuperación que anotaste al crear el administrador, y elige una contraseña nueva.</Text>
      <ViewLabel>Clave de recuperación</ViewLabel>
      <TextInput style={s.input} value={clave} onChangeText={setClave} autoCapitalize="characters" placeholder="XXXX-XXXX" placeholderTextColor="#A0AAB4" />
      <ViewLabel>Nueva contraseña</ViewLabel>
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 4 caracteres" placeholderTextColor="#A0AAB4" />
      <ViewLabel>Confirmar</ViewLabel>
      <TextInput style={s.input} value={confirma} onChangeText={setConfirma} secureTextEntry placeholder="Repite la contraseña" placeholderTextColor="#A0AAB4" />
      <Boton titulo="Guardar contraseña" onPress={guardar} ocupado={ocupado} />
      <TouchableOpacity onPress={onVolver} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={s.link}>Volver a iniciar sesión</Text>
      </TouchableOpacity>
    </AccesoMarco>
  );
}

export function AnotarClaveScreen({ clave, onListo }) {
  const [visto, setVisto] = useState(false);
  return (
    <AccesoMarco>
      <Text style={s.ayuda}>Anota esta clave fuera del teléfono. Sirve para recuperar la contraseña del administrador. No se vuelve a mostrar.</Text>
      <Text style={s.clave} selectable>{clave}</Text>
      <TouchableOpacity onPress={() => setVisto((v) => !v)}>
        <Text style={s.label}>{visto ? '☑ Ya la anoté' : '☐ Ya la anoté'}</Text>
      </TouchableOpacity>
      <Boton titulo="Continuar" onPress={() => visto && onListo()} ocupado={false} />
      {!visto ? <Text style={[s.ayuda, { marginTop: 10 }]}>Marca que ya la anotaste para continuar.</Text> : null}
    </AccesoMarco>
  );
}

function ViewLabel({ children }) {
  return (
    <View style={s.labelRow}>
      <Text style={s.label}>{children}</Text>
    </View>
  );
}

