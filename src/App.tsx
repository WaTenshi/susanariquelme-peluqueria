import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Grid2x2,
  Grid3x3,
  Rows3,
  Sparkles,
} from 'lucide-react'
import './App.css'
import {
  subscribeToNews,
  subscribeToProducts,
  subscribeToServiceCategories,
  subscribeToServiceItems,
  trackSiteEvent,
} from './firebase'
import type { NewsItem, Product, ServiceCategory, ServiceItem } from './types'
import ContentImage from './ContentImage'
import { initialServiceCategories } from './servicesContent'

import brazilianLogo from './assets/eef019e6-2c79-4ceb-ae07-f48716d5bb3f.png'
import glattenLogo from './assets/glatten-professional-logo.png'
import inebryaLogo from './assets/inebrya_white.svg'
import lorealLogo from './assets/images.png'
import salonHero from './assets/web-IMG_6610.jpg'
import salonFacade from './assets/web-IMG_6619.jpg'
import salonReception from './assets/web-IMG_6608.jpg'
import salonJewelry from './assets/web-IMG_6612.jpg'
import salonJewelryDetail from './assets/web-IMG_6613.jpg'
import salonStations from './assets/web-IMG_6614.jpg'
import salonLogoDetail from './assets/web-IMG_6615.jpg'
import srLogoBlack from './assets/SRLOGOSINFONDO.png'
import srLogoWhite from './assets/SR BLANCA SINFONDO.png'
import trussLogo from './assets/TRUSS-Professional-Branco-opt.webp'
import mariaJosePhoto from './assets/MARIAJOSE.jpeg'
import moiraPhoto from './assets/MOIRA.jpeg'
import claudiaPhoto from './assets/CLAUDIA.jpeg'

const AdminPanel = lazy(() => import('./AdminPanel'))

const whatsappNumber = '56986327850'
const instagramUrl = 'https://www.instagram.com/susanariquelmepeluqueria/'
const facebookUrl = 'https://web.facebook.com/Susanariquelmeestilista/?_rdc=1&_rdr#'
const tiktokUrl = 'https://www.tiktok.com/@salonsusanariquelme'
type StoreGridColumns = 1 | 2 | 3

const storeGridOptions = [
  { columns: 1 as const, label: 'Vista amplia', Icon: Rows3 },
  { columns: 2 as const, label: 'Ver 2 columnas', Icon: Grid2x2 },
  { columns: 3 as const, label: 'Ver 3 columnas', Icon: Grid3x3 },
]

const whatsappHref = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const formatNewsDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(
    new Date(`${value}T12:00:00`),
  )
}

const hasVisibleProductPrice = (price: string) => {
  const normalizedPrice = price.trim().toLocaleLowerCase('es')
  return normalizedPrice !== '' && normalizedPrice !== 'consultar'
}

const productPriceLabel = (price: string) =>
  hasVisibleProductPrice(price) ? price : 'Consultar'

const brandLogos = [
  { name: 'TRUSS Professional', image: trussLogo },
  { name: 'L\'Oreal Paris', image: lorealLogo },
  { name: 'Inebrya', image: inebryaLogo },
  { name: 'Brasilian Hair Seduction', image: brazilianLogo },
  { name: 'Glatten Professional', image: glattenLogo },
]

const footerSocialLinks = [
  { name: 'Instagram', url: instagramUrl, icon: 'instagram' },
  { name: 'Facebook', url: facebookUrl, icon: 'facebook' },
  { name: 'TikTok', url: tiktokUrl, icon: 'tiktok' },
  {
    name: 'WhatsApp',
    url: whatsappHref('Hola Susana Riquelme Peluquería, quiero hacer una consulta.'),
    icon: 'whatsapp',
  },
]

const team = [
  {
    name: 'María José Abarzúa',
    role: 'Directora y Estilista Senior',
    initials: 'MJ',
    image: mariaJosePhoto,
    description:
      'María José cree que cada cabello tiene necesidades únicas. Por eso, su trabajo se basa en la asesoría personalizada, el cuidado capilar y la creación de resultados que reflejen la esencia de cada clienta en un ambiente de confianza y bienestar.',
    specialties: [
      'Diagnóstico capilar',
      'Rubios personalizados',
      'Morenas iluminadas',
      'Reparación capilar',
      'Experta en rizos',
      'Asesoría de productos profesionales',
    ],
  },
  {
    name: 'Moira',
    role: 'Colorista y Especialista en Corrección de Color',
    initials: 'M',
    image: moiraPhoto,
    description:
      'Moira se caracteriza por su responsabilidad, dedicación y atención al detalle. Disfruta especialmente los desafíos técnicos, transformando cabellos complejos en resultados armónicos y saludables. Su enfoque perfeccionista y su compromiso con cada trabajo le permiten abordar correcciones de color y rubios personalizados con precisión y confianza.',
    specialties: [
      'Corrección de color',
      'Rubios personalizados',
      'Diseño de mechas',
      'Transformaciones capilares',
      'Neutralización de tonos no deseados',
      'Diagnóstico capilar',
      'Reparación capilar',
      'Alisados',
    ],
  },
  {
    name: 'Claudia',
    role: 'Colorista y Estilista Integral',
    initials: 'C',
    image: claudiaPhoto,
    description:
      'Con más de 10 años de experiencia, Claudia se caracteriza por su cercanía, energía positiva y dedicación hacia cada clienta. Su objetivo es crear resultados personalizados en un ambiente de confianza, haciendo que cada visita sea una experiencia agradable y acogedora.',
    specialties: [
      'Tonos cobrizos',
      'Rubios personalizados',
      'Morena iluminada',
      'Diseño de mechas',
      'Visos',
      'Coloración personalizada',
    ],
  },
]

const undecidedSpecialistOption = 'No sé con cual estilista atenderme'

const historyHighlights = [
  {
    label: 'Origen',
    title: 'Una historia que nació desde la pasión por la belleza',
    text:
      'Susana Riquelme nació en 2019 en Penco, comenzando como un pequeño espacio llamado Cute Nails. Un lugar simple, pero con una visión clara: crear una experiencia de belleza cercana, profesional y con sentido.',
  },
  {
    label: 'Evolución',
    title: 'Crecimiento con propósito',
    text:
      'Con el tiempo, el proyecto creció y evolucionó hacia Concepción, pasando por distintas etapas, espacios y aprendizajes que fueron construyendo lo que hoy es la marca.',
  },
  {
    label: 'Identidad',
    title: 'Raíces, historia y significado',
    text:
      'El nombre Susana Riquelme nace como un homenaje personal. Más que una marca, representa una filosofía basada en el respeto por las personas, el trabajo en equipo y la experiencia de cada clienta.',
  },
]

const historyTimeline = [
  {
    date: '2019',
    place: 'Penco',
    title: 'Inicio como Cute Nails',
    text: 'El proyecto comienza con servicios de uñas y peluquería básica.',
  },
  {
    date: 'Crecimiento',
    place: 'Nueva etapa',
    title: 'Expansión del servicio',
    text: 'Primeras experiencias de desarrollo del salón y fortalecimiento de la propuesta.',
  },
  {
    date: 'Concepción',
    place: 'Centro',
    title: 'Mayor espacio y clientela',
    text: 'Mudanza a oficina en Concepción, con más comodidad y nuevas oportunidades.',
  },
  {
    date: 'Plaza de Armas',
    place: 'Piso 7',
    title: 'Consolidación profesional',
    text: 'El servicio se fortalece en un espacio más amplio, formal y preparado para crecer.',
  },
  {
    date: 'Actualidad',
    place: 'Susana Riquelme',
    title: 'Identidad propia',
    text: 'Nace la marca actual y se consolida el equipo de trabajo con una mirada clara.',
  },
]

const buildServiceGroups = (
  categories: ServiceCategory[],
  items: ServiceItem[],
) =>
  [...categories]
    .filter((category) => category.active)
    .sort((first, second) => first.order - second.order)
    .map((category) => ({
      ...category,
      items: items
        .filter((item) => item.active && item.categoryId === category.id)
        .sort((first, second) => first.order - second.order),
    }))

const useServiceGroups = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [items, setItems] = useState<ServiceItem[]>([])

  const liveGroups = useMemo(
    () => buildServiceGroups(categories, items),
    [categories, items],
  )

  useEffect(() => {
    const unsubscribeCategories = subscribeToServiceCategories(setCategories)
    const unsubscribeItems = subscribeToServiceItems(setItems)

    return () => {
      unsubscribeCategories()
      unsubscribeItems()
    }
  }, [])

  return liveGroups.some((group) => group.items.length)
    ? liveGroups
    : initialServiceCategories
}

type PageMetadata = {
  title: string
  description: string
  canonicalPath: string
}

const usePageMetadata = ({ title, description, canonicalPath }: PageMetadata) => {
  useEffect(() => {
    const canonicalUrl = `https://susanariquelmepeluqueria.cl${canonicalPath}`
    document.title = title

    const updateMeta = (selector: string, content: string) => {
      document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
    }

    updateMeta('meta[name="description"]', description)
    updateMeta('meta[property="og:title"]', title)
    updateMeta('meta[property="og:description"]', description)
    updateMeta('meta[property="og:url"]', canonicalUrl)
    updateMeta('meta[name="twitter:title"]', title)
    updateMeta('meta[name="twitter:description"]', description)
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute('href', canonicalUrl)
  }, [canonicalPath, description, title])
}

const getServiceSectionId = (title: string) =>
  `servicio-${normalizeSearchText(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`

const isSmoothingService = (title: string) =>
  normalizeSearchText(title).includes('alisad')

const getHairLength = (name: string) => {
  const normalizedName = normalizeSearchText(name)

  if (normalizedName.includes('extra')) return 'extra-long'
  if (normalizedName.includes('medio')) return 'medium'
  if (normalizedName.includes('largo')) return 'long'
  return 'short'
}

type SmoothingServiceCardProps = {
  group: ServiceCategory
  onBook: (service?: string) => void
}

function SmoothingServiceCard({ group, onBook }: SmoothingServiceCardProps) {
  const [selectedItemName, setSelectedItemName] = useState(
    group.items[0]?.name || '',
  )
  const selectedItem =
    group.items.find((item) => item.name === selectedItemName) || group.items[0]

  if (!selectedItem) return null

  const selectedService = `${group.title} - ${selectedItem.name} (${selectedItem.price})`

  return (
    <section
      className="service-block smoothing-service"
      id={getServiceSectionId(group.title)}
    >
      <header className="smoothing-service-header">
        <div>
          <div className="service-block-head">
            <span>{group.kicker}</span>
            <small>{group.accent}</small>
          </div>
          <h3>Alisado a tu medida.</h3>
          <p>
            Selecciona el largo que más se parece al tuyo para visualizar el
            servicio y conocer su valor referencial.
          </p>
        </div>
        <span className="smoothing-feature-badge">
          <Sparkles aria-hidden="true" size={15} />
          Experiencia interactiva
        </span>
      </header>

      <div className="smoothing-experience">
        <div className="smoothing-options-panel">
          <p className="smoothing-includes">
            <Check aria-hidden="true" size={16} />
            {group.note || 'Incluye fluido antihumedad.'}
          </p>
          <div className="smoothing-options" aria-label="Seleccionar largo del cabello">
            {group.items.map((item) => {
              const isSelected = item.name === selectedItem.name

              return (
                <button
                  className={isSelected ? 'is-selected' : ''}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedItemName(item.name)}
                  key={item.name}
                >
                  <span className="smoothing-option-marker" aria-hidden="true" />
                  <span>
                    <small>Largo</small>
                    <strong>{item.name}</strong>
                  </span>
                  <b>{item.price}</b>
                </button>
              )
            })}
          </div>
          <p className="smoothing-disclaimer">
            *{group.disclaimer || 'Valor sujeto a evaluación según largo y cantidad de cabello.'}
          </p>
        </div>

        <div className="hair-visualizer">
          <div className="hair-visualizer-label">
            <span>Vista referencial</span>
            <small>El largo cambia con tu selección</small>
          </div>
          <div
            className="hair-stage"
            data-length={getHairLength(selectedItem.name)}
            aria-hidden="true"
          >
            <div className="hair-guide hair-guide-short"><span>Corto</span></div>
            <div className="hair-guide hair-guide-medium"><span>Medio</span></div>
            <div className="hair-guide hair-guide-long"><span>Largo</span></div>
            <div className="hair-guide hair-guide-extra"><span>Extra largo</span></div>
            <div className="hair-model">
              <div className="hair-model-head" />
              <div className="hair-model-neck" />
              <div className="hair-model-body" />
              <div className="hair-shape" />
            </div>
          </div>
          <div className="hair-selection-summary" aria-live="polite">
            <span>Alisado · {selectedItem.name}</span>
            <strong>{selectedItem.price}</strong>
          </div>
        </div>
      </div>

      <footer className="smoothing-service-footer">
        <p>
          La evaluación en salón confirma el valor final y el protocolo ideal
          para tu cabello.
        </p>
        <button type="button" onClick={() => onBook(selectedService)}>
          Reservar esta opción
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </footer>
    </section>
  )
}

