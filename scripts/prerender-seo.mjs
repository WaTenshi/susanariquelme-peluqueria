import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const distDirectory = 'dist'
const templatePath = join(distDirectory, 'index.html')
const baseTemplate = readFileSync(templatePath, 'utf8')
const siteUrl = 'https://susanariquelmepeluqueria.cl'
const socialImage = `${siteUrl}/og-salon.jpg`

const navigation = `
  <nav class="seo-prerender-nav" aria-label="Navegación principal">
    <a href="/">Inicio</a>
    <a href="/servicios/">Servicios</a>
    <a href="/servicios/alisado/">Alisado</a>
    <a href="/productos/">Productos</a>
    <a href="/ubicacion/">Ubicación</a>
  </nav>
`

const routePages = [
  {
    path: '/',
    title: 'Peluquería y Colorimetría en Concepción | Susana Riquelme',
    description:
      'Peluquería en Concepción especializada en colorimetría, rubios, alisados, tratamientos capilares, cortes y asesoría personalizada.',
    content: `
      ${navigation}
      <main>
        <section class="seo-prerender-hero">
          <p>Peluquería en Concepción, Chile</p>
          <h1>Susana Riquelme Peluquería</h1>
          <p>Salón de belleza en Concepción con colorimetría profesional, cuidado capilar personalizado y asesoría cercana para elegir el servicio que tu cabello necesita.</p>
          <div><a href="/servicios/">Ver servicios</a><a href="/ubicacion/">Reservar una hora</a></div>
        </section>
        <section>
          <h2>Color, técnica y cuidado capilar con criterio profesional</h2>
          <p>La experiencia comienza con una evaluación del estado del cabello, el resultado que buscas y la mantención necesaria. Trabajamos con una mirada personalizada para cuidar la fibra capilar y conseguir resultados armónicos.</p>
          <p>Nuestro salón está ubicado en Caupolicán 246, departamento 101, en el centro de Concepción. La atención se coordina previamente para dedicar el tiempo adecuado a cada diagnóstico y servicio.</p>
        </section>
        <section>
          <h2>Servicios de peluquería en Concepción</h2>
          <div class="seo-prerender-grid">
            <article><h3>Colorimetría</h3><p>Color global, correcciones, rubios personalizados, iluminación y diseño de mechas según tu base y objetivo.</p><a href="/servicios/">Conocer servicios de color</a></article>
            <article><h3>Alisado y control del frizz</h3><p>Evaluación según largo, cantidad, historial químico y condición actual del cabello.</p><a href="/servicios/alisado/">Ver opciones de alisado</a></article>
            <article><h3>Tratamientos capilares</h3><p>Alternativas de nutrición, reparación y cuidado para mejorar apariencia, suavidad y manejabilidad.</p><a href="/servicios/">Ver tratamientos</a></article>
            <article><h3>Cortes y peinados</h3><p>Cortes, ondas y peinados personalizados con lavado, brushing y orientación profesional.</p><a href="/servicios/">Ver cortes y peinados</a></article>
          </div>
        </section>
        <section>
          <h2>Productos profesionales para cuidar tu cabello en casa</h2>
          <p>Encuentra productos seleccionados para complementar tu servicio y mantener el resultado. Puedes revisar el catálogo y consultar disponibilidad directamente con el salón.</p>
          <a href="/productos/">Explorar productos</a>
        </section>
        <section>
          <h2>Visítanos en el centro de Concepción</h2>
          <p>Caupolicán 246, departamento 101, Concepción, Región del Biobío.</p>
          <a href="/ubicacion/">Ver ubicación y contacto</a>
        </section>
      </main>
    `,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Susana Riquelme Peluquería en Concepción',
      url: `${siteUrl}/`,
      about: { '@id': `${siteUrl}/#salon` },
    },
  },
  {
    path: '/servicios/',
    title: 'Servicios de Peluquería en Concepción | Susana Riquelme',
    description:
      'Conoce nuestros servicios de peluquería en Concepción: colorimetría, alisados, cortes, peinados y tratamientos capilares con asesoría profesional.',
    content: `
      ${navigation}
      <main>
        <section class="seo-prerender-hero"><p>Servicios de peluquería en Concepción</p><h1>Cuidado capilar, color y estilo con asesoría personalizada</h1><p>Explora servicios y valores referenciales. Antes de comenzar confirmamos el diagnóstico, el largo, la cantidad y el estado del cabello.</p></section>
        <section><h2>Cortes y peinados</h2><p>Corte de cabello, corte con peinado, ondas, peinados de fiesta y alternativas para novias. Los servicios indicados incluyen lavado y brushing según corresponda.</p></section>
        <section><h2>Tratamientos capilares</h2><p>Tratamientos profesionales de nutrición, reparación y control del frizz, seleccionados según las necesidades reales de tu cabello.</p></section>
        <section><h2>Alisado</h2><p>Alisado con evaluación previa e inclusión de fluido antihumedad. El valor depende del largo y la cantidad de cabello.</p><a href="/servicios/alisado/">Revisar largos y valores de alisado</a></section>
        <section><h2>Colorimetría</h2><p>Color global, retoque de crecimiento, baño de color, visos, balayage, babylights y correcciones realizadas a partir de un diagnóstico profesional.</p></section>
        <section><h2>Reserva con orientación profesional</h2><p>Si todavía no sabes qué opción elegir, cuéntanos el resultado que buscas para recomendarte el servicio más adecuado.</p><a href="/ubicacion/">Consultar ubicación y contacto</a></section>
      </main>
    `,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Servicios de peluquería en Concepción',
      url: `${siteUrl}/servicios/`,
      about: { '@id': `${siteUrl}/#salon` },
    },
  },
  {
    path: '/servicios/alisado/',
    title: 'Alisado de Cabello en Concepción | Susana Riquelme',
    description:
      'Alisado de cabello en Concepción con evaluación profesional según largo, cantidad y estado del cabello. Incluye fluido antihumedad.',
    content: `
      ${navigation}
      <main>
        <section class="seo-prerender-hero"><p>Disciplina y control del frizz</p><h1>Alisado de cabello en Concepción</h1><p>Evaluamos estado, densidad, historial químico y resultado esperado para confirmar un procedimiento seguro y adecuado.</p></section>
        <section><h2>Valores de alisado según largo</h2><ul><li>Cabello corto: $60.000</li><li>Cabello medio: $80.000</li><li>Cabello largo: $95.000</li><li>Cabello extra largo: $110.000</li></ul><p>Los valores están sujetos a evaluación según largo y cantidad de cabello. El servicio incluye fluido antihumedad.</p></section>
        <section><h2>Evaluación personalizada</h2><p>Revisamos el estado de la fibra capilar, densidad, elasticidad y procedimientos realizados anteriormente antes de confirmar el servicio. Si el cabello necesita preparación o una alternativa diferente, te explicaremos la recomendación antes de comenzar.</p></section>
        <section><h2>Qué considerar antes de reservar</h2><p>El tiempo de trabajo puede variar de acuerdo con el largo, volumen y diagnóstico. Puedes enviarnos una referencia del resultado que buscas, pero la decisión final se toma considerando la condición real del cabello.</p></section>
        <section><h2>Mantención del resultado</h2><p>Al finalizar te orientamos sobre lavado, temperatura, productos y cuidados en casa para prolongar el acabado, controlar la humedad y mantener el cabello manejable.</p><a href="/servicios/">Ver todos los servicios</a><a href="/ubicacion/">Consultar una evaluación</a></section>
      </main>
    `,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Alisado de cabello',
      serviceType: 'Alisado y control del frizz',
      areaServed: { '@type': 'City', name: 'Concepción' },
      provider: { '@id': `${siteUrl}/#salon` },
      url: `${siteUrl}/servicios/alisado/`,
    },
  },
  {
    path: '/productos/',
    title: 'Productos Profesionales para el Cabello | Susana Riquelme',
    description:
      'Productos profesionales para cuidar tu cabello en casa. Consulta disponibilidad y recibe asesoría en Susana Riquelme Peluquería, Concepción.',
    content: `
      ${navigation}
      <main>
        <section class="seo-prerender-hero"><p>Tienda profesional</p><h1>Productos para cuidar tu cabello en casa</h1><p>Consulta productos profesionales seleccionados para mantener color, hidratación, reparación y control del frizz después de tu visita al salón.</p></section>
        <section><h2>Asesoría antes de comprar</h2><p>No todos los cabellos necesitan la misma rutina. Te ayudamos a elegir según tu diagnóstico, servicio realizado, frecuencia de lavado y objetivo de mantención para evitar compras innecesarias.</p></section>
        <section><h2>Productos según las necesidades del cabello</h2><p>El catálogo reúne alternativas para hidratación, nutrición, reparación, protección del color, control del frizz y terminación. La recomendación puede combinar limpieza, tratamiento y acabado de acuerdo con el uso que realmente darás en casa.</p></section>
        <section><h2>Cómo consultar un producto</h2><p>Selecciona un producto del catálogo y escríbenos por WhatsApp. Confirmaremos disponibilidad, formato y valor antes de coordinar el retiro en el salón.</p></section>
        <section><h2>Catálogo y disponibilidad</h2><p>Revisa el catálogo actualizado y consulta stock y valor final directamente antes de coordinar la compra.</p><a href="/servicios/">Conocer servicios del salón</a><a href="/ubicacion/">Ver ubicación</a></section>
      </main>
    `,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Productos profesionales para el cabello',
      url: `${siteUrl}/productos/`,
      about: { '@id': `${siteUrl}/#salon` },
    },
  },
  {
    path: '/ubicacion/',
    title: 'Peluquería en Caupolicán 246, Concepción | Susana Riquelme',
    description:
      'Visita Susana Riquelme Peluquería en Caupolicán 246, departamento 101, Concepción. Reserva tu atención o consulta por WhatsApp.',
    content: `
      ${navigation}
      <main>
        <section class="seo-prerender-hero"><p>Ubicación y contacto</p><h1>Peluquería en el centro de Concepción</h1><p>Atención coordinada previamente para dedicar el tiempo necesario a cada diagnóstico y servicio.</p></section>
        <section><h2>Susana Riquelme Peluquería</h2><address>Caupolicán 246, departamento 101<br>Concepción, Región del Biobío, Chile</address><p>El salón se encuentra entre Cochrane y San Martín, en el centro de Concepción. La ubicación permite llegar desde el sector comercial y distintos puntos del centro caminando o mediante transporte público.</p><a href="/servicios/">Ver servicios</a><a href="/productos/">Ver productos</a></section>
        <section><h2>Atención con hora coordinada</h2><p>Trabajamos con reserva para organizar el diagnóstico, la duración del procedimiento y la disponibilidad de cada profesional. Si es tu primera visita, puedes contar brevemente qué servicio buscas al comunicarte.</p></section>
        <section><h2>Reserva y consultas</h2><p>Puedes solicitar orientación, consultar disponibilidad y coordinar una hora mediante WhatsApp. Para servicios técnicos, una fotografía actual del cabello puede ayudar a entregar una primera orientación, aunque la evaluación definitiva se realiza en el salón.</p></section>
      </main>
    `,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Ubicación de Susana Riquelme Peluquería',
      url: `${siteUrl}/ubicacion/`,
      about: { '@id': `${siteUrl}/#salon` },
    },
  },
]

