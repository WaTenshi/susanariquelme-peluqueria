import { useEffect, useMemo, useState } from 'react'
import './App.css'

import brazilianLogo from './assets/Brasilian-Hair-Seduction-logo-brand-page-e1658557973418.jpg'
import productDefinidor from './assets/IMG_6099.WEBP'
import productSerum from './assets/IMG_6100.WEBP'
import productAcidificante from './assets/IMG_6101.WEBP'
import productZeroFrizz from './assets/IMG_6102.WEBP'
import productCacau from './assets/IMG_6103.WEBP'
import productSummer from './assets/IMG_6104.PNG'
import inebryaLogo from './assets/inebrya_white.svg'
import lorealLogo from './assets/logo-loreal-02.webp'
import salonHero from './assets/web-IMG_6062.jpg'
import salonReception from './assets/web-IMG_6061.jpg'
import salonChairs from './assets/web-IMG_6074.jpg'
import salonWide from './assets/web-IMG_6065.jpg'
import accessoriesDetail from './assets/web-IMG_6073.jpg'
import srLogoBlack from './assets/SRLOGOSINFONDO.png'
import srLogoWhite from './assets/SR BLANCA SINFONDO.png'
import trussLogo from './assets/TRUSS-Professional-Branco-opt.webp'

const whatsappNumber = '56986327850'
const instagramUrl = 'https://www.instagram.com/susanariquelmepeluqueria/'
const facebookUrl = 'https://web.facebook.com/Susanariquelmeestilista/?_rdc=1&_rdr#'
const tiktokUrl = 'https://www.tiktok.com/@salonsusanariquelme'

const whatsappHref = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const brandLogos = [
  { name: 'TRUSS Professional', image: trussLogo },
  { name: 'L\'Oreal Professionnel', image: lorealLogo },
  { name: 'Inebrya', image: inebryaLogo },
  { name: 'Brazilian Hair Seduction', image: brazilianLogo },
  { name: 'Glatten', image: null },
]

const footerSocialLinks = [
  { name: 'Instagram', url: instagramUrl, icon: 'instagram' },
  { name: 'Facebook', url: facebookUrl, icon: 'facebook' },
  { name: 'TikTok', url: tiktokUrl, icon: 'tiktok' },
  {
    name: 'WhatsApp',
    url: whatsappHref('Hola Susana Riquelme Peluqueria, quiero hacer una consulta.'),
    icon: 'whatsapp',
  },
]

const team = [
  {
    name: 'Maria Jose',
    role: 'CEO y estilista',
    initials: 'MJ',
    description: 'Descripción por poner.',
  },
  {
    name: 'Moira',
    role: 'Estilista',
    initials: 'M',
    description: 'Descripción por poner.',
  },
  {
    name: 'Claudia',
    role: 'Estilista',
    initials: 'C',
    description: 'Descripción por poner.',
  },
]

