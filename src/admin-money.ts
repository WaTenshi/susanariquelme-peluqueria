export const formatCLPNumber = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)))

export const parseCLPNumber = (value: string | number) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return Number(value.replace(/\D/g, '')) || 0
}

export const formatCLP = (value: string | number) =>
  value === '' ? '' : `$ ${formatCLPNumber(parseCLPNumber(value))}`

export type CatalogPriceMode = 'fixed' | 'from' | 'range' | 'custom'

export type CatalogPriceValue = {
  mode: CatalogPriceMode
  amounts: number[]
  custom: string
}

export const parseCatalogPrice = (value: string): CatalogPriceValue => {
  const clean = value.trim()
  const amounts = [...clean.matchAll(/\d[\d.]*/g)].map((match) =>
    parseCLPNumber(match[0]),
  )
  if (/^desde\b/i.test(clean) && amounts.length) {
    return { mode: 'from', amounts: [amounts[0]], custom: clean }
  }
  if (clean.includes('/') && amounts.length >= 1) {
    return { mode: 'range', amounts: amounts.slice(0, 2), custom: clean }
  }
  if ((!clean || /^\$?\s*[\d.]+$/.test(clean)) && amounts.length <= 1) {
    return { mode: 'fixed', amounts, custom: clean }
  }
  return { mode: 'custom', amounts, custom: clean }
}

export const serializeCatalogPrice = (
  mode: CatalogPriceMode,
  amounts: number[],
  custom = '',
) => {
  if (mode === 'custom') return custom
  const first = amounts[0] ? `$${formatCLPNumber(amounts[0])}` : ''
  if (mode === 'from') return first ? `Desde ${first}` : ''
  if (mode === 'range') {
    const second = amounts[1] ? `$${formatCLPNumber(amounts[1])}` : ''
    return `${first} / ${second}`.trimEnd()
  }
  return first
}
