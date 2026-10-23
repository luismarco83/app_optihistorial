# OptiHistorial

App offline-first para ópticas.

## Funciones incluidas
- Pacientes (alta, edición, búsqueda)
- Consultas / Graduaciones (OD, OI + Agudeza Visual)
- Evolución de graduaciones por fecha
- Ventas
- Temporizador de 30 días (aviso 7 días antes + bloqueo de escritura al vencer)
- Exportación local

## EAS Project
- Account: @luisjose
- Project: optihistorial
- Project ID: `3b678c4a-db4a-47bd-a273-ed67c9190987`

## Cómo generar la APK
```bash
npm install
eas login   # o usar EXPO_TOKEN
eas build --platform android --profile preview
```

## Estructura
```
src/
  screens/     → Pantallas de la app
  services/    → Base de datos SQLite + trial
  utils/       → Utilidades
```
