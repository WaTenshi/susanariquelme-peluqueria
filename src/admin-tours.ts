import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import type { AdminTab } from './admin-navigation'

type TourDefinition = {
  title: string
  introduction: string
  steps: DriveStep[]
}

const tourStep = (
  element: string,
  title: string,
  description: string,
  side: 'top' | 'right' | 'bottom' | 'left' = 'bottom',
  align: 'start' | 'center' | 'end' = 'start',
): DriveStep => ({
  element,
  popover: { title, description, side, align },
})

const tourDefinitions: Record<AdminTab, TourDefinition> = {
  overview: {
    title: 'Inicio y resumen del salón',
    introduction:
      'Aquí puedes saber cómo está funcionando el salón sin abrir cada módulo. El recorrido explica qué representa cada bloque y dónde comenzar las tareas más habituales.',
    steps: [
      tourStep(
        '[data-tour="overview-metrics"]',
        'Indicadores principales',
        '<p>Cada tarjeta resume un dato distinto: productos visibles, clientas, sesiones, servicios, ingresos, novedades y alertas de stock.</p><p>Una cifra en este resumen no reemplaza el detalle: sirve para detectar rápidamente qué área necesita atención.</p>',
      ),
      tourStep(
        '[data-tour="overview-quick-actions"]',
        'Accesos a tareas frecuentes',
        '<p>Estos botones llevan directamente a Agenda, Clientas o Inventario.</p><p>Úsalos cuando ya sabes qué tarea vas a realizar; no crean ni modifican registros por sí solos.</p>',
      ),
      tourStep(
        '[data-tour="overview-analytics"]',
        'Actividad del sitio web',
        '<p>Este bloque resume cómo las personas interactúan con la página pública: visitas, productos abiertos y contactos por WhatsApp.</p><p>Los datos sirven como orientación comercial y no representan ventas confirmadas.</p>',
      ),
      tourStep(
        '[data-tour="overview-charts"]',
        'Contenido con mayor interés',
        '<p>Los gráficos comparan productos y secciones según sus visitas. Una barra más larga significa más interacción dentro del periodo registrado.</p>',
      ),
      tourStep(
        '[data-tour="overview-events"]',
        'Eventos recientes',
        '<p>Aquí se muestran las últimas acciones del sitio, como páginas visitadas o productos consultados.</p><p>Es un registro informativo; no debes editarlo manualmente.</p>',
      ),
    ],
  },
  hours: {
    title: 'Agenda de horas',
    introduction:
      'La Agenda reúne reservas, servicios, abonos y estados de atención. Aprenderás a registrar una hora, cambiar el día, interpretar el resumen y localizar una reserva.',
    steps: [
      tourStep(
        '[data-tour="hours-hero"]',
        'Centro de la agenda',
        '<p>Esta portada identifica la sección donde se gestionan las reservas del salón. Los datos se organizan por fecha, clienta y estilista.</p>',
      ),
      tourStep(
        '[data-tour="hours-create"]',
        'Registrar una nueva hora',
        '<p>Abre el formulario para elegir clienta, estilista, fecha, hora y servicios.</p><p>También permite anotar un abono, el método de pago y observaciones. Nada se registra hasta presionar <strong>Guardar hora</strong>.</p>',
        'left',
        'center',
      ),
      tourStep(
        '[data-tour="hours-day-navigation"]',
        'Cambiar el día consultado',
        '<p><strong>Día anterior</strong> y <strong>Día siguiente</strong> avanzan de a una fecha. El calendario permite saltar a una fecha exacta y <strong>Hoy</strong> regresa al día actual.</p>',
        'bottom',
        'end',
      ),
      tourStep(
        '[data-tour="hours-summary-metrics"]',
        'Resumen del día',
        '<p><strong>Realizadas, Pendientes y No realizadas</strong> cuentan horas según su estado.</p><p><strong>Abonos</strong> suma pagos anticipados; <strong>Servicios</strong> y <strong>Productos</strong> muestran los montos del día.</p>',
      ),
      tourStep(
        '[data-tour="hours-daily-table"]',
        'Vista rápida por horario',
        '<p>Cada fila reúne hora, clienta, estilista, servicio, abono y productos. Sirve para revisar la jornada completa sin abrir cada reserva.</p>',
      ),
      tourStep(
        '[data-tour="hours-board"]',
        'Listado operativo',
        '<p>Esta zona contiene las reservas que coinciden con la búsqueda y los filtros actuales. El número del encabezado indica cuántas se están mostrando.</p>',
      ),
      tourStep(
        '[data-tour="hours-filters"]',
        'Buscar y filtrar reservas',
        '<p>Escribe el nombre de una clienta o limita el listado por estilista y estado.</p><p>Si una reserva desaparece, revisa primero estos filtros; el registro no necesariamente fue eliminado.</p>',
      ),
      tourStep(
        '[data-tour="hours-list"]',
        'Tarjetas y acciones',
        '<p>Cada tarjeta muestra hora, clienta, estilista, servicios, estado, total y abono.</p><p><strong>Ver</strong> abre el detalle, <strong>Editar</strong> permite corregir la reserva y <strong>Anular</strong> solicita confirmación antes de cancelarla.</p>',
      ),
    ],
  },
  clients: {
    title: 'Directorio de clientas',
    introduction:
      'El directorio separa la búsqueda de la ficha técnica. Verás cómo encontrar una clienta, interpretar sus datos y mantener su historial de atenciones.',
    steps: [
      tourStep(
        '[data-tour="clients-directory"]',
        'Directorio privado',
        '<p>La columna izquierda reúne todas las fichas. Seleccionar una fila cambia la información mostrada a la derecha; no modifica los datos.</p>',
        'right',
      ),
      tourStep(
        '[data-tour="clients-create"]',
        'Crear una clienta',
        '<p>Abre una ficha nueva para registrar nombre, contacto, cumpleaños, comuna, Instagram, condición VIP y observaciones.</p><p>Los campos obligatorios se indican dentro del formulario antes de guardar.</p>',
      ),
      tourStep(
        '[data-tour="clients-search"]',
        'Búsqueda flexible',
        '<p>Puedes buscar por nombre, teléfono, correo o comuna. La lista se actualiza mientras escribes y no distingue entre mayúsculas y minúsculas.</p>',
      ),
      tourStep(
        '[data-tour="clients-filters"]',
        'Orden y filtros',
        '<p><strong>Todas</strong> elimina filtros; <strong>VIP</strong> muestra fichas destacadas. <strong>Más recientes</strong> y <strong>Menos recientes</strong> ordenan según la última atención.</p>',
      ),
      tourStep(
        '[data-tour="clients-list"]',
        'Seleccionar una ficha',
        '<p>Cada fila muestra iniciales, nombre, un dato de contacto y la última atención disponible. La marca VIP aparece cuando fue activada en la ficha.</p>',
      ),
      tourStep(
        '[data-tour="client-profile"]',
        'Ficha seleccionada',
        '<p>La zona derecha corresponde únicamente a la clienta seleccionada. Antes de editar o registrar una atención, confirma siempre el nombre del encabezado.</p>',
        'left',
      ),
      tourStep(
        '[data-tour="client-profile-actions"]',
        'Editar o agregar atención',
        '<p><strong>Editar ficha</strong> cambia los datos generales. <strong>Nueva atención</strong> agrega fecha, servicio, estilista, fórmula, monto y notas al historial técnico.</p>',
      ),
      tourStep(
        '[data-tour="client-contact"]',
        'Datos de contacto',
        '<p>Teléfono, cumpleaños, comuna, correo e Instagram se leen desde la ficha. “Sin información” significa que ese dato todavía no fue registrado.</p>',
      ),
      tourStep(
        '[data-tour="client-history"]',
        'Historial técnico',
        '<p>Las atenciones conservan la información técnica de cada visita. Puedes editar un registro incorrecto o eliminarlo después de revisar la confirmación.</p>',
      ),
    ],
  },
  appointments: {
    title: 'Finanzas del salón',
    introduction:
      'Finanzas consolida servicios, productos, abonos y resultados del equipo. Este recorrido explica cómo registrar ingresos y cambiar entre las cuatro formas de análisis.',
    steps: [
      tourStep(
        '[data-tour="finance-hero"]',
        'Total del periodo',
        '<p>La cifra principal suma los movimientos del mes seleccionado. Debajo se separan servicios y productos para detectar de dónde provienen los ingresos.</p>',
      ),
      tourStep(
        '[data-tour="finance-actions"]',
        'Acciones financieras',
        '<p><strong>Registrar servicio</strong> guarda un ingreso asociado a una clienta y estilista. <strong>Nueva estilista</strong> crea una ficha para asignar servicios y calcular pagos.</p>',
        'left',
      ),
      tourStep(
        '[data-tour="finance-toolbar"]',
        'Búsqueda y mes',
        '<p>La búsqueda acepta clienta, servicio, producto, estilista o boleta. El selector de mes recalcula todas las cifras y vistas de esta pantalla.</p>',
      ),
      tourStep(
        '[data-tour="finance-view-toggle"]',
        'Cuatro formas de revisar',
        '<p><strong>Resumen</strong> compara resultados; <strong>Estilistas</strong> abre fichas del equipo; <strong>Calendario</strong> distribuye ingresos por día; <strong>Registros</strong> muestra cada movimiento editable.</p>',
      ),
      tourStep(
        '[data-tour="finance-metrics"]',
        'Totales separados',
        '<p>Total mes reúne todo. Servicios, Productos y Abonos permiten comprobar la composición del monto sin mezclar tipos de ingreso.</p>',
      ),
      tourStep(
        '[data-tour="finance-chart"]',
        'Comparación anual',
        '<p>Cada columna representa la recaudación de un mes. La altura compara meses entre sí y el valor escrito muestra el monto exacto.</p>',
      ),
      tourStep(
        '[data-tour="finance-team"]',
        'Resultados por estilista',
        '<p>Estas filas separan servicios y productos por integrante. Seleccionar una estilista abre su ficha financiera con calendario y periodos de pago.</p>',
      ),
    ],
  },
  inventory: {
    title: 'Inventario y catálogo',
    introduction:
      'Inventario relaciona el catálogo público con existencias, compras, ventas y proveedores. El recorrido explica qué cambia cada acción y dónde revisar la trazabilidad.',
    steps: [
      tourStep(
        '[data-tour="inventory-summary"]',
        'Estado general',
        '<p>Estas tarjetas cuentan productos, alertas de stock, facturas y proveedores activos. “Stock bajo” aparece cuando la cantidad llega al mínimo configurado.</p>',
      ),
      tourStep(
        '[data-tour="inventory-actions"]',
        'Acciones de inventario',
        '<p><strong>Agregar producto</strong> crea la ficha del catálogo. <strong>Añadir factura</strong> ingresa compras y unidades. <strong>Registrar venta</strong> descuenta stock. <strong>Agregar proveedor</strong> crea un contacto comercial.</p>',
      ),
      tourStep(
        '[data-tour="inventory-toolbar"]',
        'Buscar y cambiar de vista',
        '<p>La búsqueda se adapta a la vista elegida. Usa <strong>Vista general</strong> para productos, <strong>Por factura</strong> para compras y <strong>Proveedores</strong> para contactos.</p>',
      ),
      tourStep(
        '[data-tour="inventory-status"]',
        'Alertas de existencias',
        '<p><strong>Todos</strong> muestra el catálogo completo; <strong>Stock bajo</strong> muestra productos en el mínimo y <strong>Agotados</strong> aquellos con cero unidades.</p>',
      ),
      tourStep(
        '[data-tour="inventory-list"]',
        'Productos y cantidades',
        '<p>Cada fila identifica producto, marca, SKU y stock actual. El color del estado permite reconocer rápidamente productos disponibles, bajos o agotados.</p>',
      ),
      tourStep(
        '[data-tour="inventory-row-actions"]',
        'Qué hace cada acción',
        '<p><strong>Mover stock</strong> ajusta unidades con un motivo. <strong>Configurar</strong> cambia SKU y mínimos. <strong>Editar catálogo</strong> cambia lo visible en la web. <strong>Eliminar</strong> solicita confirmación y retira el producto.</p>',
      ),
      tourStep(
        '[data-tour="inventory-movements"]',
        'Trazabilidad',
        '<p>Los últimos movimientos indican tipo, producto, variación, stock anterior, stock nuevo y motivo. Úsalo para revisar diferencias antes de corregir cantidades.</p>',
      ),
    ],
  },
  services: {
    title: 'Servicios publicados',
    introduction:
      'Este módulo controla la información que aparece en la sección Servicios del sitio público. Las categorías ordenan grupos y cada servicio contiene nombre, precio y visibilidad.',
    steps: [
      tourStep(
        '[data-tour="services-board"]',
        'Editor de servicios',
        '<p>Todo lo que se administra aquí corresponde al catálogo de servicios de la página. Revisa cuidadosamente texto, precio y visibilidad antes de guardar.</p>',
      ),
      tourStep(
        '[data-tour="services-actions"]',
        'Agregar contenido',
        '<p><strong>Agregar servicio</strong> crea una opción dentro de una categoría existente. <strong>Agregar categoría</strong> crea un grupo nuevo con título, orden y textos propios.</p>',
      ),
      tourStep(
        '[data-tour="services-list"]',
        'Orden de las categorías',
        '<p>Las categorías se presentan en el orden configurado. Cada bloque indica si está visible u oculto y cuántos servicios contiene.</p>',
      ),
      tourStep(
        '[data-tour="service-category"]',
        'Controles de una categoría',
        '<p><strong>Editar</strong> cambia sus textos y orden. <strong>Servicio</strong> agrega una opción dentro de ese grupo. <strong>Eliminar</strong> también elimina sus servicios asociados y siempre pide confirmación.</p>',
      ),
      tourStep(
        '[data-tour="service-items"]',
        'Servicios individuales',
        '<p>Cada fila muestra orden, nombre, precio y estado. Editar permite usar precio fijo, “Desde”, rango o texto especial; ocultar evita mostrarlo en la web sin borrar su contenido.</p>',
      ),
    ],
  },
  news: {
    title: 'Novedades del salón',
    introduction:
      'Novedades administra las publicaciones de la página pública. Verás cómo crear contenido, reconocer su estado y corregir o retirar una publicación.',
    steps: [
      tourStep(
        '[data-tour="news-board"]',
        'Listado de publicaciones',
        '<p>El número del encabezado indica cuántas novedades existen, incluyendo publicadas y ocultas.</p>',
      ),
      tourStep(
        '[data-tour="news-create"]',
        'Agregar una novedad',
        '<p>Abre el formulario para escribir categoría, fecha, título, resumen, contenido, imagen y orden.</p><p>La casilla de visibilidad decide si aparecerá inmediatamente en la web.</p>',
      ),
      tourStep(
        '[data-tour="news-list"]',
        'Estado de cada publicación',
        '<p>Cada fila muestra imagen, título, categoría, fecha y estado. <strong>Publicada</strong> es visible en el sitio; <strong>Oculta</strong> permanece guardada solo en el panel.</p>',
      ),
      tourStep(
        '[data-tour="news-actions"]',
        'Editar o eliminar',
        '<p><strong>Editar</strong> abre todos los campos actuales. <strong>Eliminar</strong> retira definitivamente la publicación después de una confirmación.</p>',
      ),
    ],
  },
  audit: {
    title: 'Historial de actividad',
    introduction:
      'El Historial permite saber qué cambió, sobre qué registro, quién realizó la acción y cuándo ocurrió. Es una herramienta de revisión y no un editor.',
    steps: [
      tourStep(
        '[data-tour="audit-heading"]',
        'Registro inmutable',
        '<p>El contador indica cuántos eventos cumplen los filtros actuales. Los registros no pueden editarse ni eliminarse desde el panel.</p>',
      ),
      tourStep(
        '[data-tour="audit-toolbar"]',
        'Localizar un cambio',
        '<p>Busca por persona, producto o texto del cambio. El selector limita los resultados a un módulo específico, como clientas, inventario o servicios.</p>',
      ),
      tourStep(
        '[data-tour="audit-list"]',
        'Lectura del historial',
        '<p>Los eventos aparecen en orden de actividad. El color y el icono distinguen creación, edición, archivo, eliminación y movimientos de stock.</p>',
      ),
      tourStep(
        '[data-tour="audit-action"]',
        'Tipo de acción y módulo',
        '<p>La primera columna explica qué ocurrió y en qué área. Esto ayuda a diferenciar, por ejemplo, una edición de catálogo de un ajuste de inventario.</p>',
      ),
      tourStep(
        '[data-tour="audit-detail"]',
        'Detalle del cambio',
        '<p>El nombre identifica el registro afectado y la lista describe los campos o cantidades modificadas. Revisa estos datos antes de realizar una corrección manual.</p>',
      ),
      tourStep(
        '[data-tour="audit-meta"]',
        'Responsable y fecha',
        '<p>El correo corresponde a la cuenta que realizó la acción. La fecha y hora permiten relacionarla con una atención o tarea concreta.</p>',
      ),
    ],
  },
}

