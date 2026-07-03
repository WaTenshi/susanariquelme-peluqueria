import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectId = 'susanariquelme-peluqueria'
const databaseId = '(default)'

const categories = [
  {
    kicker: 'Corte',
    title: 'Corte de cabello',
    note: 'Incluye lavado y brushing.',
    accent: 'Precision',
    disclaimer: '',
    order: 1,
    active: true,
    items: [
      ['Corte', '$29.990'],
      ['Corte + peinado', '$39.990'],
    ],
  },
  {
    kicker: 'Eventos',
    title: 'Peinados',
    note: 'Incluye lavado y brushing.',
    accent: 'Look final',
    disclaimer: '',
    order: 2,
    active: true,
    items: [
      ['Ondas', '$14.990'],
      ['Peinado de fiesta', 'Desde $35.990'],
      ['Peinado de novia', 'Desde $65.990'],
    ],
  },
  {
    kicker: 'Salud capilar',
    title: 'Tratamientos capilares',
    note: 'Incluye lavado y brushing.',
    accent: 'Diagnostico',
    disclaimer: '',
    order: 3,
    active: true,
    items: [
      ['Tratamiento Inebrya', '$30.990'],
      ['Tratamiento K18', '$38.990'],
      ['Tratamiento Truss', '$38.990'],
      ['Botox Capilar S/M', '$40.990'],
      ['Botox Capilar L/XL', '$45.990'],
    ],
  },
  {
    kicker: 'Disciplina',
    title: 'Alisado',
    note: 'Incluye fluido antihumedad.',
    accent: 'Anti frizz',
    disclaimer: '',
    order: 4,
    active: true,
    items: [
      ['Corto', '$60.000'],
      ['Medio', '$80.000'],
      ['Largo', '$95.000'],
      ['Extra largo', '$110.000'],
    ],
  },
  {
    kicker: 'Colorimetria',
    title: 'Color',
    note: 'Incluye lavado nutritivo y brushing.',
    accent: 'Personalizado',
    disclaimer:
      'Si tu retoque tiene mas de 1 mes de crecimiento, se aplica un cargo adicional de $10.000 por cada mes extra.',
    order: 5,
    active: true,
    items: [
      ['Cintillo', '$25.990'],
      ['Retoque crecimiento', '$40.990'],
      ['Color global S', '$53.990'],
      ['Color global M', '$59.990'],
      ['Color global L', '$69.990'],
      ['Color global XL', '$79.990'],
      ['Falso crecimiento', '$25.990 / $38.990'],
    ],
  },
  {
    kicker: 'Mechas',
    title: 'Iluminacion y mechas',
    note: 'Incluye tratamiento profesional y peinado.',
    accent: 'Brillo',
    disclaimer: '',
    order: 6,
    active: true,
    items: [
      ['Mechas creativas', 'Desde $130.990'],
      ['Mechas con superaclarante', 'Desde $100.990'],
    ],
  },
  {
    kicker: 'Rizadas',
    title: 'Cabello rizado',
    note: 'Incluye lavado nutritivo.',
    accent: 'Definicion',
    disclaimer: '',
    order: 7,
    active: true,
    items: [
      ['Servicio rizadas S/M', '$25.990'],
      ['Servicio rizadas L/XL', '$39.990'],
    ],
  },
]

const slug = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const configPath = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.config',
  'configstore',
  'firebase-tools.json',
)

const getAccessToken = async () => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  if (
    config.tokens?.access_token &&
    config.tokens?.expires_at &&
    config.tokens.expires_at > Date.now() + 60_000
  ) {
    return config.tokens.access_token
  }

  const refreshToken = config.tokens?.refresh_token
  const clientId = config.tokens?.client_id
  const clientSecret = config.tokens?.client_secret

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('No se encontró una sesión válida de Firebase CLI.')
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`No se pudo refrescar el token: ${response.status}`)
  }

  return (await response.json()).access_token
}

const value = (input) => {
  if (typeof input === 'string') return { stringValue: input }
  if (typeof input === 'number') return { integerValue: String(input) }
  if (typeof input === 'boolean') return { booleanValue: input }
  return { nullValue: null }
}

const documentPayload = (data) => ({
  fields: Object.fromEntries(
    Object.entries(data).map(([key, item]) => [key, value(item)]),
  ),
})

const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`

const request = async (token, url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${options.method || 'GET'} ${url} failed: ${response.status} ${text}`)
  }
  return response.json()
}

const main = async () => {
  const token = await getAccessToken()
  const existing = await request(token, `${baseUrl}/serviceCategories?pageSize=1`).catch(
    (error) => {
      if (String(error.message).includes('404')) return {}
      throw error
    },
  )

  if (existing.documents?.length) {
    console.log('La colección serviceCategories ya tiene datos. No se duplicó el seed.')
    return
  }

  const now = new Date().toISOString()
  let itemCount = 0
  for (const category of categories) {
    const categoryId = slug(category.title)
    const { items, ...categoryData } = category
    await request(token, `${baseUrl}/serviceCategories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(
        documentPayload({ ...categoryData, createdAtText: now, updatedAtText: now }),
      ),
    })

    for (const [index, [name, price]] of items.entries()) {
      const itemId = `${categoryId}-${slug(name)}`
      await request(token, `${baseUrl}/serviceItems/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(
          documentPayload({
            categoryId,
            name,
            price,
            order: index + 1,
            active: true,
            createdAtText: now,
            updatedAtText: now,
          }),
        ),
      })
      itemCount += 1
    }
  }

  await request(token, `${baseUrl}/siteSettings/services`, {
    method: 'PATCH',
    body: JSON.stringify(documentPayload({ servicesInitialized: true, updatedAtText: now })),
  })
  await request(token, `${baseUrl}/systemSeeds/servicesV1`, {
    method: 'PATCH',
    body: JSON.stringify(
      documentPayload({
        key: 'servicesV1',
        categories: categories.length,
        items: itemCount,
        createdAtText: now,
      }),
    ),
  })

  console.log(`Seed listo: ${categories.length} categorías y ${itemCount} servicios.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