const productsPerPage = 9

const alliances = [
  {
    name: 'Servicios de belleza',
    handle: '@jossecalabriano',
    url: 'https://www.instagram.com/jossecalabriano/',
    initials: 'JC',
    label: 'Colaboración externa',
    description:
      'Dentro de nuestro espacio contamos con una profesional independiente especializada en servicios de uñas, manos, pies y pestañas. Su atención funciona de manera autónoma dentro del salón, complementando nuestra experiencia de belleza.',
    highlights: [
      'Uñas',
      'Manos y pies',
      'Pestañas',
      'Atención personalizada dentro del salón',
    ],
    image: salonStations,
  },
  {
    name: 'Betina Joyas',
    handle: '@bettina_joyas',
    url: 'https://www.instagram.com/bettina_joyas/',
    initials: 'BJ',
    label: 'Punto de venta autorizado',
    description:
      'En nuestro salón encontrarás una selección exclusiva de joyas Betina, disponibles para venta directa en tienda. Betina es una marca independiente y Susana Riquelme actúa como punto de venta autorizado dentro de su espacio.',
    highlights: [
      'Elegancia, diseño y estilo',
      'Selección disponible en tienda',
      'Compra directa en el salón',
    ],
    image: salonJewelryDetail,
  },
]

const gallery = [
  {
    src: salonFacade,
    alt: 'Entrada de Susana Riquelme Salon de Belleza',
  },
  {
    src: salonReception,
    alt: 'Recepción y área principal del salón Susana Riquelme',
  },
  {
    src: salonHero,
    alt: 'Área principal del salón con sillones y productos profesionales',
  },
  {
    src: salonStations,
    alt: 'Estaciones de peluquería del salón',
  },
  {
    src: salonJewelry,
    alt: 'Vitrina de joyas disponibles en el salón',
  },
  {
    src: salonLogoDetail,
    alt: 'Detalle del logo interior de Susana Riquelme',
  },
]

const socialFrames = [
  {
    name: 'Instagram',
    url: instagramUrl,
    iframe:
      'https://www.instagram.com/susanariquelmepeluqueria/embed',
  },
  {
    name: 'Facebook',
    url: facebookUrl,
    iframe:
      'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fweb.facebook.com%2FSusanariquelmeestilista%2F&tabs=timeline&width=500&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false',
  },
  {
    name: 'TikTok',
    url: tiktokUrl,
    iframe: 'https://www.tiktok.com/embed/@salonsusanariquelme',
  },
]

const mapSrc =
  'https://www.google.com/maps?q=Caupolican%20246%20departamento%20101%20Concepcion%20Chile&output=embed'
const googleReviewUrl =
  'https://www.google.com/search?q=Susana+Riquelme+Peluquer%C3%ADa+Caupolic%C3%A1n+246+Concepci%C3%B3n+rese%C3%B1as#lrd=0x96684db67bf3f69d:0x9821ecc2b0340f4a,3,,,,'

function SocialIcon({ icon }: { icon: string }) {
  if (icon === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.2" cy="6.8" r="0.9" />
      </svg>
    )
  }

  if (icon === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8.2h2.2V4.4c-.4-.1-1.7-.2-3.2-.2-3.1 0-5.2 1.9-5.2 5.5v3.1H4.3V17h3.5v6h4.3v-6h3.4l.5-4.2h-3.9v-2.7c0-1.2.3-1.9 1.9-1.9Z" />
      </svg>
    )
  }

  if (icon === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.4 3.5c.5 3.1 2.2 4.9 5.1 5.1v4.1a8.2 8.2 0 0 1-4.9-1.6v6.1c0 3.9-2.5 6.3-6.1 6.3a6 6 0 0 1-6-6c0-3.9 3.1-6.4 7.1-6v4.2c-1.8-.3-2.9.6-2.9 1.9 0 1.1.8 1.9 1.9 1.9 1.3 0 2-.8 2-2.4V3.5h3.8Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.2 3.8A10.2 10.2 0 0 0 3.9 15.7L2.5 21.5l5.9-1.5a10.2 10.2 0 0 0 4.9 1.2A10.2 10.2 0 0 0 20.2 3.8Zm-6.9 15.5a8.3 8.3 0 0 1-4.2-1.1l-.3-.2-3.5.9.9-3.4-.2-.4a8.2 8.2 0 1 1 7.3 4.2Zm4.6-6.1c-.2-.1-1.5-.7-1.8-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.9 1-.2.2-.3.2-.6.1a6.8 6.8 0 0 1-3.4-3c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.5-.4-.6-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  )
}

