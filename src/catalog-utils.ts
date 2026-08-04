import type { Product } from './types'

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

export const slugifyProductName = (value: string) =>
  normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const productLocator = (product: Product) =>
  `${slugifyProductName(product.title) || 'producto'}-${product.id || product.order}`

export const productDetailHref = (product: Product) =>
  `/productos/?producto=${encodeURIComponent(productLocator(product))}`

export const findProductByLocator = (products: Product[], locator: string) =>
  products.find(
    (product) =>
      productLocator(product) === locator ||
      Boolean(product.id && locator.endsWith(`-${product.id}`)),
  )

export const relatedProductsFor = (
  products: Product[],
  product: Product,
  limit = 4,
) =>
  products
    .filter((candidate) => candidate.active && candidate.id !== product.id)
    .sort((first, second) => {
      const firstRelevance = first.category === product.category
        ? 0
        : first.brand === product.brand
          ? 1
          : 2
      const secondRelevance = second.category === product.category
        ? 0
        : second.brand === product.brand
          ? 1
          : 2
      return firstRelevance - secondRelevance || first.order - second.order
    })
    .slice(0, limit)
