export const getRequiredEnv = (key: string) => {
  const value = import.meta.env[key]

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  throw new Error(
    `Falta configurar ${key}. Revisa .env.local o los secrets del deploy.`,
  )
}
