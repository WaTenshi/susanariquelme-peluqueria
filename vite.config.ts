import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const requiredEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_CLOUDINARY_CLOUD_NAME',
  'VITE_CLOUDINARY_UPLOAD_PRESET',
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const missingEnvKeys = requiredEnvKeys.filter((key) => !env[key])

  if (missingEnvKeys.length) {
    throw new Error(
      `Faltan variables de entorno para el build: ${missingEnvKeys.join(', ')}`,
    )
  }

  return {
    base: '/susanariquelme-peluqueria/',
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  }
})
