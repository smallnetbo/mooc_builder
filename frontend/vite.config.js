import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Expone el servicio a la red exterior
    allowedHosts: ['seamovil.com'], // Permite tu dominio para evitar el bloqueo de Vite
    port: 5173,
    proxy: {
      // Reenvía /api/export al microservicio backend en desarrollo.
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
