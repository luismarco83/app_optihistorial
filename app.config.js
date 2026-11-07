const app = require('./app.json');

const vendedor = process.env.APP_VARIANT === 'vendedor';

module.exports = {
  expo: {
    ...app.expo,
    name: vendedor ? 'OptiHistorial Claves' : app.expo.name,
    android: {
      ...app.expo.android,
      package: vendedor ? 'com.optihistorial.vendedor' : app.expo.android.package,
    },
    extra: {
      ...app.expo.extra,
      vendedor,
    },
    plugins: [
      ...(app.expo.plugins || []),
      ['expo-notifications', { color: '#1B2437' }],
    ],
  },
};