function Landing() {
  usePageMetadata({
    title: 'Peluquería y Colorimetría en Concepción | Susana Riquelme',
    description:
      'Peluquería en Concepción especializada en colorimetría, rubios, alisados, tratamientos capilares, cortes y asesoría personalizada.',
    canonicalPath: '/',
  })
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedTeamMember, setSelectedTeamMember] = useState<
    (typeof team)[number] | null
  >(null)
  const [managedProducts, setManagedProducts] = useState<Product[]>([])
  const [managedNews, setManagedNews] = useState<NewsItem[]>([])
  const [managedServiceCategories, setManagedServiceCategories] = useState<
    ServiceCategory[]
  >([])
  const [managedServiceItems, setManagedServiceItems] = useState<ServiceItem[]>([])
  const [productQuery, setProductQuery] = useState('')
  const [selectedProductBrand, setSelectedProductBrand] = useState('Todos')
  const [selectedProductCategory, setSelectedProductCategory] = useState('Todas')
  const [productSort, setProductSort] = useState('featured')
  const [productPage, setProductPage] = useState(1)
  const [clientName, setClientName] = useState('')
  const [selectedSpecialist, setSelectedSpecialist] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [clientMessage, setClientMessage] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const products = useMemo(
    () => managedProducts.filter((product) => product.active),
    [managedProducts],
  )
  const newsItems = useMemo(
    () => managedNews.filter((item) => item.active),
    [managedNews],
  )
  const liveServiceGroups = useMemo(() => {
    return buildServiceGroups(managedServiceCategories, managedServiceItems)
  }, [managedServiceCategories, managedServiceItems])
  const serviceGroups = liveServiceGroups.some((group) => group.items.length)
    ? liveServiceGroups
    : initialServiceCategories
  const serviceOptions = useMemo(
    () =>
      serviceGroups.flatMap((group) =>
        group.items.map((item) => `${group.title} - ${item.name} (${item.price})`),
      ),
    [serviceGroups],
  )
  const currentSelectedService = useMemo(
    () =>
      selectedService && serviceOptions.includes(selectedService)
        ? selectedService
        : serviceOptions[0] || '',
    [selectedService, serviceOptions],
  )
  const productBrands = useMemo(
    () => ['Todos', ...new Set(products.map((product) => product.brand))],
    [products],
  )
  const productCategories = useMemo(
    () => ['Todas', ...new Set(products.map((product) => product.category))],
    [products],
  )

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(setManagedProducts)
    const unsubscribeNews = subscribeToNews(setManagedNews)
    const unsubscribeServiceCategories = subscribeToServiceCategories(
      setManagedServiceCategories,
    )
    const unsubscribeServiceItems = subscribeToServiceItems(setManagedServiceItems)
    trackSiteEvent('page_view')

    const seenSections = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || seenSections.has(entry.target.id)) return
          seenSections.add(entry.target.id)
          trackSiteEvent('section_view', { section: entry.target.id })
        })
      },
      { threshold: 0.35 },
    )

    document
      .querySelectorAll<HTMLElement>('main section[id]')
      .forEach((section) => observer.observe(section))

    return () => {
      unsubscribeProducts()
      unsubscribeNews()
      unsubscribeServiceCategories()
      unsubscribeServiceItems()
      observer.disconnect()
    }
  }, [])

  const bookingMessage = useMemo(() => {
    const lines = [
      'Hola Susana Riquelme Peluquería, quiero reservar una hora.',
      `Nombre: ${clientName || 'Por completar'}`,
      `Especialista: ${selectedSpecialist || 'Por definir'}`,
      `Servicio: ${currentSelectedService || 'Consulta general'}`,
      `Mensaje: ${clientMessage || 'Sin mensaje adicional'}`,
    ]

    return lines.join('\n')
  }, [clientMessage, clientName, currentSelectedService, selectedSpecialist])

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(productQuery.trim())

    const matches = products.filter((product) => {
      const matchesBrand =
        selectedProductBrand === 'Todos' || product.brand === selectedProductBrand
      const matchesCategory =
        selectedProductCategory === 'Todas' ||
        product.category === selectedProductCategory
      const searchableText = [
        product.title,
        product.brand,
        product.category,
        product.description,
        ...product.benefits,
      ].join(' ')
      const normalizedSearchableText = normalizeSearchText(searchableText)

      return (
        matchesBrand &&
        matchesCategory &&
        (!query || normalizedSearchableText.includes(query))
      )
    })

    return [...matches].sort((firstProduct, secondProduct) => {
      if (productSort === 'price-asc') {
        return Number(firstProduct.price.replace(/\D/g, '')) -
          Number(secondProduct.price.replace(/\D/g, ''))
      }

      if (productSort === 'price-desc') {
        return Number(secondProduct.price.replace(/\D/g, '')) -
          Number(firstProduct.price.replace(/\D/g, ''))
      }

      if (productSort === 'name') {
        return firstProduct.title.localeCompare(secondProduct.title, 'es')
      }

      return 0
    })
  }, [productQuery, productSort, products, selectedProductBrand, selectedProductCategory])

  const totalProductPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  )
  const visibleProducts = filteredProducts.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage,
  )
  const firstVisibleProduct = filteredProducts.length
    ? (productPage - 1) * productsPerPage + 1
    : 0
  const lastVisibleProduct = Math.min(
    productPage * productsPerPage,
    filteredProducts.length,
  )
  const hasActiveProductFilters =
    productQuery.trim() !== '' ||
    selectedProductBrand !== 'Todos' ||
    selectedProductCategory !== 'Todas'

  const resetProductFilters = () => {
    setProductQuery('')
    setSelectedProductBrand('Todos')
    setSelectedProductCategory('Todas')
    setProductSort('featured')
    setProductPage(1)
  }

  const changeProductPage = (page: number) => {
    setProductPage(page)
    window.requestAnimationFrame(() => {
      document
        .getElementById('product-results')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const openBooking = (service?: string) => {
    if (service) {
      setSelectedService(service)
    }

    setIsBookingOpen(true)
    setIsMenuOpen(false)
    trackSiteEvent('booking_open', { itemName: service || 'Reserva general' })
  }

  const openProduct = (product: Product) => {
    setSelectedProduct(product)
    trackSiteEvent('product_view', {
      itemId: product.id || product.title,
      itemName: product.title,
      section: product.category,
    })
  }

  useEffect(() => {
    const isModalOpen =
      isBookingOpen || selectedProduct !== null || selectedTeamMember !== null
    document.body.style.overflow = isModalOpen ? 'hidden' : ''

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsBookingOpen(false)
        setSelectedProduct(null)
        setSelectedTeamMember(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isBookingOpen, selectedProduct, selectedTeamMember])

  return (
    <div className="app-shell">
      <header className={`site-header ${isMenuOpen ? 'is-menu-open' : ''}`}>
        <a
          className="brand"
          href="/"
          aria-label="Ir al inicio"
          onClick={() => setIsMenuOpen(false)}
        >
          <img className="brand-logo" src={srLogoWhite} alt="" />
          <span className="brand-name sr-only">Susana Riquelme</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="menu-toggle-label">Menu</span>
          <span className="menu-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav className="site-nav" aria-label="Navegacion principal">
          <a href="/#equipo" onClick={() => setIsMenuOpen(false)}>Nuestro Equipo</a>
          <a href="/servicios/" onClick={() => setIsMenuOpen(false)}>Servicios</a>
          <a href="/productos/" onClick={() => setIsMenuOpen(false)}>Productos</a>
          <a href="/#alianzas" onClick={() => setIsMenuOpen(false)}>Alianzas</a>
          {newsItems.length ? (
            <a href="/#novedades" onClick={() => setIsMenuOpen(false)}>Novedades</a>
          ) : null}
          <a href="/ubicacion/" onClick={() => setIsMenuOpen(false)}>Ubicacion</a>
        </nav>

        <button
          className="header-action"
          type="button"
          onClick={() => openBooking()}
        >
          Reservar
        </button>
      </header>

      <main>
        <section className="hero-section" id="inicio">
          <img
            className="hero-image"
            src={salonHero}
            alt="Interior del salón Susana Riquelme Peluquería en Concepción"
          />
          <div className="hero-shade" />

          <div className="hero-content">
            <img className="hero-logo" src={srLogoWhite} alt="" />
            <p className="eyebrow">Peluquería en Concepción, Chile</p>
            <h1>
              <span>Susana</span>
              <span>Riquelme</span>
              <span>Peluquería</span>
            </h1>
            <p className="hero-copy">
              Salón de belleza en Concepción con cuidado capilar personalizado,
              colorimetría profesional y productos seleccionados para que tu
              cabello se vea y se sienta como merece.
            </p>

            <div className="hero-actions" aria-label="Acciones principales">
              <button
                className="button primary-button"
                type="button"
                onClick={() => openBooking()}
              >
                Reservar hora
              </button>
              <a className="button ghost-button" href="/productos/">
                Ver productos
              </a>
            </div>
          </div>
        </section>

        <section className="intro-section" id="salon">
          <div className="section-kicker">El salón</div>
          <div className="intro-grid">
            <div className="intro-copy">
              <h2>Un espacio creado para cuidar tu cabello con criterio.</h2>
              <p>
                En Susana Riquelme Peluquería la experiencia parte con una
                asesoría cercana: se evalúa el estado del cabello, el objetivo
                del look y la mantención ideal para que el resultado siga
                luciendo bien después de salir del salón.
              </p>
              <aside className="review-cta" aria-labelledby="review-cta-title">
                <div className="review-cta-header">
                  <span className="google-mark" aria-hidden="true">G</span>
                  <span>Tu opinión importa</span>
                </div>

                <div className="review-cta-rating" aria-label="5 de 5 estrellas en Google">
                  <strong>5.0</strong>
                  <div>
                    <span className="review-stars" aria-hidden="true">★★★★★</span>
                    <p>Calificación en Google</p>
                  </div>
                </div>

                <div className="review-cta-copy">
                  <h3 id="review-cta-title">¿Te gustó tu visita?</h3>
                  <p>
                    Comparte tu experiencia y ayuda a otras personas a elegir
                    su próximo cambio con confianza.
                  </p>
                </div>

                <a
                  className="review-cta-button"
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackSiteEvent('review_click', { section: 'salon' })}
                >
                  <span>Dejar mi reseña en Google</span>
                  <ArrowUpRight aria-hidden="true" size={19} strokeWidth={1.8} />
                </a>
                <small>Toma menos de un minuto</small>
              </aside>
            </div>
            <div className="intro-media" aria-label="Fotos del salón">
              <img src={salonFacade} alt="Entrada del salón Susana Riquelme" />
              <img src={salonReception} alt="Recepción del salón" />
            </div>
          </div>
        </section>

        <section className="brands-band" aria-label="Marcas profesionales">
          {brandLogos.map((brand) => (
            <div
              className={`brand-pill${brand.name.includes('Brasilian') ? ' is-brasilian' : ''}`}
              key={brand.name}
            >
              {brand.image ? (
                <img src={brand.image} alt={brand.name} />
              ) : (
                <span>{brand.name}</span>
              )}
            </div>
          ))}
        </section>

        <section className="team-section" id="equipo">
          <div className="section-heading team-heading">
            <div>
              <p className="section-kicker">Nuestro Equipo</p>
              <h2>Profesionales que cuidan tu cabello desde la confianza.</h2>
            </div>
            <p>
              Creemos que la belleza comienza con la confianza. Por eso, cada
              profesional de nuestro salón trabaja de manera personalizada,
              respetando la esencia, el estilo y las necesidades de cada clienta.
            </p>
          </div>

          <div className="team-grid">
            {team.map((member) => (
              <article
                className="team-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTeamMember(member)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedTeamMember(member)
                  }
                }}
                key={member.name}
              >
                <div className="team-portrait">
                  <img
                    src={member.image}
                    alt={`Retrato de ${member.name}`}
                    loading="lazy"
                  />
                </div>
                <div className="team-card-body">
                  <div>
                    <p>{member.role}</p>
                    <h3>{member.name}</h3>
                  </div>
                  <span className="team-profile-button">Ver perfil</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="services-section" id="servicios">
          <div className="services-shell">
            <header className="services-hero">
              <div className="services-hero-copy">
                <p className="section-kicker">Servicios</p>
                <h2>Tu próximo cambio empieza por elegir bien.</h2>
                <p>
                  Explora cada servicio, compara valores y reserva la opción que
                  mejor se acerca a lo que buscas. Siempre confirmamos el
                  diagnóstico antes de comenzar.
                </p>
                <div className="services-benefits" aria-label="Beneficios del servicio">
                  <span><Check aria-hidden="true" size={15} />Valores referenciales</span>
                  <span><Check aria-hidden="true" size={15} />Asesoría personalizada</span>
                </div>
              </div>
              <figure className="services-hero-visual">
                <img src={salonHero} alt="Área de atención de Susana Riquelme Peluquería" />
                <figcaption>
                  <span>Una experiencia pensada para ti</span>
                  <small>Cuidado, técnica y criterio profesional</small>
                </figcaption>
              </figure>
            </header>

            <nav className="services-nav" aria-label="Explorar categorías de servicios">
              <span>Explorar</span>
              <div>
                {serviceGroups.map((group) => (
                  <a
                    href={
                      isSmoothingService(group.title)
                        ? '/servicios/alisado/'
                        : `#${getServiceSectionId(group.title)}`
                    }
                    key={group.title}
                  >
                    {group.title}
                  </a>
                ))}
              </div>
            </nav>

            <div className="services-list" aria-label="Listado de servicios">
              {serviceGroups.map((group, groupIndex) =>
                isSmoothingService(group.title) ? (
                  <SmoothingServiceCard
                    group={group}
                    onBook={openBooking}
                    key={group.title}
                  />
                ) : (
                  <section
                    className="service-block service-card"
                    id={getServiceSectionId(group.title)}
                    key={group.title}
                  >
                    <div className="service-card-topline">
                      <div className="service-block-head">
                        <span>{group.kicker}</span>
                        <small>{group.accent}</small>
                      </div>
                      <span className="service-card-number">
                        {String(groupIndex + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3>{group.title}</h3>
                    <p className="service-note">{group.note}</p>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.name}>
                          <button
                            type="button"
                            onClick={() =>
                              openBooking(`${group.title} - ${item.name} (${item.price})`)
                            }
                            aria-label={`Reservar ${item.name}, ${item.price}`}
                          >
                            <span className="service-item-name">{item.name}</span>
                            <span className="service-leader" aria-hidden="true" />
                            <strong>{item.price}</strong>
                            <ArrowUpRight aria-hidden="true" size={17} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    {group.disclaimer ? (
                      <p className="service-disclaimer">{group.disclaimer}</p>
                    ) : null}
                  </section>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="products-section" id="productos">
          <div className="products-showcase">
            <div className="products-heading">
              <div className="products-title-row">
                <div>
                  <p className="section-kicker">Tienda profesional</p>
                  <h2>El cuidado del salón, también en casa.</h2>
                </div>
                <a className="products-view-all" href="/productos/">
                  Ver todo
                </a>
              </div>
              <div className="products-heading-copy">
                <span>Selección Susana Riquelme</span>
                <p>
                  Encuentra productos por nombre, marca o necesidad y revisa
                  cada detalle antes de coordinar tu compra por WhatsApp.
                </p>
                <small>Precios referenciales.</small>
              </div>
            </div>

            <div className="product-discovery">
              <label className="product-search">
                <span className="sr-only">Buscar productos</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="10.8" cy="10.8" r="6.6" />
                  <path d="m16 16 4.2 4.2" />
                </svg>
                <input
                  type="search"
                  value={productQuery}
                  onChange={(event) => {
                    setProductQuery(event.target.value)
                    setProductPage(1)
                  }}
                  placeholder="Buscar por producto, marca o necesidad"
                />
                {productQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProductQuery('')
                      setProductPage(1)
                    }}
                    aria-label="Limpiar busqueda"
                  >
                    ×
                  </button>
                ) : null}
              </label>

              <div className="product-filter-row">
                <div className="product-filters" role="group" aria-label="Filtrar productos por marca">
                  {productBrands.map((brand) => {
                    const productCount =
                      brand === 'Todos'
                        ? products.length
                        : products.filter((product) => product.brand === brand).length

                    return (
                      <button
                        className={selectedProductBrand === brand ? 'is-active' : ''}
                        type="button"
                        aria-pressed={selectedProductBrand === brand}
                        onClick={() => {
                          setSelectedProductBrand(brand)
                          setProductPage(1)
                        }}
                        key={brand}
                      >
                        {brand}
                        <span>{productCount}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="product-catalog-toolbar">
                <div className="product-selects">
                  <label>
                    <span>Categoría</span>
                    <select
                      value={selectedProductCategory}
                      onChange={(event) => {
                        setSelectedProductCategory(event.target.value)
                        setProductPage(1)
                      }}
                    >
                      {productCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Ordenar por</span>
                    <select
                      value={productSort}
                      onChange={(event) => {
                        setProductSort(event.target.value)
                        setProductPage(1)
                      }}
                    >
                      <option value="featured">Destacados</option>
                      <option value="name">Nombre A-Z</option>
                    </select>
                  </label>
                </div>
                <div className="product-catalog-summary">
                  <p className="product-results-count" aria-live="polite">
                    Mostrando {firstVisibleProduct}-{lastVisibleProduct} de{' '}
                    {filteredProducts.length}
                  </p>
                  {hasActiveProductFilters ? (
                    <button type="button" onClick={resetProductFilters}>
                      Limpiar filtros
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="products-grid" id="product-results">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.title}>
                <div className="product-image-wrap">
                  <span className="product-category">{product.category}</span>
                  <ContentImage source={product.image} alt={product.title} />
                </div>
                <div className="product-body">
                  <p>{product.brand}</p>
                  <h3>{product.title}</h3>
                  <span className="product-size">{product.size}</span>
                  <div className="product-footer">
                    <strong>{productPriceLabel(product.price)}</strong>
                    <button
                      className="buy-link"
                      type="button"
                      onClick={() => openProduct(product)}
                    >
                      Ver producto
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="products-empty" role="status">
              <span aria-hidden="true">SR</span>
              <h3>No encontramos productos con esos filtros.</h3>
              <p>Prueba otra palabra o vuelve a ver el catálogo completo.</p>
              <button type="button" onClick={resetProductFilters}>
                Limpiar filtros
              </button>
            </div>
          ) : null}

          {filteredProducts.length > productsPerPage ? (
            <nav className="product-pagination" aria-label="Páginas de productos">
              <button
                type="button"
                disabled={productPage === 1}
                onClick={() => changeProductPage(productPage - 1)}
              >
                Anterior
              </button>
              <div>
                {Array.from({ length: totalProductPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      className={productPage === page ? 'is-active' : ''}
                      type="button"
                      aria-current={productPage === page ? 'page' : undefined}
                      onClick={() => changeProductPage(page)}
                      key={page}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                disabled={productPage === totalProductPages}
                onClick={() => changeProductPage(productPage + 1)}
              >
                Siguiente
              </button>
            </nav>
          ) : null}
        </section>

        <section className="gallery-section" aria-label="Galería del salón">
          {gallery.map((image) => (
            <img key={image.src} src={image.src} alt={image.alt} />
          ))}
        </section>

        <section className="alliances-section" id="alianzas">
          <div className="section-heading alliances-heading">
            <div>
              <p className="section-kicker">Nuestras alianzas</p>
              <h2>Un espacio de belleza colaborativa.</h2>
            </div>
            <p>
              En Susana Riquelme creemos en el trabajo colaborativo y en crear
              espacios que potencien la belleza en todas sus formas. Por eso,
              contamos con alianzas estratégicas con profesionales y marcas que
              complementan nuestra experiencia en el salón.
            </p>
          </div>

          <div className="alliances-grid">
            {alliances.map((alliance) => (
              <a
                className="alliance-card"
                href={alliance.url}
                target="_blank"
                rel="noreferrer"
                key={alliance.name}
              >
                <div className="alliance-visual">
                  {alliance.image ? (
                    <img src={alliance.image} alt="" />
                  ) : (
                    <span>{alliance.initials}</span>
                  )}
                </div>
                <div className="alliance-body">
                  <p>{alliance.label}</p>
                  <h3>{alliance.name}</h3>
                  <span>{alliance.handle}</span>
                  <p className="alliance-description">{alliance.description}</p>
                  <ul className="alliance-highlights">
                    {alliance.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <strong>Visitar Instagram <span aria-hidden="true">↗</span></strong>
                </div>
              </a>
            ))}
          </div>

          <div className="alliances-note">
            <p>
              Más que un salón, somos un espacio donde diferentes profesionales
              se unen para ofrecer una experiencia integral a cada clienta.
            </p>
          </div>
        </section>

        <section className="social-section" id="redes">
          <div className="section-heading compact">
            <p className="section-kicker">Redes sociales</p>
            <h2>Conecta con el salón y revisa trabajos recientes.</h2>
          </div>

          <div className="social-frames">
            {socialFrames.map((social) => (
              <article className="social-frame-card" key={social.name}>
                <div>
                  <h3>{social.name}</h3>
                  <a href={social.url} target="_blank">
                    Abrir perfil
                  </a>
                </div>
                <iframe
                  title={`${social.name} Susana Riquelme`}
                  src={social.iframe}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </article>
            ))}
          </div>
        </section>

        {newsItems.length ? (
          <section className="news-section" id="novedades">
            <div className="news-heading">
              <div>
                <p className="section-kicker">Novedades</p>
                <h2>Noticias y momentos del salón.</h2>
              </div>
              <p>
                Anuncios, actividades y novedades publicadas por el equipo de
                Susana Riquelme.
              </p>
            </div>

            <div className="news-grid">
              {newsItems.map((item, index) => (
                <article className={`news-card ${index === 0 ? 'is-featured' : ''}`} key={item.id || `${item.title}-${index}`}>
                  <div className="news-image">
                    <ContentImage source={item.image} alt="" />
                    <span>{item.category}</span>
                  </div>
                  <div className="news-body">
                    <time dateTime={item.date}>{formatNewsDate(item.date)}</time>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.link ? (
                      <a
                        className="news-link"
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          trackSiteEvent('news_open', {
                            itemId: item.id || item.title,
                            itemName: item.title,
                          })
                        }
                      >
                        Ver más <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="location-section" id="ubicacion">
          <div className="location-copy">
            <img className="location-logo" src={srLogoBlack} alt="" />
            <p className="section-kicker">Ubicacion</p>
            <h2>Caupolicán 246, departamento 101, Concepción.</h2>
            <p>
              Agenda tu visita, consulta disponibilidad de productos o pide una
              recomendacion profesional antes de comprar.
            </p>
            <div className="location-actions">
              <button
                className="button primary-button"
                type="button"
                onClick={() => openBooking()}
              >
                Reservar por WhatsApp
              </button>
              <a className="button ghost-button light" href={instagramUrl} target="_blank">
                Ver Instagram
              </a>
            </div>
          </div>

          <div className="map-frame">
            <iframe
              title="Mapa de Susana Riquelme Peluquería"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section
          className={`history-section is-collapsible ${isHistoryOpen ? 'is-open' : ''}`}
          id="historia"
        >
          <div className="history-teaser">
            <div>
              <p className="section-kicker">Nuestra historia</p>
              <h2>Susana Riquelme, una historia con propósito.</h2>
              <p>
                Un recorrido que empezó pequeño y fue creciendo con oficio,
                confianza y una forma muy propia de mirar la belleza.
              </p>
            </div>
            <button
              className="history-toggle"
              type="button"
              aria-expanded={isHistoryOpen}
              aria-controls="history-content"
              onClick={() => setIsHistoryOpen((current) => !current)}
            >
              {isHistoryOpen ? 'Ocultar historia' : 'Ver nuestra historia'}
              <span aria-hidden="true">
                <ChevronDown size={15} strokeWidth={2.2} />
              </span>
            </button>
          </div>

          <div className="history-reveal" id="history-content">
            <div className="history-reveal-inner">
              <div className="history-layout">
                <div className="history-media">
                  <img src={salonStations} alt="Estaciones de trabajo de Susana Riquelme Peluquería" />
                </div>
                <div className="history-copy">
                  <p className="section-kicker">La historia completa</p>
                  <h2>De un primer espacio a una marca con identidad propia.</h2>
                  <p>
                    Hoy, Susana Riquelme es un espacio consolidado donde la
                    belleza se vive con calma, dedicación y profesionalismo.
                  </p>
                  <p>
                    Un lugar donde cada detalle importa y donde el crecimiento
                    continúa con la misma pasión del primer día.
                  </p>
                </div>
              </div>

              <div className="history-story-grid" aria-label="Pilares de la historia del salón">
                {historyHighlights.map((item) => (
                  <article key={item.label}>
                    <span>{item.label}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="history-timeline-block">
                <div className="history-timeline-heading">
                  <p className="section-kicker">Nuestra evolución</p>
                  <h3>De un primer espacio en Penco a una marca con identidad propia en Concepción.</h3>
                </div>
                <ol className="history-timeline" aria-label="Línea de tiempo de Susana Riquelme">
                  {historyTimeline.map((item) => (
                    <li key={`${item.date}-${item.title}`}>
                      <div className="timeline-marker" aria-hidden="true" />
                      <div className="timeline-card">
                        <span>{item.date}</span>
                        <small>{item.place}</small>
                        <h4>{item.title}</h4>
                        <p>{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-block">
            <img src={srLogoBlack} alt="" />
          </div>
          <blockquote>
            <p>
              “No todas las mujeres necesitan el servicio que creen necesitar.
              Mi trabajo es ayudarte a descubrir cuál es realmente el mejor para ti.”
            </p>
            <cite>Maria Jose</cite>
          </blockquote>
          <nav className="footer-socials" aria-label="Redes sociales">
            {footerSocialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
              >
                <SocialIcon icon={social.icon} />
              </a>
            ))}
          </nav>
          <div className="footer-bottom">
            <div className="footer-signature">
              <span>Susana Riquelme Peluquería</span>
              <nav className="footer-legal-links" aria-label="Información legal">
                <a href="#terminos" target="_blank" rel="noreferrer">
                  Términos y condiciones
                </a>
                <a href="#devoluciones" target="_blank" rel="noreferrer">
                  Devoluciones y reembolsos
                </a>
                <a href="#privacidad" target="_blank" rel="noreferrer">
                  Privacidad de datos
                </a>
              </nav>
            </div>
            <div className="footer-utility">
              <a className="footer-admin-link" href="#admin" aria-label="Acceder al panel de administración">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
                </svg>
              </a>
              <a href="#inicio">Volver arriba</a>
            </div>
          </div>
        </div>
      </footer>

      {isBookingOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsBookingOpen(false)
          }}
        >
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setIsBookingOpen(false)}
              aria-label="Cerrar modal de reserva"
            >
              ×
            </button>
            <div className="modal-brand">
              <img src={srLogoWhite} alt="" />
              <span>Reserva por WhatsApp</span>
            </div>
            <h2 id="booking-title">Cuéntanos qué necesitas y cotizamos tu hora.</h2>
            <div className="modal-form">
              <label>
                Nombre
                <input
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Tu nombre"
                />
              </label>
              <label>
                Especialista
                <select
                  value={selectedSpecialist}
                  onChange={(event) => setSelectedSpecialist(event.target.value)}
                >
                  <option value="">{undecidedSpecialistOption}</option>
                  {team.map((member) => (
                    <option value={member.name} key={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Servicio
                <select
                  value={currentSelectedService}
                  onChange={(event) => setSelectedService(event.target.value)}
                >
                  {serviceOptions.length ? (
                    serviceOptions.map((service) => (
                      <option key={service}>{service}</option>
                    ))
                  ) : (
                    <option value="">Consulta general</option>
                  )}
                </select>
              </label>
              <label>
                Mensaje
                <textarea
                  value={clientMessage}
                  onChange={(event) => setClientMessage(event.target.value)}
                  placeholder="Cuéntanos tu disponibilidad, largo de cabello o dudas."
                />
              </label>
            </div>
            <a
              className="button primary-button modal-submit"
              href={whatsappHref(bookingMessage)}
              target="_blank"
            >
              Cotizar por WhatsApp
            </a>
          </section>
        </div>
      ) : null}

      {selectedTeamMember ? (
        <div
          className="modal-backdrop team-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedTeamMember(null)
          }}
        >
          <section
            className="team-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
          >
            <button
              className="modal-close team-modal-close"
              type="button"
              onClick={() => setSelectedTeamMember(null)}
              aria-label="Cerrar perfil de estilista"
            >
              ×
            </button>

            <div className="team-modal-photo">
              <img
                src={selectedTeamMember.image}
                alt={`Retrato de ${selectedTeamMember.name}`}
              />
            </div>

            <div className="team-modal-info">
              <p>{selectedTeamMember.role}</p>
              <h2 id="team-modal-title">{selectedTeamMember.name}</h2>
              <p className="team-modal-description">
                {selectedTeamMember.description}
              </p>
              <div className="team-modal-specialties">
                <span>Especialidades</span>
                <ul>
                  {selectedTeamMember.specialties.map((specialty) => (
                    <li key={specialty}>{specialty}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {selectedProduct ? (
        <div
          className="modal-backdrop product-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProduct(null)
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <button
              className="modal-close product-modal-close"
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Cerrar detalle de producto"
            >
              ×
            </button>

            <div className="product-modal-gallery">
              <div className="product-modal-main-image">
                <ContentImage
                  source={selectedProduct.image}
                  alt={selectedProduct.title}
                  mode="detail"
                />
              </div>
              <button className="product-thumbnail is-active" type="button" aria-label="Vista principal">
                <ContentImage
                  source={selectedProduct.image}
                  alt=""
                  mode="preview"
                />
              </button>
            </div>

            <div className="product-modal-info">
              <p className="product-modal-brand">{selectedProduct.brand}</p>
              <h2 id="product-modal-title">{selectedProduct.title}</h2>
              <p className="product-modal-category">
                {selectedProduct.category} · {selectedProduct.size}
              </p>
              {hasVisibleProductPrice(selectedProduct.price) ? (
                <strong className="product-modal-price">{selectedProduct.price}</strong>
              ) : null}
              <p className="product-modal-description">{selectedProduct.description}</p>

              <div className="product-benefits">
                <p>Por que te encantara</p>
                <ul>
                  {selectedProduct.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <a
                className="button product-buy-button"
                href={whatsappHref(
                  `Hola Susana Riquelme Peluquería, me interesa ${selectedProduct.title}.`,
                )}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackSiteEvent('product_whatsapp', {
                    itemId: selectedProduct.id || selectedProduct.title,
                    itemName: selectedProduct.title,
                    section: selectedProduct.category,
                  })
                }
              >
                Escribir por WhatsApp
              </a>
              <small>
                Confirmaremos stock y valor final antes de coordinar la compra.
              </small>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function RoutePageHeader({ backLabel = 'Volver al inicio', backHref = '/' }) {
  return (
    <header className="store-header seo-page-header">
      <a className="store-brand" href="/" aria-label="Ir al inicio">
        <img className="store-brand-logo" src={srLogoBlack} alt="" />
      </a>
      <a className="store-back-link" href={backHref}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        {backLabel}
      </a>
    </header>
  )
}

const openRouteBooking = (service?: string) => {
  trackSiteEvent('booking_open', { itemName: service || 'Reserva general' })
  window.open(
    whatsappHref(
      service
        ? `Hola Susana Riquelme Peluquería, quiero consultar y reservar: ${service}.`
        : 'Hola Susana Riquelme Peluquería, quiero reservar una hora.',
    ),
    '_blank',
    'noopener,noreferrer',
  )
}

function ServicesRoutePage() {
  usePageMetadata({
    title: 'Servicios de Peluquería en Concepción | Susana Riquelme',
    description:
      'Conoce nuestros servicios de peluquería en Concepción: colorimetría, alisados, cortes, peinados y tratamientos capilares con asesoría profesional.',
    canonicalPath: '/servicios/',
  })
  const serviceGroups = useServiceGroups()

  return (
    <div className="seo-route-page">
      <RoutePageHeader />
      <main className="seo-route-main">
        <section className="seo-route-hero">
          <div>
            <p className="section-kicker">Servicios de peluquería en Concepción</p>
            <h1>Cuidado capilar, color y estilo con asesoría personalizada.</h1>
          </div>
          <p>
            Explora valores referenciales y elige una categoría. Antes de cada
            servicio evaluamos el estado, largo y cantidad de cabello para recomendar
            una alternativa segura y coherente con el resultado que buscas.
          </p>
        </section>

        <nav className="seo-route-links" aria-label="Categorías de servicios">
          {serviceGroups.map((group) => (
            <a
              href={
                isSmoothingService(group.title)
                  ? '/servicios/alisado/'
                  : `#${getServiceSectionId(group.title)}`
              }
              key={group.title}
            >
              {group.title}
            </a>
          ))}
        </nav>

        <div className="seo-services-grid">
          {serviceGroups.map((group, groupIndex) =>
            isSmoothingService(group.title) ? (
              <SmoothingServiceCard
                group={group}
                onBook={openRouteBooking}
                key={group.title}
              />
            ) : (
              <section
                className="service-block service-card"
                id={getServiceSectionId(group.title)}
                key={group.title}
              >
                <div className="service-card-topline">
                  <div className="service-block-head">
                    <span>{group.kicker}</span>
                    <small>{group.accent}</small>
                  </div>
                  <span className="service-card-number">
                    {String(groupIndex + 1).padStart(2, '0')}
                  </span>
                </div>
                <h2>{group.title}</h2>
                <p className="service-note">{group.note}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() =>
                          openRouteBooking(
                            `${group.title} - ${item.name} (${item.price})`,
                          )
                        }
                        aria-label={`Reservar ${item.name}, ${item.price}`}
                      >
                        <span className="service-item-name">{item.name}</span>
                        <span className="service-leader" aria-hidden="true" />
                        <strong>{item.price}</strong>
                        <ArrowUpRight aria-hidden="true" size={17} />
                      </button>
                    </li>
                  ))}
                </ul>
                {group.disclaimer ? (
                  <p className="service-disclaimer">{group.disclaimer}</p>
                ) : null}
              </section>
            ),
          )}
        </div>

        <section className="seo-route-cta">
          <div>
            <p className="section-kicker">Evaluación profesional</p>
            <h2>¿No sabes qué servicio elegir?</h2>
            <p>
              Cuéntanos qué resultado buscas y te orientaremos antes de confirmar tu hora.
            </p>
          </div>
          <button className="button primary-button" type="button" onClick={() => openRouteBooking()}>
            Consultar por WhatsApp
          </button>
        </section>
      </main>
    </div>
  )
}

function SmoothingRoutePage() {
  usePageMetadata({
    title: 'Alisado de Cabello en Concepción | Susana Riquelme',
    description:
      'Alisado de cabello en Concepción con evaluación profesional según largo, cantidad y estado del cabello. Incluye fluido antihumedad.',
    canonicalPath: '/servicios/alisado/',
  })
  const serviceGroups = useServiceGroups()
  const smoothingGroup =
    serviceGroups.find((group) => isSmoothingService(group.title)) ||
    initialServiceCategories.find((group) => isSmoothingService(group.title))

  return (
    <div className="seo-route-page smoothing-route-page">
      <RoutePageHeader backLabel="Ver todos los servicios" backHref="/servicios/" />
      <main className="seo-route-main">
        <section className="seo-route-hero smoothing-route-hero">
          <div>
            <p className="section-kicker">Disciplina y control del frizz</p>
            <h1>Alisado de cabello en Concepción.</h1>
          </div>
          <p>
            El valor se define según el largo y la cantidad de cabello. Realizamos una
            evaluación previa para cuidar la fibra capilar y confirmar el procedimiento
            más adecuado para ti.
          </p>
        </section>

        {smoothingGroup ? (
          <SmoothingServiceCard group={smoothingGroup} onBook={openRouteBooking} />
        ) : null}

        <section className="seo-info-grid" aria-label="Información sobre el alisado">
          <article>
            <span>01</span>
            <h2>Evaluación personalizada</h2>
            <p>Revisamos estado, densidad, historial químico y resultado esperado.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Control de humedad</h2>
            <p>El servicio incluye fluido antihumedad para apoyar el acabado final.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Mantención en casa</h2>
            <p>Te orientamos sobre lavado y productos para prolongar el resultado.</p>
          </article>
        </section>
      </main>
    </div>
  )
}

function LocationRoutePage() {
  usePageMetadata({
    title: 'Peluquería en Caupolicán 246, Concepción | Susana Riquelme',
    description:
      'Visita Susana Riquelme Peluquería en Caupolicán 246, departamento 101, Concepción. Reserva tu atención o consulta por WhatsApp.',
    canonicalPath: '/ubicacion/',
  })

  return (
    <div className="seo-route-page location-route-page">
      <RoutePageHeader />
      <main className="seo-route-main">
        <section className="seo-route-hero">
          <div>
            <p className="section-kicker">Ubicación y contacto</p>
            <h1>Peluquería en el centro de Concepción.</h1>
          </div>
          <p>
            Nos encuentras en Caupolicán 246, departamento 101, entre Cochrane y
            San Martín. La atención se coordina previamente para dedicar el tiempo
            necesario a cada diagnóstico y servicio.
          </p>
        </section>

        <section className="seo-location-grid">
          <div className="seo-location-card">
            <p className="section-kicker">Susana Riquelme Peluquería</p>
            <h2>Caupolicán 246, departamento 101.</h2>
            <p>Concepción, Región del Biobío, Chile.</p>
            <div className="location-actions">
              <button className="button primary-button" type="button" onClick={() => openRouteBooking()}>
                Reservar por WhatsApp
              </button>
              <a className="button ghost-button" href={instagramUrl} target="_blank" rel="noreferrer">
                Ver Instagram
              </a>
            </div>
            <nav className="seo-location-links" aria-label="Explorar el sitio">
              <a href="/servicios/">Ver servicios</a>
              <a href="/productos/">Ver productos</a>
            </nav>
          </div>
          <div className="map-frame seo-map-frame">
            <iframe
              title="Mapa de Susana Riquelme Peluquería en Concepción"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function ProductsStorePage() {
  usePageMetadata({
    title: 'Productos Profesionales para el Cabello | Susana Riquelme',
    description:
      'Productos profesionales para cuidar tu cabello en casa. Consulta disponibilidad y recibe asesoría en Susana Riquelme Peluquería, Concepción.',
    canonicalPath: '/productos/',
  })
  const [managedProducts, setManagedProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productQuery, setProductQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('Todos')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [productSort, setProductSort] = useState('featured')
  const [storeGridColumns, setStoreGridColumns] = useState<StoreGridColumns>(1)

  const products = useMemo(
    () => managedProducts.filter((product) => product.active),
    [managedProducts],
  )
  const brands = useMemo(
    () => ['Todos', ...new Set(products.map((product) => product.brand))],
    [products],
  )
  const categories = useMemo(
    () => ['Todas', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(productQuery.trim())

    const matches = products.filter((product) => {
      const searchableText = [
        product.title,
        product.brand,
        product.category,
        product.description,
        product.size,
        ...product.benefits,
      ].join(' ')

      return (
        (selectedBrand === 'Todos' || product.brand === selectedBrand) &&
        (selectedCategory === 'Todas' || product.category === selectedCategory) &&
        (!query || normalizeSearchText(searchableText).includes(query))
      )
    })

    return [...matches].sort((firstProduct, secondProduct) => {
      const firstPrice = Number(firstProduct.price.replace(/\D/g, '')) || 0
      const secondPrice = Number(secondProduct.price.replace(/\D/g, '')) || 0

      if (productSort === 'price-asc') return firstPrice - secondPrice
      if (productSort === 'price-desc') return secondPrice - firstPrice
      if (productSort === 'name') {
        return firstProduct.title.localeCompare(secondProduct.title, 'es')
      }

      return firstProduct.order - secondProduct.order
    })
  }, [productQuery, productSort, products, selectedBrand, selectedCategory])

  const resetFilters = () => {
    setProductQuery('')
    setSelectedBrand('Todos')
    setSelectedCategory('Todas')
    setProductSort('featured')
  }

  const openStoreProduct = (product: Product) => {
    setSelectedProduct(product)
    trackSiteEvent('product_view', {
      itemId: product.id || product.title,
      itemName: product.title,
      section: 'tienda',
    })
  }

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(setManagedProducts)
    trackSiteEvent('section_view', { section: 'tienda' })
    return () => unsubscribeProducts()
  }, [])

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : ''

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProduct(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedProduct])

  return (
    <div className="store-page">
      <header className="store-header">
        <a className="store-brand" href="/" aria-label="Volver al inicio">
          <img className="store-brand-logo" src={srLogoBlack} alt="" />
        </a>
        <a className="store-back-link" href="/">
          <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
          Volver
        </a>
      </header>

      <main className="store-main">
        <section className="store-hero">
          <div>
            <p className="section-kicker">Tienda profesional</p>
            <h1>Productos para seguir cuidando tu cabello en casa.</h1>
          </div>
          <p>
            Revisa el catálogo completo, filtra por marca o necesidad y consulta
            directamente por WhatsApp antes de coordinar tu compra.
          </p>
        </section>

        <section className="store-catalog" aria-label="Catálogo de productos">
          <div className="store-catalog-head">
            <div>
              <p className="section-kicker">Catálogo</p>
              <h2>Productos disponibles</h2>
            </div>
            <span>Compra asistida por WhatsApp</span>
          </div>

          <section className="store-controls" aria-label="Filtros del catálogo">
            <label className="product-search store-search">
              <span className="sr-only">Buscar productos</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.6" />
                <path d="m16 16 4.2 4.2" />
              </svg>
              <input
                type="search"
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Buscar producto o marca"
              />
              {productQuery ? (
                <button
                  type="button"
                  onClick={() => setProductQuery('')}
                  aria-label="Limpiar busqueda"
                >
                  ×
                </button>
              ) : null}
            </label>

            <div className="store-sort">
              <label>
                <span>Categoría</span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Ordenar</span>
                <select
                  value={productSort}
                  onChange={(event) => setProductSort(event.target.value)}
                >
                  <option value="featured">Destacados</option>
                  <option value="name">Nombre A-Z</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                </select>
              </label>
            </div>
          </section>

          <div className="store-layout">
            <aside className="store-sidebar" aria-label="Marcas de productos">
              <div>
                <div className="store-sidebar-head">
                  <span>Marcas</span>
                  {selectedBrand !== 'Todos' ? (
                    <button type="button" onClick={() => setSelectedBrand('Todos')}>
                      Todas
                    </button>
                  ) : null}
                </div>
                <div className="store-chip-list">
                  {brands.map((brand) => {
                    const count =
                      brand === 'Todos'
                        ? products.length
                        : products.filter((product) => product.brand === brand).length

                    return (
                      <button
                        className={selectedBrand === brand ? 'is-active' : ''}
                        type="button"
                        aria-pressed={selectedBrand === brand}
                        onClick={() => setSelectedBrand(brand)}
                        key={brand}
                      >
                        {brand}
                        <small>{count}</small>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            <section className="store-results" aria-live="polite">
              <div className="store-results-head">
                <p>
                  Mostrando <strong>{filteredProducts.length}</strong> de{' '}
                  {products.length} productos
                </p>
                <div className="store-results-actions">
                  <div className="store-view-toggle" role="group" aria-label="Vista de productos">
                    {storeGridOptions.map(({ columns, label, Icon }) => (
                      <button
                        className={storeGridColumns === columns ? 'is-active' : ''}
                        type="button"
                        aria-label={label}
                        aria-pressed={storeGridColumns === columns}
                        title={label}
                        onClick={() => setStoreGridColumns(columns)}
                        key={columns}
                      >
                        <Icon size={16} strokeWidth={1.85} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  {productQuery || selectedBrand !== 'Todos' || selectedCategory !== 'Todas' ? (
                    <button className="store-clear-filters" type="button" onClick={resetFilters}>
                      Limpiar filtros
                    </button>
                  ) : null}
                </div>
              </div>

              {filteredProducts.length ? (
                <div className="store-product-grid" data-columns={storeGridColumns}>
                  {filteredProducts.map((product) => (
                    <article className="store-product-card" key={product.id || product.title}>
                      <button
                        className="store-product-image"
                        type="button"
                        onClick={() => openStoreProduct(product)}
                        aria-label={`Ver ${product.title}`}
                      >
                        <span>{product.category}</span>
                        <ContentImage source={product.image} alt={product.title} />
                      </button>
                      <div className="store-product-body">
                        <p>{product.brand}</p>
                        <h2>{product.title}</h2>
                        <span>{product.size}</span>
                        <div className="store-product-footer">
                          <strong>{productPriceLabel(product.price)}</strong>
                          <button type="button" onClick={() => openStoreProduct(product)}>
                            {storeGridColumns === 1 ? 'Ver producto' : 'Ver'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="products-empty store-empty" role="status">
                  <span aria-hidden="true">SR</span>
                  <h3>No encontramos productos con esos filtros.</h3>
                  <p>Prueba otra búsqueda o vuelve al catálogo completo.</p>
                  <button type="button" onClick={resetFilters}>
                    Limpiar filtros
                  </button>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      {selectedProduct ? (
        <div
          className="modal-backdrop product-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProduct(null)
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-product-modal-title"
          >
            <button
              className="modal-close product-modal-close"
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Cerrar detalle de producto"
            >
              ×
            </button>

            <div className="product-modal-gallery">
              <div className="product-modal-main-image">
                <ContentImage
                  source={selectedProduct.image}
                  alt={selectedProduct.title}
                  mode="detail"
                />
              </div>
              <button className="product-thumbnail is-active" type="button" aria-label="Vista principal">
                <ContentImage
                  source={selectedProduct.image}
                  alt=""
                  mode="preview"
                />
              </button>
            </div>

            <div className="product-modal-info">
              <p className="product-modal-brand">{selectedProduct.brand}</p>
              <h2 id="store-product-modal-title">{selectedProduct.title}</h2>
              <p className="product-modal-category">
                {selectedProduct.category} · {selectedProduct.size}
              </p>
              <strong className="product-modal-price">
                {productPriceLabel(selectedProduct.price)}
              </strong>
              <p className="product-modal-description">{selectedProduct.description}</p>

              <div className="product-benefits">
                <p>Por que te encantara</p>
                <ul>
                  {selectedProduct.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <a
                className="button product-buy-button"
                href={whatsappHref(
                  `Hola Susana Riquelme Peluquería, me interesa ${selectedProduct.title}.`,
                )}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackSiteEvent('product_whatsapp', {
                    itemId: selectedProduct.id || selectedProduct.title,
                    itemName: selectedProduct.title,
                    section: selectedProduct.category,
                  })
                }
              >
                Escribir por WhatsApp
              </a>
              <small>
                Confirmaremos stock y valor final antes de coordinar la compra.
              </small>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

const legalSections = [
  { id: 'identificacion', label: 'Identificación' },
  { id: 'uso-del-sitio', label: 'Uso del sitio' },
  { id: 'servicios-y-precios', label: 'Servicios y precios' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'prestacion', label: 'Prestación del servicio' },
  { id: 'cambios', label: 'Cambios y cancelaciones' },
  { id: 'retracto', label: 'Derecho a retracto' },
  { id: 'productos', label: 'Productos' },
  { id: 'datos-personales', label: 'Datos personales' },
  { id: 'responsabilidad', label: 'Responsabilidad' },
  { id: 'propiedad-intelectual', label: 'Propiedad intelectual' },
  { id: 'reclamos', label: 'Consultas y reclamos' },
]

type PolicyPageProps = {
  title: string
  description: string
  updated: string
  sections: { id: string; label: string }[]
  noteTitle: string
  note: string
  contactMessage: string
  children: ReactNode
}

function PolicyPage({
  title,
  description,
  updated,
  sections,
  noteTitle,
  note,
  contactMessage,
  children,
}: PolicyPageProps) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | Susana Riquelme Peluquería`
    window.scrollTo({ top: 0 })

    return () => {
      document.title = previousTitle
    }
  }, [title])

  return (
    <div className="legal-page">
      <header className="legal-header">
        <a className="legal-brand" href="/" aria-label="Volver al sitio principal">
          <img src={srLogoBlack} alt="Susana Riquelme Peluquería" />
        </a>
        <a className="legal-back-link" href="/">
          <ArrowLeft aria-hidden="true" size={17} />
          Volver al sitio
        </a>
      </header>

      <main className="legal-main">
        <section className="legal-hero">
          <div>
            <p className="section-kicker">Información legal</p>
            <h1>{title}.</h1>
          </div>
          <div className="legal-hero-copy">
            <p>{description}</p>
            <span>Última actualización: {updated}</span>
          </div>
        </section>

        <div className="legal-layout">
          <aside className="legal-index">
            <p>Contenido</p>
            <nav aria-label={`Contenido de ${title.toLocaleLowerCase('es')}`}>
              {sections.map((section, index) => (
                <a href={`#${section.id}`} key={section.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="legal-document">
            <div className="legal-intro-note">
              <strong>{noteTitle}</strong>
              <p>{note}</p>
            </div>
            {children}
            <footer className="legal-document-footer">
              <p>
                Esta política podrá actualizarse para reflejar cambios legales u
                operativos. La versión vigente indicará siempre su fecha de
                actualización y se aplicará hacia el futuro.
              </p>
              <a href={whatsappHref(contactMessage)} target="_blank" rel="noreferrer">
                Consultar por WhatsApp
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            </footer>
          </article>
        </div>
      </main>
    </div>
  )
}

function TermsPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Términos y condiciones | Susana Riquelme Peluquería'
    window.scrollTo({ top: 0 })

    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="legal-page">
      <header className="legal-header">
        <a className="legal-brand" href="/" aria-label="Volver al sitio principal">
          <img src={srLogoBlack} alt="Susana Riquelme Peluquería" />
        </a>
        <a className="legal-back-link" href="/">
          <ArrowLeft aria-hidden="true" size={17} />
          Volver al sitio
        </a>
      </header>

      <main className="legal-main">
        <section className="legal-hero">
          <div>
            <p className="section-kicker">Información legal</p>
            <h1>Términos y condiciones.</h1>
          </div>
          <div className="legal-hero-copy">
            <p>
              Estas condiciones regulan el uso del sitio web y la solicitud de
              servicios o productos de Susana Riquelme Peluquería.
            </p>
            <span>Última actualización: 21 de julio de 2026</span>
          </div>
        </section>

        <div className="legal-layout">
          <aside className="legal-index">
            <p>Contenido</p>
            <nav aria-label="Contenido de los términos y condiciones">
              {legalSections.map((section, index) => (
                <a href={`#${section.id}`} key={section.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="legal-document">
            <div className="legal-intro-note">
              <strong>Antes de utilizar el sitio</strong>
              <p>
                La navegación no genera por sí sola una obligación de compra.
                Una reserva o adquisición sólo queda confirmada cuando el Salón
                la acepta expresamente y comunica sus condiciones finales.
              </p>
            </div>

            <section id="identificacion">
              <span className="legal-section-number">01</span>
              <div>
                <h2>Identificación del prestador</h2>
                <p>
                  El sitio es operado bajo el nombre comercial <strong>Susana
                  Riquelme Peluquería</strong>, en adelante “el Salón”, con
                  atención presencial en Caupolicán 246, departamento 101,
                  Concepción, Región del Biobío, Chile.
                </p>
                <ul>
                  <li>Canal de contacto: WhatsApp +56 9 8632 7850.</li>
                  <li>Instagram: @susanariquelmepeluqueria.</li>
                  <li>Horario y disponibilidad: los informados en el sitio o al confirmar la reserva.</li>
                </ul>
              </div>
            </section>

            <section id="uso-del-sitio">
              <span className="legal-section-number">02</span>
              <div>
                <h2>Uso del sitio y aceptación</h2>
                <p>
                  El sitio entrega información sobre el Salón, sus servicios,
                  valores referenciales, productos y canales de contacto. Al
                  solicitar una reserva o compra, la persona declara haber leído
                  estas condiciones y proporciona información veraz y suficiente
                  para gestionar su solicitud.
                </p>
                <p>
                  El uso del sitio debe ser lícito y respetuoso. No se permite
                  interferir con su funcionamiento, intentar acceder a áreas
                  restringidas ni utilizar sus contenidos con fines fraudulentos.
                </p>
              </div>
            </section>

            <section id="servicios-y-precios">
              <span className="legal-section-number">03</span>
              <div>
                <h2>Servicios, diagnóstico y precios</h2>
                <p>
                  Las descripciones e imágenes son informativas. Los resultados
                  de coloración, alisado, reparación, corte u otros procedimientos
                  dependen, entre otros factores, del diagnóstico profesional, el
                  historial químico, la condición, cantidad y largo del cabello.
                </p>
                <p>
                  Los precios publicados son referenciales cuando así se indica.
                  Antes de iniciar un servicio que requiera evaluación, el Salón
                  informará su alcance, valor final y eventuales servicios
                  adicionales. Ningún cargo adicional se aplicará sin información
                  previa y aceptación de la clienta o cliente.
                </p>
              </div>
            </section>

            <section id="reservas">
              <span className="legal-section-number">04</span>
              <div>
                <h2>Solicitud y confirmación de reservas</h2>
                <p>
                  El formulario del sitio prepara un mensaje para WhatsApp. Su
                  envío constituye una <strong>solicitud de hora</strong>, no una
                  confirmación automática. La reserva queda confirmada únicamente
                  cuando el Salón responde aceptando fecha, horario, profesional y
                  servicio, y comunica cualquier condición particular aplicable.
                </p>
                <p>
                  Cuando exista abono o pago anticipado, su monto, finalidad,
                  condiciones de devolución o reprogramación y medio de pago se
                  informarán antes de que la persona lo acepte.
                </p>
              </div>
            </section>

            <section id="prestacion">
              <span className="legal-section-number">05</span>
              <div>
                <h2>Prestación segura del servicio</h2>
                <p>
                  La persona debe comunicar alergias conocidas, sensibilidad,
                  embarazo, tratamientos médicos relevantes, uso de henna o sales
                  metálicas, procedimientos químicos previos y cualquier
                  antecedente que pueda afectar la seguridad o el resultado.
                </p>
                <p>
                  El Salón podrá recomendar una prueba, adaptar el procedimiento o
                  no ejecutarlo cuando la evaluación profesional indique un riesgo
                  razonable para el cabello o la salud. Esto será explicado antes
                  de comenzar y no limita los derechos irrenunciables de las
                  personas consumidoras.
                </p>
              </div>
            </section>

            <section id="cambios">
              <span className="legal-section-number">06</span>
              <div>
                <h2>Cambios, atrasos y cancelaciones</h2>
                <p>
                  Si necesitas cambiar o cancelar una hora, debes informarlo por
                  WhatsApp tan pronto como sea posible. El Salón podrá proponer una
                  reprogramación ante atrasos que impidan realizar el procedimiento
                  de manera segura o dentro del horario reservado.
                </p>
                <p>
                  Cualquier política especial de abonos, cancelación o inasistencia
                  deberá ser informada y aceptada antes del pago. El Salón también
                  podrá reprogramar por fuerza mayor, indisponibilidad profesional
                  u otra causa justificada, ofreciendo una alternativa razonable.
                </p>
              </div>
            </section>

            <section id="retracto">
              <span className="legal-section-number">07</span>
              <div>
                <h2>Derecho a retracto</h2>
                <p>
                  Cuando se celebre un contrato de servicio por medios electrónicos,
                  la persona podrá ejercer el derecho a retracto dentro de los diez
                  días siguientes a su aceptación y antes de utilizar el servicio,
                  en los casos y con los límites establecidos por la Ley N° 19.496.
                </p>
                <p>
                  El retracto puede solicitarse por WhatsApp, indicando el nombre y
                  los antecedentes necesarios para identificar la contratación. Si
                  sólo existe una solicitud de reserva aún no confirmada, podrá
                  desistirse de ella por el mismo canal.
                </p>
              </div>
            </section>

            <section id="productos">
              <span className="legal-section-number">08</span>
              <div>
                <h2>Productos y disponibilidad</h2>
                <p>
                  La vitrina digital permite consultar productos; no procesa pagos
                  en línea. La compra se coordina por WhatsApp y queda sujeta a la
                  confirmación de stock, precio total y modalidad de entrega. Las
                  recomendaciones de uso no reemplazan las instrucciones del
                  fabricante.
                </p>
                <p>
                  Los productos cuentan con la garantía legal y los demás derechos
                  que correspondan conforme a la Ley N° 19.496. Estas condiciones no
                  restringen el derecho a reclamar por productos defectuosos, falta
                  de conformidad o información incorrecta.
                </p>
                <a className="legal-inline-link" href="#devoluciones" target="_blank" rel="noreferrer">
                  Revisar política de devoluciones y reembolsos
                  <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              </div>
            </section>

            <section id="datos-personales">
              <span className="legal-section-number">09</span>
              <div>
                <h2>Datos personales</h2>
                <p>
                  El Salón podrá tratar los datos entregados voluntariamente —por
                  ejemplo, nombre, teléfono, servicio solicitado, mensajes y datos
                  necesarios para la atención— para responder consultas, gestionar
                  reservas, prestar el servicio, mantener registros administrativos
                  y proteger la seguridad del sitio.
                </p>
                <p>
                  También pueden generarse datos técnicos y estadísticas de uso. No
                  se utilizarán para finalidades incompatibles ni se comunicarán a
                  terceros, salvo proveedores tecnológicos necesarios, autorización
                  de la persona o deber legal. Se adoptarán medidas razonables de
                  seguridad y conservación limitada a la finalidad correspondiente.
                </p>
                <p>
                  Para solicitar información, actualización, rectificación,
                  eliminación o bloqueo de datos cuando proceda, la persona puede
                  escribir al WhatsApp del Salón. El tratamiento se rige por la Ley
                  N° 19.628 y, desde su entrada en vigencia, por las modificaciones
                  introducidas por la Ley N° 21.719.
                </p>
                <a className="legal-inline-link" href="#privacidad" target="_blank" rel="noreferrer">
                  Revisar política de privacidad de datos
                  <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              </div>
            </section>

            <section id="responsabilidad">
              <span className="legal-section-number">10</span>
              <div>
                <h2>Disponibilidad y responsabilidad</h2>
                <p>
                  El Salón procura mantener información correcta y un sitio
                  disponible, pero puede efectuar mantenciones o corregir errores.
                  Las fotografías muestran trabajos o ambientes de referencia y no
                  constituyen una promesa de resultado idéntico.
                </p>
                <p>
                  Nada en estas condiciones excluye o limita la responsabilidad del
                  Salón por incumplimiento, negligencia ni los derechos que la ley
                  reconoce a las personas consumidoras. Los enlaces a plataformas
                  externas se rigen además por las condiciones de sus respectivos
                  operadores.
                </p>
              </div>
            </section>

            <section id="propiedad-intelectual">
              <span className="legal-section-number">11</span>
              <div>
                <h2>Propiedad intelectual</h2>
                <p>
                  El diseño, marca, logotipos, textos, fotografías y demás contenido
                  del sitio pertenecen al Salón o se utilizan con autorización. Se
                  permite navegar y compartir enlaces para fines personales, pero no
                  reproducir, modificar o explotar comercialmente el contenido sin
                  autorización previa, salvo las excepciones legales.
                </p>
              </div>
            </section>

            <section id="reclamos">
              <span className="legal-section-number">12</span>
              <div>
                <h2>Consultas, reclamos y legislación aplicable</h2>
                <p>
                  Para consultas o reclamos, puedes contactar al Salón por WhatsApp
                  al +56 9 8632 7850. Procuraremos entregar una respuesta clara y
                  oportuna, solicitando sólo los antecedentes necesarios para revisar
                  el caso.
                </p>
                <p>
                  Estas condiciones se rigen por las leyes de la República de Chile,
                  especialmente la Ley N° 19.496 sobre protección de los derechos de
                  los consumidores, el Reglamento de Comercio Electrónico y la
                  normativa de protección de datos. Las personas conservan su derecho
                  a recurrir al SERNAC y a los tribunales competentes.
                </p>
                <div className="legal-source-links">
                  <a href="https://www.sernac.cl/portal/617/w3-article-57413.html" target="_blank" rel="noreferrer">
                    Derecho a retracto en SERNAC <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                  <a href="https://www.bcn.cl/leychile/navegar?idNorma=1160403" target="_blank" rel="noreferrer">
                    Ley N° 19.496 en Ley Chile <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                  <a href="https://www.bcn.cl/leychile/navegar?i=1165504" target="_blank" rel="noreferrer">
                    Reglamento de Comercio Electrónico <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                </div>
              </div>
            </section>

            <footer className="legal-document-footer">
              <p>
                El Salón podrá actualizar estas condiciones por cambios normativos
                o de funcionamiento. La versión vigente indicará siempre su fecha
                de actualización y se aplicará hacia el futuro.
              </p>
              <a href={whatsappHref('Hola Susana Riquelme Peluquería, tengo una consulta sobre los términos y condiciones.')} target="_blank" rel="noreferrer">
                Consultar por WhatsApp
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            </footer>
          </article>
        </div>
      </main>
    </div>
  )
}

const refundPolicySections = [
  { id: 'alcance-devoluciones', label: 'Alcance' },
  { id: 'cambios-productos', label: 'Cambios de productos' },
  { id: 'garantia-legal', label: 'Garantía legal' },
  { id: 'reembolsos-productos', label: 'Reembolsos' },
  { id: 'servicios-salon', label: 'Servicios de salón' },
  { id: 'reservas-abonos', label: 'Reservas y abonos' },
  { id: 'disconformidad-servicio', label: 'Disconformidad' },
  { id: 'retracto-devoluciones', label: 'Retracto' },
  { id: 'solicitud-revision', label: 'Cómo solicitar' },
  { id: 'contacto-devoluciones', label: 'Contacto' },
]

function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Devoluciones y reembolsos"
      description="Condiciones aplicables a productos, servicios, reservas, cambios y solicitudes de revisión gestionadas con el Salón."
      updated="21 de julio de 2026"
      sections={refundPolicySections}
      noteTitle="Tus derechos se mantienen intactos"
      note="Esta política complementa la legislación chilena y nunca limita la garantía legal, el derecho a retracto cuando corresponda ni otras facultades irrenunciables de las personas consumidoras."
      contactMessage="Hola Susana Riquelme Peluquería, quiero solicitar una revisión, cambio o reembolso."
    >
      <section id="alcance-devoluciones">
        <span className="legal-section-number">01</span>
        <div>
          <h2>Alcance de esta política</h2>
          <p>
            Esta política se aplica a productos capilares comercializados por
            Susana Riquelme Peluquería y a servicios de peluquería prestados en el
            salón, independientemente de que la coordinación se realice de forma
            presencial, por WhatsApp, redes sociales o mediante este sitio.
          </p>
          <p>
            Las solicitudes se analizan según la naturaleza del producto o
            servicio, el motivo informado y los derechos establecidos en la Ley
            N° 19.496 sobre protección de las personas consumidoras.
          </p>
        </div>
      </section>

      <section id="cambios-productos">
        <span className="legal-section-number">02</span>
        <div>
          <h2>Cambios voluntarios de productos</h2>
          <p>
            Cuando no exista falla y la solicitud responda a una preferencia
            personal, podrá pedirse la revisión de un cambio dentro de los diez
            días corridos siguientes a la entrega. Para evaluarlo, el producto
            debe mantenerse sin uso, cerrado o sellado cuando corresponda, con
            envase, etiquetas y accesorios originales, junto con la boleta o un
            comprobante válido de compra.
          </p>
          <p>
            Por higiene y seguridad, los productos capilares o cosméticos abiertos,
            usados o manipulados no admiten cambios voluntarios. Esta regla no se
            aplica cuando exista una falla, falta de conformidad, error en la
            entrega u otro supuesto protegido por la ley.
          </p>
        </div>
      </section>

      <section id="garantia-legal">
        <span className="legal-section-number">03</span>
        <div>
          <h2>Garantía legal de productos</h2>
          <p>
            Si un producto nuevo presenta defectos, piezas faltantes, no sirve para
            el uso informado o no corresponde a lo ofrecido, la persona podrá
            ejercer la garantía legal dentro de los seis meses siguientes a su
            recepción, eligiendo entre reparación gratuita, cambio o devolución
            del dinero, cuando proceda conforme a la Ley N° 19.496.
          </p>
          <p>
            El Salón podrá solicitar el producto, boleta o comprobante y antecedentes
            razonables —como fotografías y descripción de la falla— para verificar
            el caso. No se condicionará el ejercicio de la garantía a conservar el
            embalaje original ni a requisitos adicionales que la ley no contemple.
          </p>
        </div>
      </section>

      <section id="reembolsos-productos">
        <span className="legal-section-number">04</span>
        <div>
          <h2>Forma de los reembolsos</h2>
          <p>
            Una vez aprobado un reembolso, se utilizará preferentemente el mismo
            medio de pago de la compra o uno distinto acordado con la persona. El
            Salón informará cuando haya emitido la devolución; el momento en que el
            abono se refleje puede depender del banco, emisor u operador de pago.
          </p>
          <p>
            Si la devolución se origina en un error del Salón, una falla o daño
            previo a la entrega, el Salón asumirá los costos razonables de retiro o
            traslado que sean necesarios. En cambios voluntarios, cualquier costo
            de traslado deberá informarse antes de que la persona lo acepte.
          </p>
        </div>
      </section>

      <section id="servicios-salon">
        <span className="legal-section-number">05</span>
        <div>
          <h2>Servicios de salón</h2>
          <p>
            Los servicios son personalizados y utilizan tiempo profesional,
            diagnóstico e insumos. Por ello, un servicio correctamente ejecutado
            no genera una devolución automática por un cambio posterior de
            preferencia. Sin embargo, esto no impide reclamar ante una ejecución
            deficiente, incumplimiento de lo acordado o falta de información.
          </p>
          <p>
            El resultado puede verse condicionado por el estado e historial del
            cabello. Antes de comenzar, el Salón debe explicar las limitaciones
            relevantes detectadas, el procedimiento y su valor final. La información
            entregada por la clienta o cliente también debe ser completa, especialmente
            respecto de procesos químicos, alergias o sensibilidad conocida.
          </p>
        </div>
      </section>

      <section id="reservas-abonos">
        <span className="legal-section-number">06</span>
        <div>
          <h2>Reservas, cancelaciones y abonos</h2>
          <p>
            Cuando un servicio requiera abono, antes del pago se informará su monto,
            finalidad y condiciones de reprogramación o devolución. El abono se
            imputará al precio final del servicio, salvo que se comunique y acepte
            expresamente otra condición válida.
          </p>
          <p>
            Las condiciones aplicables a inasistencias, atrasos o cancelaciones
            tardías deben comunicarse al confirmar la hora. Si el Salón cancela y no
            es posible acordar una nueva fecha, devolverá el monto recibido. Ningún
            abono se considerará perdido automáticamente cuando esa consecuencia no
            haya sido informada y aceptada antes del pago.
          </p>
        </div>
      </section>

      <section id="disconformidad-servicio">
        <span className="legal-section-number">07</span>
        <div>
          <h2>Disconformidad con un servicio</h2>
          <p>
            Si observas una diferencia relevante respecto de lo acordado, comunícala
            por WhatsApp tan pronto como sea razonablemente posible. Esto permite
            revisar oportunamente el cabello, el diagnóstico y el procedimiento
            realizado, sin que la demora implique por sí sola la pérdida de derechos.
          </p>
          <p>
            Según el caso, la solución podrá consistir en evaluación técnica,
            corrección sin costo, repetición parcial, reprogramación, devolución
            total o parcial u otra medida adecuada. La respuesta se determinará por
            los antecedentes y la legislación aplicable, no únicamente por una
            exclusión general de responsabilidad.
          </p>
        </div>
      </section>

      <section id="retracto-devoluciones">
        <span className="legal-section-number">08</span>
        <div>
          <h2>Derecho a retracto</h2>
          <p>
            En contrataciones celebradas a distancia o por medios electrónicos, la
            persona podrá retractarse dentro de los diez días siguientes a la
            aceptación y antes de utilizar el servicio, cuando corresponda según la
            Ley N° 19.496. Para productos, el retracto se ejercerá dentro de los
            plazos, condiciones y excepciones legales aplicables.
          </p>
          <p>
            Las exclusiones por naturaleza del producto, higiene u otras causas sólo
            se aplicarán cuando estén permitidas por la ley y hayan sido informadas
            de forma clara antes de la contratación. El retracto puede solicitarse
            por WhatsApp mediante una declaración inequívoca.
          </p>
        </div>
      </section>

      <section id="solicitud-revision">
        <span className="legal-section-number">09</span>
        <div>
          <h2>Cómo solicitar una revisión</h2>
          <p>Escribe al WhatsApp +56 9 8632 7850 e incluye, según corresponda:</p>
          <ul>
            <li>Nombre y medio de contacto.</li>
            <li>Fecha de compra, entrega o atención.</li>
            <li>Producto o servicio involucrado.</li>
            <li>Boleta, comprobante u otro antecedente de la operación.</li>
            <li>Descripción del problema y fotografías, si ayudan a revisarlo.</li>
            <li>Solución solicitada.</li>
          </ul>
          <p>
            Se pedirán únicamente antecedentes pertinentes. El Salón responderá por
            el mismo canal o acordará otro medio de contacto.
          </p>
        </div>
      </section>

      <section id="contacto-devoluciones">
        <span className="legal-section-number">10</span>
        <div>
          <h2>Contacto y canales externos</h2>
          <p>
            Canal oficial: WhatsApp +56 9 8632 7850. Atención presencial en
            Caupolicán 246, departamento 101, Concepción, Región del Biobío.
          </p>
          <p>
            Si la solución propuesta no resulta satisfactoria, la persona conserva
            su derecho a presentar un reclamo ante el SERNAC o ejercer las acciones
            que correspondan ante los tribunales competentes.
          </p>
          <div className="legal-source-links">
            <a href="https://www.sernac.cl/portal/604/w3-propertyvalue-8062.html" target="_blank" rel="noreferrer">
              Garantía legal en SERNAC <ArrowUpRight aria-hidden="true" size={15} />
            </a>
            <a href="https://www.sernac.cl/portal/617/w3-article-57413.html" target="_blank" rel="noreferrer">
              Derecho a retracto <ArrowUpRight aria-hidden="true" size={15} />
            </a>
            <a href="https://www.bcn.cl/leychile/navegar?idNorma=1160403" target="_blank" rel="noreferrer">
              Ley N° 19.496 <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
      </section>
    </PolicyPage>
  )
}

const privacyPolicySections = [
  { id: 'responsable-datos', label: 'Responsable' },
  { id: 'datos-recopilados', label: 'Datos recopilados' },
  { id: 'finalidades-datos', label: 'Finalidades' },
  { id: 'datos-sensibles', label: 'Datos sensibles' },
  { id: 'comunicacion-datos', label: 'Comunicación de datos' },
  { id: 'conservacion-seguridad', label: 'Conservación y seguridad' },
  { id: 'derechos-titulares', label: 'Tus derechos' },
  { id: 'menores-privacidad', label: 'Menores de edad' },
  { id: 'contacto-privacidad', label: 'Contacto' },
]

function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Política de privacidad"
      description="Información transparente sobre los datos personales tratados por el Salón, sus finalidades, proveedores tecnológicos y los derechos de cada titular."
      updated="21 de julio de 2026"
      sections={privacyPolicySections}
      noteTitle="Privacidad desde el diseño"
      note="Recopilamos sólo la información necesaria para atender, gestionar reservas y mantener la operación del Salón. No vendemos datos personales ni utilizamos este sitio para procesar tarjetas de pago."
      contactMessage="Hola Susana Riquelme Peluquería, quiero hacer una consulta o ejercer un derecho relacionado con mis datos personales."
    >
      <section id="responsable-datos">
        <span className="legal-section-number">01</span>
        <div>
          <h2>Responsable del tratamiento</h2>
          <p>
            Susana Riquelme Peluquería, con atención en Caupolicán 246,
            departamento 101, Concepción, es responsable de las decisiones sobre
            los datos personales tratados mediante este sitio y en la gestión de
            su relación con clientas y clientes.
          </p>
          <p>
            El canal disponible para consultas o ejercicio de derechos es WhatsApp
            +56 9 8632 7850. Cuando el tratamiento requiera autorización conforme a
            la ley, se solicitará de manera informada y para finalidades específicas.
          </p>
        </div>
      </section>

      <section id="datos-recopilados">
        <span className="legal-section-number">02</span>
        <div>
          <h2>Qué datos podemos recopilar</h2>
          <p>Según la interacción y el servicio solicitado, podemos tratar:</p>
          <ul>
            <li>Datos de identificación y contacto, como nombre, teléfono, correo, comuna o Instagram.</li>
            <li>Información de reservas: servicio, profesional, fecha, horario y mensajes.</li>
            <li>Antecedentes de atención y preferencias necesarios para dar continuidad al servicio.</li>
            <li>Datos de transacciones, comprobantes y pagos, sin almacenar números completos de tarjetas.</li>
            <li>Fotografías del cabello o resultados, únicamente con una finalidad informada y la autorización correspondiente.</li>
            <li>Datos técnicos de navegación e interacción descritos en esta política.</li>
          </ul>
          <p>
            El formulario público no envía directamente una base de datos de
            reserva: prepara un mensaje que la persona decide compartir mediante
            WhatsApp.
          </p>
        </div>
      </section>

      <section id="finalidades-datos">
        <span className="legal-section-number">03</span>
        <div>
          <h2>Para qué utilizamos los datos</h2>
          <ul>
            <li>Responder consultas y confirmar, modificar o cancelar reservas.</li>
            <li>Realizar diagnósticos, prestar servicios y mantener un historial útil de atención.</li>
            <li>Coordinar compras, pagos, comprobantes y entrega de productos.</li>
            <li>Gestionar reclamos, garantías, devoluciones y solicitudes de derechos.</li>
            <li>Mantener la seguridad, prevenir usos indebidos y solucionar errores técnicos.</li>
            <li>Obtener estadísticas internas para mejorar el sitio y la experiencia del salón.</li>
            <li>Cumplir obligaciones legales, tributarias, contables o requerimientos de autoridad.</li>
          </ul>
          <p>
            Las comunicaciones promocionales sólo se enviarán cuando exista una
            autorización o fundamento permitido. La persona podrá solicitar su
            término en cualquier momento por el mismo canal utilizado.
          </p>
        </div>
      </section>

      <section id="datos-sensibles">
        <span className="legal-section-number">04</span>
        <div>
          <h2>Datos sensibles y diagnóstico</h2>
          <p>
            Para cuidar la seguridad del servicio puede ser necesario conocer
            alergias, sensibilidad, embarazo, tratamientos médicos relevantes o
            condiciones del cuero cabelludo. Estos antecedentes se solicitarán sólo
            cuando sean pertinentes, se tratarán con confidencialidad y no se usarán
            para publicidad ni finalidades incompatibles.
          </p>
          <p>
            La persona debe evitar enviar información médica que no sea necesaria.
            Ante una condición que requiera evaluación clínica, el Salón puede
            recomendar consultar a un profesional de salud antes de realizar el
            procedimiento.
          </p>
        </div>
      </section>

      <section id="comunicacion-datos">
        <span className="legal-section-number">05</span>
        <div>
          <h2>Proveedores y comunicación de datos</h2>
          <p>
            No vendemos ni arrendamos datos personales. Podemos permitir su acceso a
            proveedores tecnológicos que prestan servicios necesarios, bajo deberes
            de confidencialidad y seguridad; comunicar antecedentes cuando la persona
            lo autorice; o entregarlos para cumplir una obligación legal o requerimiento
            válido de autoridad.
          </p>
          <p>
            Algunos proveedores pueden almacenar o procesar información fuera de Chile.
            En esos casos se procurará utilizar servicios reconocidos y configuraciones
            adecuadas a la naturaleza de los datos tratados.
          </p>
        </div>
      </section>

      <section id="conservacion-seguridad">
        <span className="legal-section-number">06</span>
        <div>
          <h2>Conservación y seguridad</h2>
          <p>
            Los datos se conservarán mientras sean necesarios para la atención,
            relación con la clienta o cliente, gestión de reclamos y cumplimiento de
            obligaciones administrativas o legales. Cuando dejen de ser necesarios y
            no exista un deber de conservación, se eliminarán, bloquearán o anonimizarán
            según corresponda.
          </p>
          <p>
            Se aplican medidas razonables de acceso restringido, autenticación,
            respaldo y cuidado de la información. Ningún sistema es absolutamente
            infalible; ante un incidente relevante se adoptarán medidas de contención
            y las comunicaciones exigidas por la normativa aplicable.
          </p>
        </div>
      </section>

      <section id="derechos-titulares">
        <span className="legal-section-number">07</span>
        <div>
          <h2>Derechos de las personas</h2>
          <p>
            Conforme a la Ley N° 19.628, la persona puede solicitar información y
            acceso a sus datos, su origen, destinatarios y finalidad; pedir la
            rectificación de datos inexactos o desactualizados; y solicitar eliminación
            o bloqueo cuando proceda. También puede revocar autorizaciones sin efecto
            retroactivo, en los casos permitidos.
          </p>
          <p>
            Desde el 1 de diciembre de 2026 serán aplicables además las modificaciones
            de la Ley N° 21.719, incluidos los derechos y procedimientos que ésta
            incorpora. Para ejercerlos, escribe al WhatsApp del Salón indicando tu
            nombre, la solicitud concreta y antecedentes razonables para verificar tu
            identidad. El trámite será gratuito en los casos establecidos por la ley.
          </p>
        </div>
      </section>

      <section id="menores-privacidad">
        <span className="legal-section-number">08</span>
        <div>
          <h2>Menores de edad</h2>
          <p>
            El sitio no está dirigido a recopilar autónomamente datos de niños, niñas
            o adolescentes. Cuando una persona menor de edad requiera atención, la
            reserva y el tratamiento de información deberán gestionarse por su madre,
            padre o representante, o con su autorización cuando corresponda según la
            edad y la naturaleza del servicio.
          </p>
          <p>
            Si se advierte que se recibieron datos de un menor sin autorización
            suficiente, se revisarán y eliminarán cuando corresponda.
          </p>
        </div>
      </section>

      <section id="contacto-privacidad">
        <span className="legal-section-number">09</span>
        <div>
          <h2>Contacto y marco normativo</h2>
          <p>
            Para consultas o solicitudes relacionadas con privacidad, contacta al
            WhatsApp +56 9 8632 7850. Atención presencial en Caupolicán 246,
            departamento 101, Concepción, Región del Biobío.
          </p>
          <p>
            Esta política se rige actualmente por la Ley N° 19.628 sobre protección
            de la vida privada y considera la transición hacia la Ley N° 21.719, que
            entra en vigencia el 1 de diciembre de 2026.
          </p>
          <div className="legal-source-links">
            <a href="https://www.bcn.cl/leychile/Navegar?idLey=19628" target="_blank" rel="noreferrer">
              Ley N° 19.628 vigente <ArrowUpRight aria-hidden="true" size={15} />
            </a>
            <a href="https://www.bcn.cl/leychile/navegar?idNorma=1209272" target="_blank" rel="noreferrer">
              Ley N° 21.719 <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
      </section>
    </PolicyPage>
  )
}

function App() {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash)
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (currentHash === '#admin') {
    return (
      <Suspense fallback={<div className="admin-loading">Cargando panel…</div>}>
        <AdminPanel />
      </Suspense>
    )
  }
  if (currentHash === '#terminos') return <TermsPage />
  if (currentHash === '#devoluciones') return <RefundPolicyPage />
  if (currentHash === '#privacidad') return <PrivacyPolicyPage />
  if (currentPath === '/servicios/alisado') return <SmoothingRoutePage />
  if (currentPath === '/servicios') return <ServicesRoutePage />
  if (currentPath === '/productos' || currentHash === '#tienda') {
    return <ProductsStorePage />
  }
  if (currentPath === '/ubicacion') return <LocationRoutePage />

  return <Landing />
}

export default App