let activeTour: Driver | null = null

export const adminTourBehavior: Pick<
  Config,
  | 'animate'
  | 'duration'
  | 'smoothScroll'
  | 'allowClose'
  | 'allowScroll'
  | 'allowKeyboardControl'
  | 'overlayClickBehavior'
  | 'disableActiveInteraction'
  | 'skipMissingElement'
> = {
  animate: true,
  duration: 380,
  smoothScroll: true,
  allowClose: true,
  allowScroll: true,
  allowKeyboardControl: true,
  overlayClickBehavior: 'close',
  disableActiveInteraction: true,
  skipMissingElement: true,
}

export const getAdminTourSteps = (tab: AdminTab): DriveStep[] => {
  const definition = tourDefinitions[tab]

  return [
    {
      popover: {
        title: definition.title,
        description: `<p>${definition.introduction}</p><p><strong>Puedes salir en cualquier momento</strong> con Escape, la X o tocando fuera de la explicación.</p>`,
        side: 'bottom',
        align: 'center',
      },
    },
    tourStep(
      '[data-tour="view-header"]',
      'Nombre y objetivo de la vista',
      '<p>La cabecera confirma siempre en qué módulo estás. Lee el título y la descripción antes de registrar información para evitar trabajar en la sección equivocada.</p>',
    ),
    ...definition.steps,
    tourStep(
      '[data-tour="help-button"]',
      'Puedes repetir esta ayuda',
      '<p>Presiona <strong>Ayuda</strong> cada vez que necesites volver a recorrer esta vista. El recorrido no crea, edita ni elimina datos.</p>',
      'bottom',
      'end',
    ),
    {
      popover: {
        title: 'Recorrido finalizado',
        description:
          '<p>Ya conoces los controles principales de esta vista. Puedes repetir el recorrido cuando quieras desde el botón <strong>Ayuda</strong>.</p>',
        side: 'bottom',
        align: 'center',
      },
    },
  ]
}

export const stopAdminTour = () => {
  activeTour?.destroy()
  activeTour = null
}

export const startAdminTour = (tab: AdminTab, trigger?: HTMLElement | null) => {
  stopAdminTour()

  const tour = driver({
    ...adminTourBehavior,
    overlayColor: '#171713',
    overlayOpacity: 0.78,
    stagePadding: 8,
    stageRadius: 14,
    popoverClass: 'admin-driver-popover',
    popoverOffset: 12,
    showButtons: ['next', 'previous', 'close'],
    showProgress: true,
    progressText: 'Paso {{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Finalizar',
    steps: getAdminTourSteps(tab),
    onPopoverRender: (popover) => {
      popover.closeButton.setAttribute('aria-label', 'Salir del recorrido')
      popover.closeButton.setAttribute('title', 'Salir del recorrido')
    },
    onDestroyed: () => {
      if (activeTour === tour) activeTour = null
      trigger?.focus()
    },
  })

  activeTour = tour
  tour.drive()
}
