# Configuración de Firebase

El código ya está conectado al proyecto `susanariquelme-peluqueria`. Las claves
del SDK web identifican el proyecto, pero no reemplazan las reglas de seguridad.

## 1. Crear la administradora

1. En Firebase Console, abrir **Authentication > Sign-in method**.
2. Habilitar **Correo electrónico/contraseña**.
3. En **Authentication > Users**, crear manualmente la cuenta de la estilista.
4. Copiar el UID de esa cuenta.
5. En Firestore, crear la colección `admins`.
6. Crear dentro un documento cuyo ID sea exactamente el UID copiado. El
   contenido puede ser `{ "enabled": true }`.

Las reglas comprueban la existencia de `admins/{uid}`. Una cuenta autenticada
que no figure allí no puede crear, editar ni eliminar contenido.

## 2. Crear la base de datos y publicar reglas

Crear una base de datos Cloud Firestore en modo producción y luego publicar:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

## 3. Imágenes y plan

El panel admite dos opciones:

- Pegar una URL pública de imagen.
- Subir JPG, PNG o WebP de hasta 1 MB.

Las cargas se guardan en una carpeta exclusiva, aceptan únicamente imágenes y
se reducen automáticamente a un máximo de 1600 × 1600 píxeles. La entrega
pública usa formato y calidad automáticos para reducir consumo de transferencia.

## 4. Analíticas

La web envía eventos a Google Analytics 4:

- `page_view`
- `section_view`
- `product_view`
- `product_whatsapp`
- `booking_open`
- `news_open`

También guarda una copia limitada en `analyticsEvents` para mostrar dentro del
panel las últimas 1.000 interacciones, sesiones, secciones y productos vistos.

GA4 ofrece informes más completos de adquisición, ubicación, dispositivos,
retención y campañas. Consultar esos informes dentro del panel mediante Google
Analytics Data API requiere un backend seguro con credenciales de servicio; las
credenciales nunca deben incluirse en React.

## 5. Protección adicional recomendada

Activar Firebase App Check con reCAPTCHA Enterprise o reCAPTCHA v3 antes de una
campaña de alto tráfico. Esto reduce eventos automatizados y abuso de las
cuotas públicas de Firestore.

No existe SQL en esta solución: el login usa Firebase Authentication y el CRUD
usa Firestore. La protección contra escrituras no autorizadas se aplica en el
servidor mediante `firestore.rules`, no mediante filtros del navegador.

## 6. Datos privados y trazabilidad

Las colecciones de clientas, atenciones, inventario, movimientos e historial
solo pueden leerse con una cuenta administradora autorizada. El catálogo y las
novedades mantienen lectura pública porque se muestran en la landing.

Cada alta, edición, archivo, eliminación y movimiento de stock crea un registro
independiente con la cuenta, fecha y detalle de los campos modificados. Los
registros del historial no pueden editarse ni eliminarse desde la aplicación.
