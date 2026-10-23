# OptiHistorial – Configuración de Build (Documentación)

**Fecha:** 22 de octubre 2026  
**Proyecto EAS:** @luisjose/optihistorial  
**Project ID:** 3b678c4a-db4a-47bd-a273-ed67c9190987  
**Owner:** luisjose

---

## 1. Objetivo de esta documentación
Guardar la configuración más limpia y estable conocida para generar APKs de OptiHistorial y evitar los problemas de builds fallidos que hemos tenido.

---

## 2. Configuración actual recomendada

### package.json (dependencias esenciales)
```json
{
  "name": "optihistorial",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-sqlite": "~15.0.0",
    "expo-file-system": "~18.0.0",
    "expo-sharing": "~13.0.0",
    "expo-secure-store": "~14.0.0",
    "react": "18.3.1",
    "react-native": "0.76.3",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "react-native-screens": "~4.1.0",
    "react-native-safe-area-context": "4.12.0",
    "date-fns": "^4.1.0"
  },
  "private": true
}
```

### app.json (configuración clave)
- slug: `optihistorial`
- package: `com.optihistorial.app`
- Color principal: `#0B5CAD`
- projectId: `3b678c4a-db4a-47bd-a273-ed67c9190987`
- owner: `luisjose`
- plugins: preferiblemente vacíos en el momento del build local (EAS los resuelve en el servidor) o `["expo-sqlite", "expo-secure-store"]`

### eas.json
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    }
  }
}
```

---

## 3. Comando de build recomendado
```bash
export EXPO_TOKEN=tu_token
EAS_BUILD_SKIP_LOCKFILE_CHECK=1 eas build --platform android --profile preview --non-interactive --no-wait
```

---

## 4. Lecciones aprendidas (problemas evitables)
- No subir builds desde entornos con timeouts de red/sandbox.
- Siempre tener `package-lock.json`.
- Evitar plugins que no se resuelven localmente si no hay `node_modules` completo.
- Preferir builds internos (`preview`) mientras se está en desarrollo.
- Mantener el proyecto Git limpio y con commits claros.
- No mezclar cambios grandes entre un build y otro.

---

## 5. Estado actual
- Builds exitosos hasta la fecha: 0
- Último intento: e748f984-432a-4da3-acf9-e73d11736d0f (errored)
- Esta documentación se actualizará en cuanto se logre el primer build exitoso.

---

## 6. Próximos pasos recomendados
1. Lograr un build exitoso con la configuración actual.
2. Actualizar este archivo con la configuración exacta que funcionó.
3. A partir de ahí, no desviarse de esa configuración base.
