import { describe, expect, it } from 'vitest'
import {
  findProductByLocator,
  normalizeSearchText,
  productDetailHref,
  productLocator,
  relatedProductsFor,
} from '../src/catalog-utils'
import type { Product } from '../src/types'

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'producto1',
  brand: 'Inebrya',
  title: 'Sérum Reparación Intensa',
  price: '$19.990',
  discountPercent: 0,
  image: '/producto.webp',
  images: [],
  category: 'Reconstrucción',
  description: 'Descripción',
  benefits: [],
  activePrinciples: '',
  usage: '',
  precautions: '',
  result: '',
  size: '100 ml',
  order: 1,
  active: true,
  ...overrides,
})

describe('rutas y relaciones del catálogo', () => {
  it('normaliza nombres con acentos para búsquedas y URLs', () => {
    expect(normalizeSearchText('Sérum Ácido')).toBe('serum acido')
    expect(productLocator(makeProduct())).toBe('serum-reparacion-intensa-producto1')
  })

  it('genera una URL compatible con la ruta estática de productos', () => {
    expect(productDetailHref(makeProduct())).toBe(
      '/productos/?producto=serum-reparacion-intensa-producto1',
    )
  })

  it('encuentra el producto por su id aunque posteriormente cambie el nombre', () => {
    const product = makeProduct({ title: 'Nombre actualizado' })
    expect(
      findProductByLocator([product], 'nombre-anterior-producto1'),
    ).toBe(product)
  })

  it('prioriza categoría, luego marca, excluye inactivos y respeta el límite', () => {
    const current = makeProduct()
    const sameCategory = makeProduct({ id: '2', title: 'Categoría', order: 3 })
    const sameBrand = makeProduct({ id: '3', title: 'Marca', category: 'Hidratación', order: 1 })
    const unrelated = makeProduct({ id: '4', title: 'Otro', brand: 'Otra', category: 'Color', order: 0 })
    const inactive = makeProduct({ id: '5', title: 'Oculto', active: false, order: 0 })

    expect(
      relatedProductsFor([unrelated, inactive, sameBrand, sameCategory], current, 3)
        .map((product) => product.id),
    ).toEqual(['2', '3', '4'])
  })
})
