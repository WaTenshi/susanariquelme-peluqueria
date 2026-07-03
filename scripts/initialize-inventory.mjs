import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const projectId = 'susanariquelme-peluqueria'
const config = JSON.parse(
  await readFile(
    join(homedir(), '.config', 'configstore', 'firebase-tools.json'),
    'utf8',
  ),
)
const accessToken = config.tokens?.access_token

if (!accessToken) {
  throw new Error('No hay una sesión de consola activa.')
}

const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
}
const documentsRoot =
  `https://firestore.googleapis.com/v1/projects/${projectId}` +
  '/databases/(default)/documents'
const productsResponse = await fetch(`${documentsRoot}/products?pageSize=100`, {
  headers,
})

if (!productsResponse.ok) {
  throw new Error(`No fue posible consultar productos: ${productsResponse.status}`)
}

const products = (await productsResponse.json()).documents || []
let created = 0
let existing = 0

for (const product of products) {
  const productId = product.name.split('/').at(-1)
  const inventoryUrl = `${documentsRoot}/inventory/${productId}`
  const current = await fetch(inventoryUrl, { headers })

  if (current.ok) {
    existing++
    continue
  }

  if (current.status !== 404) {
    throw new Error(`No fue posible revisar inventario de ${productId}.`)
  }

  const response = await fetch(inventoryUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      fields: {
        productId: { stringValue: productId },
        sku: { stringValue: '' },
        stock: { integerValue: '0' },
        minimumStock: { integerValue: '2' },
        costPrice: { integerValue: '0' },
        supplier: { stringValue: '' },
        location: { stringValue: '' },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`No fue posible inicializar ${productId}: ${response.status}`)
  }
  created++
}

console.log(`Inventarios creados: ${created}`)
console.log(`Inventarios existentes: ${existing}`)
