import { describe, expect, it, vi } from 'vitest'
import {
  subscribeToNews,
  subscribeToProducts,
  subscribeToServiceCategories,
  subscribeToServiceItems,
  trackSiteEvent,
} from '../src/public-data'

const backend = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  subscribeToNews: vi.fn(),
  subscribeToProducts: vi.fn(),
  subscribeToServiceCategories: vi.fn(),
  subscribeToServiceItems: vi.fn(),
  trackSiteEvent: vi.fn(),
}))

vi.mock('../src/firebase', () => ({
  subscribeToNews: backend.subscribeToNews,
  subscribeToProducts: backend.subscribeToProducts,
  subscribeToServiceCategories: backend.subscribeToServiceCategories,
  subscribeToServiceItems: backend.subscribeToServiceItems,
  trackSiteEvent: backend.trackSiteEvent,
}))

describe('carga diferida de datos públicos', () => {
  it('conecta las suscripciones después de iniciar la interfaz', async () => {
    backend.subscribeToProducts.mockReturnValue(backend.unsubscribe)
    backend.subscribeToNews.mockReturnValue(backend.unsubscribe)
    backend.subscribeToServiceCategories.mockReturnValue(backend.unsubscribe)
    backend.subscribeToServiceItems.mockReturnValue(backend.unsubscribe)

    const productsData = vi.fn()
    const newsData = vi.fn()
    const categoriesData = vi.fn()
    const itemsData = vi.fn()
    const stop = [
      subscribeToProducts(productsData),
      subscribeToNews(newsData),
      subscribeToServiceCategories(categoriesData),
      subscribeToServiceItems(itemsData),
    ]

    await vi.waitFor(() => {
      expect(backend.subscribeToProducts).toHaveBeenCalledWith(productsData, undefined)
      expect(backend.subscribeToNews).toHaveBeenCalledWith(newsData, undefined)
      expect(backend.subscribeToServiceCategories).toHaveBeenCalledWith(categoriesData, undefined)
      expect(backend.subscribeToServiceItems).toHaveBeenCalledWith(itemsData, undefined)
    })

    stop.forEach((unsubscribe) => unsubscribe())
    expect(backend.unsubscribe).toHaveBeenCalledTimes(4)
  })

  it('mantiene opcionales las estadísticas aunque el backend falle', async () => {
    backend.trackSiteEvent.mockImplementationOnce(() => {
      throw new Error('sin conexión')
    })

    expect(() => trackSiteEvent('page_view')).not.toThrow()
    await vi.waitFor(() => expect(backend.trackSiteEvent).toHaveBeenCalledWith('page_view', {}))
  })
})