const serviceGroups = [
  {
    kicker: 'Corte',
    title: 'Corte de cabello',
    note: 'Incluye lavado y brushing.',
    accent: 'Precision',
    items: [
      { name: 'Corte', price: '$29.990' },
      { name: 'Corte + peinado', price: '$39.990' },
    ],
  },
  {
    kicker: 'Eventos',
    title: 'Peinados',
    note: 'Incluye lavado y brushing.',
    accent: 'Look final',
    items: [
      { name: 'Ondas', price: '$14.990' },
      { name: 'Peinado de fiesta', price: 'Desde $35.990' },
      { name: 'Peinado de novia', price: 'Desde $65.990' },
    ],
  },
  {
    kicker: 'Salud capilar',
    title: 'Tratamientos capilares',
    note: 'Incluye lavado y brushing.',
    accent: 'Diagnostico',
    items: [
      { name: 'Tratamiento Inebrya', price: '$30.990' },
      { name: 'Tratamiento K18', price: '$38.990' },
      { name: 'Tratamiento Truss', price: '$38.990' },
      { name: 'Botox Capilar S/M', price: '$40.990' },
      { name: 'Botox Capilar L/XL', price: '$45.990' },
    ],
  },
  {
    kicker: 'Disciplina',
    title: 'Alisado',
    note: 'Incluye fluido antihumedad.',
    accent: 'Anti frizz',
    items: [
      { name: 'Corto', price: '$60.000' },
      { name: 'Medio', price: '$80.000' },
      { name: 'Largo', price: '$95.000' },
      { name: 'Extra largo', price: '$110.000' },
    ],
  },
  {
    kicker: 'Colorimetria',
    title: 'Color',
    note: 'Incluye lavado nutritivo y brushing.',
    accent: 'Personalizado',
    items: [
      { name: 'Cintillo', price: '$25.990' },
      { name: 'Retoque crecimiento', price: '$40.990' },
      { name: 'Color global S', price: '$53.990' },
      { name: 'Color global M', price: '$59.990' },
      { name: 'Color global L', price: '$69.990' },
      { name: 'Color global XL', price: '$79.990' },
      { name: 'Falso crecimiento', price: '$25.990 / $38.990' },
    ],
    disclaimer:
      'Si tu retoque tiene mas de 1 mes de crecimiento, se aplica un cargo adicional de $10.000 por cada mes extra.',
  },
  {
    kicker: 'Mechas',
    title: 'Iluminacion y mechas',
    note: 'Incluye tratamiento profesional y peinado.',
    accent: 'Brillo',
    items: [
      { name: 'Mechas creativas', price: 'Desde $130.990' },
      { name: 'Mechas con superaclarante', price: 'Desde $100.990' },
    ],
  },
  {
    kicker: 'Rizadas',
    title: 'Cabello rizado',
    note: 'Incluye lavado nutritivo.',
    accent: 'Definicion',
    items: [
      { name: 'Servicio rizadas S/M', price: '$25.990' },
      { name: 'Servicio rizadas L/XL', price: '$39.990' },
    ],
  },
]

const serviceOptions = serviceGroups.flatMap((group) =>
  group.items.map((item) => `${group.title} - ${item.name} (${item.price})`),
)

const products = [
  {
    brand: 'Glatten Professional',
    title: 'Me Cacheia Definidor Intenso 500ml',
    price: '$18.990',
    image: productDefinidor,
    category: 'Definicion',
    description:
      'Crema de peinar de fijacion flexible para definir ondas y rizos, controlar el volumen y mantener el movimiento natural.',
    benefits: ['Definicion duradera', 'Control de frizz', 'Sin efecto rigido'],
    size: '500 ml',
  },
  {
    brand: 'Glatten Professional',
    title: 'Serum Luminous Repair 60ml',
    price: '$16.990',
    image: productSerum,
    category: 'Reparacion',
    description:
      'Serum de acabado ligero que ayuda a sellar las puntas, aportar brillo y proteger el cabello del aspecto reseco.',
    benefits: ['Brillo inmediato', 'Puntas suaves', 'Textura ligera'],
    size: '60 ml',
  },
  {
    brand: 'Glatten Professional',
    title: 'Fluido Acidificante Capilar',
    price: '$21.990',
    image: productAcidificante,
    category: 'Tratamiento',
    description:
      'Tratamiento acidificante pensado para cabellos porosos o procesados que necesitan recuperar suavidad y apariencia uniforme.',
    benefits: ['Ayuda a sellar la cuticula', 'Mejora la suavidad', 'Ideal post color'],
    size: '250 ml',
  },
  {
    brand: 'La Bella Liss',
    title: 'Kit Zero Frizz shampoo + acondicionador',
    price: '$24.990',
    image: productZeroFrizz,
    category: 'Control de frizz',
    description:
      'Rutina de limpieza y acondicionamiento para disciplinar el cabello y prolongar una terminacion suave y ordenada.',
    benefits: ['Limpieza suave', 'Mayor manejabilidad', 'Rutina completa'],
    size: 'Kit 2 productos',
  },
  {
    brand: 'Brazilian Hair Seduction',
    title: 'Plastica de Cacau profesional',
    price: '$29.990',
    image: productCacau,
    category: 'Nutricion',
    description:
      'Mascarilla de nutricion intensa con cacao para cabellos que buscan cuerpo, brillo y una sensacion profundamente acondicionada.',
    benefits: ['Nutricion intensa', 'Cabello mas brillante', 'Suavidad profunda'],
    size: '1 kg',
  },
  {
    brand: 'Glatten Professional',
    title: 'Kit Summer proteccion termoactiva',
    price: '$27.990',
    image: productSummer,
    category: 'Proteccion',
    description:
      'Kit de cuidado diario para proteger el cabello frente al calor, la exposicion ambiental y la perdida de hidratacion.',
    benefits: ['Proteccion termica', 'Cuidado diario', 'Ayuda a mantener el brillo'],
    size: 'Kit 3 productos',
  },
]

