import type {
  NewsItem,
  Product,
  ServiceCategory,
  ServiceItem,
  SiteEventName,
} from './types'

type Unsubscribe = () => void
type Subscription<T> = (
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
) => Unsubscribe

type PublicBackend = typeof import('./firebase')

let backendPromise: Promise<PublicBackend> | undefined

const loadBackend = () => {
  backendPromise ??= import('./firebase')
  return backendPromise
}

const asError = (error: unknown) =>
  error instanceof Error ? error : new Error('No se pudo conectar con los datos del sitio.')

const subscribeWhenReady = <T>(
  selectSubscription: (backend: PublicBackend) => Subscription<T>,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  let isActive = true
  let unsubscribe: Unsubscribe = () => undefined

  void loadBackend()
    .then((backend) => {
      if (!isActive) return
      unsubscribe = selectSubscription(backend)(onData, onError)
    })
    .catch((error: unknown) => {
      if (isActive) onError?.(asError(error))
    })

  return () => {
    isActive = false
    unsubscribe()
  }
}

export const subscribeToProducts = (
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
) => subscribeWhenReady((backend) => backend.subscribeToProducts, onData, onError)

export const subscribeToNews = (
  onData: (news: NewsItem[]) => void,
  onError?: (error: Error) => void,
) => subscribeWhenReady((backend) => backend.subscribeToNews, onData, onError)

export const subscribeToServiceCategories = (
  onData: (categories: ServiceCategory[]) => void,
  onError?: (error: Error) => void,
) => subscribeWhenReady(
  (backend) => backend.subscribeToServiceCategories,
  onData,
  onError,
)

export const subscribeToServiceItems = (
  onData: (items: ServiceItem[]) => void,
  onError?: (error: Error) => void,
) => subscribeWhenReady((backend) => backend.subscribeToServiceItems, onData, onError)

export const trackSiteEvent = (
  name: SiteEventName,
  details: {
    section?: string
    itemId?: string
    itemName?: string
  } = {},
) => {
  void loadBackend()
    .then((backend) => backend.trackSiteEvent(name, details))
    .catch(() => {
      // Las estadísticas son opcionales y nunca deben impedir usar el sitio.
    })
}
