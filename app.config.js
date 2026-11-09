const vendedor = process.env.APP_VARIANT === 'vendedor';

module.exports = {
  expo: {
    name: vendedor ? 'OptiHistorial Claves' : 'OptiHistorial',
    slug: 'optihistorial',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0B5CAD',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: vendedor ? 'com.optihistorial.vendedor' : 'com.optihistorial.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0B5CAD',
      },
      package: vendedor ? 'com.optihistorial.vendedor' : 'com.optihistorial.app',
    },
    plugins: [['expo-notifications', { color: '#1B2437' }]],
    extra: {
      eas: {
        projectId: '3b678c4a-db4a-47bd-a273-ed67c9190987',
      },
      vendedor,
    },
    owner: 'luisjose',
  },
};