const productBrands = ['Todos', ...new Set(products.map((product) => product.brand))]
const productCategories = ['Todas', ...new Set(products.map((product) => product.category))]
const productsPerPage = 9

const alliances = [
  {
    name: 'Josse Calabriano',
    handle: '@jossecalabriano',
    url: 'https://www.instagram.com/jossecalabriano/',
    initials: 'JC',
    label: 'Alianza local',
  },
  {
    name: 'Bettina Joyas',
    handle: '@bettina_joyas',
    url: 'https://www.instagram.com/bettina_joyas/',
    initials: 'BJ',
    label: 'Alianza local',
    image: accessoriesDetail,
  },
]

const newsItems = [
  {
    category: 'Novedades',
    date: 'Fecha por definir',
    title: 'Título por poner',
    description: 'Descripción por poner.',
    image: salonReception,
  },
  {
    category: 'Noticias del salón',
    date: 'Fecha por definir',
    title: 'Título por poner',
    description: 'Descripción por poner.',
    image: salonChairs,
  },
  {
    category: 'Comunidad',
    date: 'Fecha por definir',
    title: 'Título por poner',
    description: 'Descripción por poner.',
    image: accessoriesDetail,
  },
]

const gallery = [
  {
    src: salonReception,
    alt: 'Recepcion del salon Susana Riquelme con logo iluminado',
  },
  {
    src: salonWide,
    alt: 'Area principal del salon con sillones de peluqueria',
  },
  {
    src: salonChairs,
    alt: 'Zona de lavado y colorimetria del salon',
  },
  {
    src: accessoriesDetail,
    alt: 'Vitrina de accesorios disponibles en el salon',
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

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null)
  const [productQuery, setProductQuery] = useState('')
  const [selectedProductBrand, setSelectedProductBrand] = useState('Todos')
  const [selectedProductCategory, setSelectedProductCategory] = useState('Todas')
  const [productSort, setProductSort] = useState('featured')
  const [productPage, setProductPage] = useState(1)
  const [clientName, setClientName] = useState('')
  const [selectedService, setSelectedService] = useState(serviceOptions[0])
  const [clientMessage, setClientMessage] = useState('')

  const bookingMessage = useMemo(() => {
    const lines = [
      'Hola Susana Riquelme Peluqueria, quiero reservar una hora.',
      `Nombre: ${clientName || 'Por completar'}`,
      `Servicio: ${selectedService}`,
      `Mensaje: ${clientMessage || 'Sin mensaje adicional'}`,
    ]

    return lines.join('\n')
  }, [clientMessage, clientName, selectedService])

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
  }, [productQuery, productSort, selectedProductBrand, selectedProductCategory])

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
  }

  useEffect(() => {
    const isModalOpen = isBookingOpen || selectedProduct !== null
    document.body.style.overflow = isModalOpen ? 'hidden' : ''

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsBookingOpen(false)
        setSelectedProduct(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isBookingOpen, selectedProduct])

  return (
    <div className="app-shell">
      <header className={`site-header ${isMenuOpen ? 'is-menu-open' : ''}`}>
        <a
          className="brand"
          href="#inicio"
          aria-label="Ir al inicio"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="brand-mark" aria-hidden="true">
            <span>S</span>
            <span>R</span>
          </span>
          <span className="brand-name">Susana Riquelme</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className="site-nav" aria-label="Navegacion principal">
          <a href="#nosotras" onClick={() => setIsMenuOpen(false)}>Nosotras</a>
          <a href="#servicios" onClick={() => setIsMenuOpen(false)}>Servicios</a>
          <a href="#productos" onClick={() => setIsMenuOpen(false)}>Productos</a>
          <a href="#alianzas" onClick={() => setIsMenuOpen(false)}>Alianzas</a>
          <a href="#novedades" onClick={() => setIsMenuOpen(false)}>Novedades</a>
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
            alt="Interior del salon Susana Riquelme Peluqueria en Concepcion"
          />
          <div className="hero-shade" />

          <div className="hero-content">
            <img className="hero-logo" src={srLogoWhite} alt="" />
            <p className="eyebrow">Concepcion, Chile</p>
            <h1>
              <span>Susana</span>
              <span>Riquelme</span>
              <span>Peluqueria</span>
            </h1>
            <p className="hero-copy">
              Cuidado capilar personalizado, colorimetria profesional y
              productos seleccionados para que tu cabello se vea y se sienta
              como merece.
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
          <div className="section-kicker">El salon</div>
          <div className="intro-grid">
            <div className="intro-copy">
              <h2>Un espacio creado para cuidar tu cabello con criterio.</h2>
              <p>
                En Susana Riquelme Peluqueria la experiencia parte con una
                asesoria cercana: se evalua el estado del cabello, el objetivo
                del look y la mantencion ideal para que el resultado siga
                luciendo bien despues de salir del salon.
              </p>
              <div className="rating-card" aria-label="Puntuacion Google">
                <span>5.0</span>
                <strong>★★★★★</strong>
                <p>Calificacion en Google</p>
              </div>
            </div>
            <div className="intro-media" aria-label="Fotos del salon">
              <img src={salonReception} alt="Recepcion del salon" />
              <img src={salonWide} alt="Sillones y area de atencion" />
            </div>
          </div>
        </section>

        <section className="brands-band" aria-label="Marcas profesionales">
          {brandLogos.map((brand) => (
            <div className="brand-pill" key={brand.name}>
              {brand.image ? (
                <img src={brand.image} alt={brand.name} />
              ) : (
                <span>{brand.name}</span>
              )}
            </div>
          ))}
        </section>

        <section className="team-section" id="nosotras">
          <div className="section-heading team-heading">
            <div>
              <p className="section-kicker">Nosotras</p>
              <h2>Tres miradas, una misma forma de cuidar tu cabello.</h2>
            </div>
            <p>Descripción general por poner.</p>
          </div>

          <div className="team-grid">
            {team.map((member, index) => (
              <article className="team-card" key={member.name}>
                <div className="team-portrait" aria-hidden="true">
                  <span>{member.initials}</span>
                  <small>0{index + 1}</small>
                </div>
                <div className="team-card-body">
                  <div>
                    <p>{member.role}</p>
                    <h3>{member.name}</h3>
                  </div>
                  <p>{member.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="history-section" id="historia">
          <div className="history-media">
            <img src={salonWide} alt="Interior de Susana Riquelme Peluqueria" />
            <div className="history-seal" aria-hidden="true">SR</div>
          </div>
          <div className="history-copy">
            <p className="section-kicker">Nuestra historia</p>
            <h2>La historia de Susana Riquelme.</h2>
            <p>Descripción por poner.</p>
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
                mantencion.
              </p>

              <div className="services-photo-grid" aria-label="Fotos del salon">
                <img src={salonChairs} alt="Zona de lavado y colorimetria" />
                <img src={accessoriesDetail} alt="Detalle de accesorios del salon" />
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
              <div>
                <p className="section-kicker">Tienda profesional</p>
                <h2>El cuidado del salon, tambien en casa.</h2>
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
                      <option value="price-asc">Menor precio</option>
                      <option value="price-desc">Mayor precio</option>
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
                  <img src={product.image} alt={product.title} />
                </div>
                <div className="product-body">
                  <p>{product.brand}</p>
                  <h3>{product.title}</h3>
                  <span className="product-size">{product.size}</span>
                  <div className="product-footer">
                    <strong>{product.price}</strong>
                    <button
                      className="buy-link"
                      type="button"
                      onClick={() => setSelectedProduct(product)}
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

        <section className="gallery-section" aria-label="Galeria del salon">
          {gallery.map((image) => (
            <img key={image.src} src={image.src} alt={image.alt} />
          ))}
        </section>

        <section className="alliances-section" id="alianzas">
          <div className="section-heading alliances-heading">
            <div>
              <p className="section-kicker">Nuestras alianzas</p>
              <h2>Proyectos locales que complementan tu experiencia.</h2>
            </div>
            <p>Descripción por poner.</p>
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
                  <strong>Visitar Instagram <span aria-hidden="true">↗</span></strong>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="social-section" id="redes">
          <div className="section-heading compact">
            <p className="section-kicker">Redes sociales</p>
            <h2>Conecta con el salon y revisa trabajos recientes.</h2>
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

        <section className="news-section" id="novedades">
          <div className="news-heading">
            <div>
              <p className="section-kicker">Novedades</p>
              <h2>Noticias y momentos del salón.</h2>
            </div>
            <p>
              Este espacio reunirá anuncios, actividades y novedades publicadas
              por el equipo de Susana Riquelme.
            </p>
          </div>

          <div className="news-grid">
            {newsItems.map((item, index) => (
              <article className={`news-card ${index === 0 ? 'is-featured' : ''}`} key={`${item.title}-${index}`}>
                <div className="news-image">
                  <img src={item.image} alt="" />
                  <span>{item.category}</span>
                </div>
                <div className="news-body">
                  <time>{item.date}</time>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="news-pending">Contenido por publicar</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="location-section" id="ubicacion">
          <div className="location-copy">
            <img className="location-logo" src={srLogoBlack} alt="" />
            <p className="section-kicker">Ubicacion</p>
            <h2>Caupolican 246, departamento 101, Concepcion.</h2>
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
              title="Mapa de Susana Riquelme Peluqueria"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-block">
            <img src={srLogoBlack} alt="" />
          </div>
          <blockquote>
            <p>“La belleza comienza en el instante en que decides ser tu misma.”</p>
            <cite>Coco Chanel</cite>
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
            <span>Susana Riquelme Peluqueria</span>
            <a href="#inicio">Volver arriba</a>
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
                Servicio
                <select
                  value={selectedService}
                  onChange={(event) => setSelectedService(event.target.value)}
                >
                  {serviceOptions.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
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
                <img src={selectedProduct.image} alt={selectedProduct.title} />
              </div>
              <button className="product-thumbnail is-active" type="button" aria-label="Vista principal">
                <img src={selectedProduct.image} alt="" />
              </button>
            </div>

            <div className="product-modal-info">
              <p className="product-modal-brand">{selectedProduct.brand}</p>
              <h2 id="product-modal-title">{selectedProduct.title}</h2>
              <p className="product-modal-category">
                {selectedProduct.category} · {selectedProduct.size}
              </p>
              <strong className="product-modal-price">{selectedProduct.price}</strong>
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
                  `Hola Susana Riquelme Peluqueria, quiero comprar ${selectedProduct.title} (${selectedProduct.price}).`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                Comprar por WhatsApp
              </a>
              <small>
                Precio referencial. Confirmaremos stock y valor final antes de
                coordinar la compra.
              </small>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default App
