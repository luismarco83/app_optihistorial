import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import PacienteFormScreen from './src/screens/PacienteFormScreen';
import PacienteDetailScreen from './src/screens/PacienteDetailScreen';
import ConsultaFormScreen from './src/screens/ConsultaFormScreen';
import VentaFormScreen from './src/screens/VentaFormScreen';
import VentasScreen from './src/screens/VentasScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';
import EvolucionScreen from './src/screens/EvolucionScreen';
import UsuariosScreen from './src/screens/UsuariosScreen';
import AuditoriaScreen from './src/screens/AuditoriaScreen';
import ImprimirPacientesScreen from './src/screens/ImprimirPacientesScreen';
import { LoginScreen, SetupAdminScreen } from './src/screens/AccesoScreen';
import { AuthContext } from './src/services/session';
import { hayAdministrador } from './src/services/auth';
import { registrarAccion } from './src/services/audit';
import { getDB } from './src/services/database';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PRIMARY = '#0A4D8C';

function PacientesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: PRIMARY },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'OptiHistorial',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Configuracion')}
              style={{ marginRight: 16, padding: 4 }}
            >
              <Text style={{ color: '#fff', fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="PacienteForm" component={PacienteFormScreen} options={{ title: 'Paciente' }} />
      <Stack.Screen name="PacienteDetail" component={PacienteDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="ConsultaForm" component={ConsultaFormScreen} options={{ title: 'Consulta' }} />
      <Stack.Screen name="VentaForm" component={VentaFormScreen} options={{ title: 'Venta' }} />
      <Stack.Screen name="Evolucion" component={EvolucionScreen} options={{ title: 'Evolución' }} />
      <Stack.Screen name="ImprimirPacientes" component={ImprimirPacientesScreen} options={{ title: 'Imprimir pacientes' }} />
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} options={{ title: 'Configuración' }} />
      <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Usuarios' }} />
      <Stack.Screen name="Auditoria" component={AuditoriaScreen} options={{ title: 'Historial de acceso' }} />
    </Stack.Navigator>
  );
}

function VentasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: PRIMARY },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="VentasList" component={VentasScreen} options={{ title: 'Ventas' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [listo, setListo] = useState(false);
  const [hayAdmin, setHayAdmin] = useState(false);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await getDB();
        setHayAdmin(await hayAdministrador());
      } catch (e) {
        console.error(e);
      } finally {
        setListo(true);
      }
    })();
  }, []);

  const registrar = useCallback(async (accion, detalle) => {
    await registrarAccion(usuario, accion, detalle);
  }, [usuario]);

  if (!listo) {
    return <View style={{ flex: 1, backgroundColor: '#0B5CAD' }} />;
  }
  if (!hayAdmin) {
    return (
      <SetupAdminScreen onCreado={(u) => { setHayAdmin(true); setUsuario(u); }} />
    );
  }
  if (!usuario) {
    return <LoginScreen onIngreso={setUsuario} />;
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      esAdmin: usuario.rol === 'admin',
      registrar,
      salir: () => setUsuario(null),
    }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: PRIMARY,
            tabBarInactiveTintColor: '#999',
          }}
        >
          <Tab.Screen
            name="PacientesTab"
            component={PacientesStack}
            options={{
              title: 'Pacientes',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
            }}
          />
          <Tab.Screen
            name="VentasTab"
            component={VentasStack}
            options={{
              title: 'Ventas',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛍️</Text>,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
