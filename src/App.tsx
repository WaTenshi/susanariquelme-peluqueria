import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, Grid2x2, Grid3x3, Rows3 } from 'lucide-react'
import './App.css'
import AdminPanel from './AdminPanel'
import {
  subscribeToNews,
  subscribeToProducts,
  subscribeToServiceCategories,
  subscribeToServiceItems,
  trackSiteEvent,
} from './firebase'
import type { NewsItem, Product, ServiceCategory, ServiceItem } from './types'
import ContentImage from './ContentImage'

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
  const [selectedSpecialist, setSelectedSpecialist] = useState(team[0].name)
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
  const serviceGroups = useMemo(() => {
    return buildServiceGroups(managedServiceCategories, managedServiceItems)
  }, [managedServiceCategories, managedServiceItems])
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
          href="#inicio"
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
          <a href="#equipo" onClick={() => setIsMenuOpen(false)}>Nuestro Equipo</a>
          <a href="#servicios" onClick={() => setIsMenuOpen(false)}>Servicios</a>
          <a href="#productos" onClick={() => setIsMenuOpen(false)}>Productos</a>
          <a href="#alianzas" onClick={() => setIsMenuOpen(false)}>Alianzas</a>
          {newsItems.length ? (
            <a href="#novedades" onClick={() => setIsMenuOpen(false)}>Novedades</a>
          ) : null}
          <a href="#ubicacion" onClick={() => setIsMenuOpen(false)}>Ubicacion</a>
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
              <a className="button ghost-button" href="#productos">
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
              <div className="rating-card" aria-label="Puntuacion Google">
                <div className="rating-card-score">
                  <span>5.0</span>
                  <div>
                    <strong>★★★★★</strong>
                    <p>Calificacion en Google</p>
                  </div>
                </div>
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Dejar reseña
                </a>
              </div>
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
          <div className="services-layout">
            <div className="services-intro">
              <p className="section-kicker">Servicios</p>
              <h2>Listado claro para orientar tu visita.</h2>
              <p>
                Valores referenciales para conocer las alternativas disponibles.
                Al pedir una hora, la clienta puede elegir el servicio que
                necesita y complementar con dudas sobre largo, tecnica o
                mantención.
              </p>

              <div className="services-photo-grid" aria-label="Fotos del salón">
                <img src={salonReception} alt="Área principal del salón" />
                <img src={salonLogoDetail} alt="Detalle del logo interior del salón" />
              </div>
            </div>

            <div className="services-list" aria-label="Listado de servicios">
              {serviceGroups.map((group) => (
                <section className="service-block" key={group.title}>
                  <div className="service-block-head">
                    <span>{group.kicker}</span>
                    <small>{group.accent}</small>
                  </div>
                  <h3>{group.title}</h3>
                  <p className="service-note">{group.note}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.name}>
                        <span className="service-item-name">{item.name}</span>
                        <span className="service-leader" aria-hidden="true" />
                        <strong>{item.price}</strong>
                      </li>
                    ))}
                  </ul>
                  {group.disclaimer ? (
                    <p className="service-disclaimer">{group.disclaimer}</p>
                  ) : null}
                </section>
              ))}
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
                <a className="products-view-all" href="#tienda">
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
            <span>Susana Riquelme Peluquería</span>
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

function ProductsStorePage() {
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
        <a className="store-brand" href="#inicio" aria-label="Volver a la landing">
          <img className="store-brand-logo" src={srLogoBlack} alt="" />
        </a>
        <a className="store-back-link" href="#inicio">
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

function App() {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (currentHash === '#admin') return <AdminPanel />
  if (currentHash === '#tienda') return <ProductsStorePage />

  return <Landing />
}

export default App
