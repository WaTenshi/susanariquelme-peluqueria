import { describe, expect, it } from 'vitest'
import {
  formatCLP,
  parseCatalogPrice,
  parseCLPNumber,
  serializeCatalogPrice,
} from '../src/admin-money'

describe('formato monetario CLP', () => {
  it('formatea números y textos con separadores chilenos', () => {
    expect(formatCLP(123123)).toBe('$ 123.123')
    expect(parseCLPNumber('$123.123')).toBe(123123)
    expect(formatCLP('')).toBe('')
  })

  it('reconoce formatos antiguos del catálogo', () => {
    expect(parseCatalogPrice('$60.000')).toMatchObject({
      mode: 'fixed',
      amounts: [60000],
    })
    expect(parseCatalogPrice('Desde $130.990')).toMatchObject({
      mode: 'from',
      amounts: [130990],
    })
    expect(parseCatalogPrice('$25.990 / $38.990')).toMatchObject({
      mode: 'range',
      amounts: [25990, 38990],
    })
    expect(parseCatalogPrice('Sujeto a evaluación')).toMatchObject({
      mode: 'custom',
    })
  })

  it('serializa formatos sin cambiar el contrato persistido', () => {
    expect(serializeCatalogPrice('fixed', [60000])).toBe('$60.000')
    expect(serializeCatalogPrice('from', [60000])).toBe('Desde $60.000')
    expect(serializeCatalogPrice('range', [60000, 80000])).toBe(
      '$60.000 / $80.000',
    )
    expect(serializeCatalogPrice('custom', [], 'A consultar')).toBe('A consultar')
  })
})
