import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const projectId = 'susanariquelme-peluqueria'
const databaseRoot =
  `https://firestore.googleapis.com/v1/projects/${projectId}` +
  '/databases/(default)'
const documentsRoot = `${databaseRoot}/documents`
const documentNameRoot =
  `projects/${projectId}/databases/(default)/documents`
const configPath = join(
  homedir(),
  '.config',
  'configstore',
  'firebase-tools.json',
)

const products = [
  {
    id: 'kosswell-fit-balance-shampoo',
    brand: 'Kosswell Professional',
    title: 'Fit Balance Shampoo',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/kvzqe0ugixwhtqebpook',
    category: 'Equilibrio',
    description:
      'Shampoo regulador de sebo para la limpieza de cabello y cuero cabelludo con tendencia grasa.',
    benefits: [
      'Ayuda a equilibrar el cuero cabelludo',
      'Limpieza para raíces grasas',
      'Con aminoácidos y extractos vegetales',
    ],
    size: 'Formato profesional',
    order: 1,
    active: true,
    inventory: {
      sku: 'KOS-FIT-BAL',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'inebrya-keratin-restructuring-shampoo',
    brand: 'Inebrya',
    title: 'Ice Cream Keratin Restructuring Shampoo',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/sukhpwj4zjuzqi5nnkvx',
    category: 'Reconstrucción',
    description:
      'Shampoo reestructurante de la línea Ice Cream Keratin para la limpieza y el cuidado del cabello.',
    benefits: [
      'Limpieza reestructurante',
      'Cuidado del cabello tratado',
      'Formato profesional',
    ],
    size: '1000 ml',
    order: 2,
    active: true,
    inventory: {
      sku: 'INE-KER-SHA-1000',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'inebrya-keratin-restructuring-mask',
    brand: 'Inebrya',
    title: 'Ice Cream Keratin Restructuring Mask',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/ohcmgotbgtk5hn3wnjyc',
    category: 'Reconstrucción',
    description:
      'Mascarilla reestructurante de la línea Ice Cream Keratin para complementar el cuidado del cabello.',
    benefits: [
      'Tratamiento reestructurante',
      'Acondicionamiento profundo',
      'Ayuda a mejorar la manejabilidad',
    ],
    size: '500 ml',
    order: 3,
    active: true,
    inventory: {
      sku: 'INE-KER-MAS-500',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'inebrya-keratin-one',
    brand: 'Inebrya',
    title: 'Ice Cream Keratin One',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/mwj2lfztmxvqw8lpej1h',
    category: 'Reconstrucción',
    description:
      'Sérum en spray multiacción sin enjuague de la línea Ice Cream Keratin.',
    benefits: [
      'Aplicación sin enjuague',
      'Cuidado multiacción',
      'Formato en spray',
    ],
    size: '200 ml',
    order: 4,
    active: true,
    inventory: {
      sku: 'INE-KER-ONE-200',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'inebrya-shecare-glazed-shampoo',
    brand: 'Inebrya',
    title: 'Shecare Glazed Shampoo',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/u6x8dhwbkc9wjcwqdamz',
    category: 'Brillo',
    description:
      'Shampoo iluminador y laminante para cabello opaco, pensado para una limpieza que acompañe el brillo.',
    benefits: [
      'Limpieza iluminadora',
      'Efecto de brillo',
      'Ideal para cabello opaco',
    ],
    size: '300 ml',
    order: 5,
    active: true,
    inventory: {
      sku: 'INE-GLA-SHA-300',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'inebrya-shecare-glazed-mask',
    brand: 'Inebrya',
    title: 'Shecare Glazed Mask',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/xrc94tbfqq3qyhdjumbu',
    category: 'Brillo',
    description:
      'Mascarilla iluminadora y laminante para cabello opaco o deshidratado.',
    benefits: [
      'Aporta luminosidad',
      'Ayuda a acondicionar',
      'Cuidado para cabello deshidratado',
    ],
    size: '250 ml',
    order: 6,
    active: true,
    inventory: {
      sku: 'INE-GLA-MAS-250',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'glatten-fluido-acidificante',
    brand: 'Glatten Professional',
    title: 'Fluido Acidificante Ácidos do Bem',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/lrjzxonskfuus5opmsn5',
    category: 'Acidificación',
    description:
      'Tratamiento capilar acidificante pH 3, paso 2, indicado para ayudar a equilibrar el pH y sellar las cutículas.',
    benefits: [
      'Ayuda a equilibrar el pH',
      'Favorece el sellado de cutículas',
      'Cuidado para cabello poroso',
    ],
    size: '300 ml',
    order: 7,
    active: true,
    inventory: {
      sku: 'GLA-ACI-300',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'glatten-serum-luminous-repair',
    brand: 'Glatten Professional',
    title: 'Sérum Luminous Repair',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/bhh4sv8fh8kn2ufjfkio',
    category: 'Reparación',
    description:
      'Sérum reparador de acabado para aportar brillo, protección y suavidad al cabello.',
    benefits: [
      'Brillo y suavidad',
      'Protección térmica',
      'Ayuda a sellar la cutícula',
    ],
    size: '60 ml',
    order: 8,
    active: true,
    inventory: {
      sku: 'GLA-LUM-60',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
  {
    id: 'brazilian-hair-castor-oil-serum',
    brand: 'Brazilian Hair Seduction',
    title: 'Castor Oil Serum',
    price: 'Consultar',
    image: 'susana-riquelme/catalogo/fjg8nr8dz09vamftbtks',
    category: 'Nutrición',
    description:
      'Sérum con aceite de ricino para el cuidado y acabado de todo tipo de cabello.',
    benefits: [
      'Aporta brillo',
      'Ayuda a reducir el quiebre',
      'Apto para todo tipo de cabello',
    ],
    size: '60 ml',
    order: 9,
    active: true,
    inventory: {
      sku: 'BHS-CAS-60',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
    },
  },
]

const toValue = (value) => {
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toValue) } }
  }
  throw new Error(`Unsupported value type: ${typeof value}`)
}

const toFields = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toValue(value)]),
  )

const documentId = (document) => document.name.split('/').at(-1)

const listDocuments = async (collection, headers) => {
  const response = await fetch(
    `${documentsRoot}/${collection}?pageSize=500`,
    { headers },
  )
  if (!response.ok) {
    throw new Error(
      `Could not read ${collection}: ${response.status} ${await response.text()}`,
    )
  }
  const result = await response.json()
  return result.documents || []
}

const config = JSON.parse(await readFile(configPath, 'utf8'))
const accessToken = config.tokens?.access_token

if (!accessToken) {
  throw new Error('No active console session was found. Run the login command first.')
}

const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
}
const [currentProducts, currentInventory] = await Promise.all([
  listDocuments('products', headers),
  listDocuments('inventory', headers),
])
const timestamp = new Date().toISOString()
const auditSuffix = timestamp.replaceAll(/[^0-9]/g, '')
const writes = []

for (const document of currentProducts) {
  const id = documentId(document)
  const title = document.fields?.title?.stringValue || id
  writes.push({ delete: document.name })
  writes.push({
    update: {
      name: `${documentNameRoot}/auditLogs/catalog-replacement-${auditSuffix}-delete-${id}`,
      fields: {
        ...toFields({
          entityType: 'product',
          entityId: id,
          entityName: title,
          action: 'delete',
          changes: ['Producto retirado al reemplazar el catálogo oficial.'],
          actorUid: 'catalogo-oficial',
          actorEmail: 'Administración del catálogo',
        }),
        createdAt: { timestampValue: timestamp },
      },
    },
  })
}

for (const document of currentInventory) {
  writes.push({ delete: document.name })
}

for (const { id, inventory, ...product } of products) {
  writes.push({
    update: {
      name: `${documentNameRoot}/products/${id}`,
      fields: {
        ...toFields(product),
        createdAt: { timestampValue: timestamp },
        updatedAt: { timestampValue: timestamp },
      },
    },
  })
  writes.push({
    update: {
      name: `${documentNameRoot}/inventory/${id}`,
      fields: {
        ...toFields({ productId: id, ...inventory }),
        createdAt: { timestampValue: timestamp },
        updatedAt: { timestampValue: timestamp },
      },
    },
  })
  writes.push({
    update: {
      name: `${documentNameRoot}/auditLogs/catalog-replacement-${auditSuffix}-create-${id}`,
      fields: {
        ...toFields({
          entityType: 'product',
          entityId: id,
          entityName: product.title,
          action: 'create',
          changes: [
            'Producto oficial agregado al catálogo.',
            'Inventario inicial: 0 unidades.',
            'Precio pendiente: Consultar.',
          ],
          actorUid: 'catalogo-oficial',
          actorEmail: 'Administración del catálogo',
        }),
        createdAt: { timestampValue: timestamp },
      },
    },
  })
}

const response = await fetch(`${databaseRoot}/documents:commit`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ writes }),
})

if (!response.ok) {
  throw new Error(
    `Could not replace the catalog: ${response.status} ${await response.text()}`,
  )
}

console.log(
  [
    `${currentProducts.length} productos anteriores eliminados.`,
    `${currentInventory.length} registros de inventario anteriores eliminados.`,
    `${products.length} productos oficiales creados con stock inicial 0.`,
    'El historial anterior se conservó y el reemplazo quedó auditado.',
  ].join('\n'),
)
