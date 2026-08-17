import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'administracion', dest: '' },
        { src: 'assets', dest: '' },
        { src: 'css', dest: '' },
        { src: 'demos', dest: '' },
        { src: 'docs', dest: '' },
        { src: 'js', dest: '' },
        { src: 'plantillas', dest: '' }
      ]
    })
  ],
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
