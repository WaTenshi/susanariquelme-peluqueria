import { getRequiredEnv } from './env'

const cloudName = getRequiredEnv('VITE_CLOUDINARY_CLOUD_NAME')
const uploadPreset = getRequiredEnv('VITE_CLOUDINARY_UPLOAD_PRESET')
export const maxImageSize = 1024 * 1024

type UploadResponse = {
  public_id?: string
  error?: {
    message?: string
  }
}

export const uploadContentImage = async (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Usa una imagen JPG, PNG o WebP.')
  }

  if (file.size > maxImageSize) {
    throw new Error('La imagen debe pesar como máximo 1 MB.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      },
    )
    const result = (await response.json()) as UploadResponse

    if (!response.ok || !result.public_id) {
      throw new Error(
        result.error?.message || 'No fue posible subir la imagen.',
      )
    }

    return result.public_id
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La subida tardó demasiado. Intenta nuevamente.', {
        cause: error,
      })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
