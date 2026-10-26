import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import PacienteFormScreen from './src/screens/PacienteFormScreen';
import PacienteDetailScreen from './src/screens/PacienteDetailScreen';
import ConsultaFormScreen from './src/screens/ConsultaFormScreen';
import VentaFormScreen from './src/screens/VentaFormScreen';
import VentasScreen from './src/screens/VentasScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';
import EvolucionScreen from './src/screens/EvolucionScreen';

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
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} options={{ title: 'Configuración' }} />
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
  return (
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
  );
}
