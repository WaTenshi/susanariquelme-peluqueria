# Despliegue en GitHub Pages

El sitio se publica con GitHub Actions desde la rama `main`. No se usa Firebase
Hosting.

## Secrets requeridos

Crear estos secrets en **Settings > Secrets and variables > Actions**:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

El workflow valida que todos existan antes de publicar. Si falta uno, el build
falla y no sube una versión rota.

## Seguridad

- Las claves `VITE_*` forman parte del bundle público de React; no deben usarse
  como credenciales privadas.
- La protección real de Firestore está en `firestore.rules`: solo una cuenta
  autenticada y registrada en `admins/{uid}` puede escribir datos.
- Restringir la API key de Firebase en Google Cloud Console por HTTP referrers:
  `https://watenshi.github.io/*` y, cuando exista, `https://susanariquelmepeluqueria.cl/*`.
- Mantener el upload preset de Cloudinary como unsigned, restringido a imágenes,
  tamaño máximo y carpeta del proyecto.
