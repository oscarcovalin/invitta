import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        invitacion: resolve(__dirname, 'invitacion.html'),
        solicitar: resolve(__dirname, 'solicitar-invitacion.html'),
        invitacionLink: resolve(__dirname, 'invitacion-link.html')
      }
    }
  }
});