const replaceMeta = (html, pattern, replacement) => {
  if (!pattern.test(html)) throw new Error(`No se encontró metadata para ${replacement}`)
  return html.replace(pattern, replacement)
}

const renderRoute = (route) => {
  const canonicalUrl = `${siteUrl}${route.path}`
  let html = baseTemplate

  html = replaceMeta(html, /<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
  html = replaceMeta(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`,
  )
  html = replaceMeta(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  )
  html = html
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${route.title}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${route.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${route.title}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${route.description}" />`)
    .replace(
      '</head>',
      `    <script type="application/ld+json">${JSON.stringify(route.schema)}</script>\n  </head>`,
    )
    .replace(
      '<div id="root"></div>',
      `<div id="root"><div class="seo-prerender-shell">${route.content}</div></div>`,
    )

  if (!html.includes(socialImage)) {
    throw new Error(`La imagen social no está configurada para ${route.path}`)
  }

  return html
}

for (const route of routePages) {
  const outputPath =
    route.path === '/'
      ? templatePath
      : join(distDirectory, route.path.slice(1), 'index.html')
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, renderRoute(route))
}

const notFoundHtml = renderRoute(routePages[0])
  .replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex, follow" />')
  .replace('<title>Peluquería y Colorimetría en Concepción | Susana Riquelme</title>', '<title>Página no encontrada | Susana Riquelme</title>')
writeFileSync(join(distDirectory, '404.html'), notFoundHtml)

console.log(`SEO prerender complete: ${routePages.length} indexable routes generated.`)
