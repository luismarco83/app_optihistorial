import React from 'react';

export const AuthContext = React.createContext({
  usuario: null,
  esAdmin: false,
  registrar: async () => {},
  salir: () => {},
});
