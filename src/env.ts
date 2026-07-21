const publicClientEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_MESSAGING_SENDER_ID:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  VITE_CLOUDINARY_UPLOAD_PRESET:
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
} as const

export type PublicClientEnvKey = keyof typeof publicClientEnv

export const getRequiredEnv = (key: PublicClientEnvKey) => {
  const value = publicClientEnv[key]

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  throw new Error(
    `Falta configurar ${key}. Revisa .env.local o los secrets del deploy.`,
  )
}
