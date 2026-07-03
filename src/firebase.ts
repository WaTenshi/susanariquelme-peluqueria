import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getRequiredEnv } from './env'
import type {
  AuditAction,
  AuditEntity,
  AppointmentRecord,
  AuditLog,
  Client,
  ClientVisit,
  InventoryItem,
  InventoryInvoice,
  InventoryInvoiceLine,
  InventoryMovement,
  InventoryMovementType,
  InventorySupplier,
  NewsItem,
  Product,
  ProductSale,
  ServiceCategory,
  ServiceItem,
  ServiceSettings,
  SiteEvent,
  SiteEventName,
  Stylist,
} from './types'

const firebaseConfig = {
  apiKey: getRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  messagingSenderId: getRequiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getRequiredEnv('VITE_FIREBASE_MEASUREMENT_ID'),
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

void setPersistence(auth, browserLocalPersistence)

const analyticsPromise =
  typeof window === 'undefined'
    ? Promise.resolve(null)
    : isSupported().then((supported) => (supported ? getAnalytics(app) : null))

const mapDocument = <T>(id: string, data: DocumentData) =>
  ({ id, ...data }) as T

export const subscribeToProducts = (
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'products'), orderBy('order', 'asc')),
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapDocument<Product>(item.id, item.data()))),
    onError,
  )

export const subscribeToNews = (
  onData: (news: NewsItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'news'), orderBy('order', 'asc')),
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapDocument<NewsItem>(item.id, item.data()))),
    onError,
  )

export const subscribeToServiceCategories = (
  onData: (categories: ServiceCategory[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'serviceCategories'), orderBy('order', 'asc')),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<ServiceCategory>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToServiceItems = (
  onData: (items: ServiceItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'serviceItems'), orderBy('order', 'asc')),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) => mapDocument<ServiceItem>(item.id, item.data())),
      ),
    onError,
  )

export const subscribeToServiceSettings = (
  onData: (settings: ServiceSettings | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    doc(db, 'siteSettings', 'services'),
    (snapshot) =>
      onData(snapshot.exists() ? (snapshot.data() as ServiceSettings) : null),
    onError,
  )

export const subscribeToAnalytics = (
  onData: (events: SiteEvent[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'analyticsEvents'), orderBy('createdAt', 'desc'), limit(1000)),
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapDocument<SiteEvent>(item.id, item.data()))),
    onError,
  )

export const subscribeToClients = (
  onData: (clients: Client[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'clients'), orderBy('searchText', 'asc')),
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapDocument<Client>(item.id, item.data()))),
    onError,
  )

export const subscribeToClientVisits = (
  clientId: string,
  onData: (visits: ClientVisit[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(
      collection(db, 'clients', clientId, 'visits'),
      orderBy('createdAt', 'desc'),
    ),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<ClientVisit>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToAllClientVisits = (
  onData: (visits: ClientVisit[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    collectionGroup(db, 'visits'),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<ClientVisit>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToAppointments = (
  onData: (appointments: AppointmentRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'appointments'), orderBy('date', 'desc')),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<AppointmentRecord>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToInventory = (
  onData: (items: InventoryItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(collection(db, 'inventory'), (snapshot) => {
    onData(
      snapshot.docs.map((item) =>
        mapDocument<InventoryItem>(item.id, item.data()),
      ),
    )
  }, onError)

export const subscribeToInventoryMovements = (
  onData: (movements: InventoryMovement[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(
      collection(db, 'inventoryMovements'),
      orderBy('createdAt', 'desc'),
      limit(200),
    ),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<InventoryMovement>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToInventoryInvoices = (
  onData: (invoices: InventoryInvoice[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(
      collection(db, 'inventoryInvoices'),
      orderBy('createdAt', 'desc'),
      limit(200),
    ),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<InventoryInvoice>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToInventoryInvoiceLines = (
  onData: (lines: InventoryInvoiceLine[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(
      collection(db, 'inventoryInvoiceLines'),
      orderBy('createdAt', 'desc'),
      limit(1200),
    ),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<InventoryInvoiceLine>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToInventorySuppliers = (
  onData: (suppliers: InventorySupplier[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'inventorySuppliers'), orderBy('searchText', 'asc')),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<InventorySupplier>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToStylists = (
  onData: (stylists: Stylist[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'stylists'), orderBy('searchText', 'asc')),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) =>
          mapDocument<Stylist>(item.id, item.data()),
        ),
      ),
    onError,
  )

export const subscribeToAuditLogs = (
  onData: (logs: AuditLog[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(500)),
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapDocument<AuditLog>(item.id, item.data()))),
    onError,
  )

const cleanProduct = (product: Product) => {
  const productData = { ...product }
  delete productData.id
  return productData
}

const cleanNewsItem = (newsItem: NewsItem) => {
  const newsData = { ...newsItem }
  delete newsData.id
  return newsData
}

const cleanServiceCategory = (category: ServiceCategory) => {
  const categoryData: Partial<ServiceCategory> = { ...category }
  delete categoryData.id
  delete categoryData.items
  return categoryData
}

const cleanServiceItem = (item: ServiceItem) => {
  const itemData: Partial<ServiceItem> = { ...item }
  delete itemData.id
  return itemData
}

const cleanClient = (client: Client) => {
  const clientData = { ...client }
  delete clientData.id
  return clientData
}

const cleanSupplier = (supplier: InventorySupplier) => {
  const supplierData = { ...supplier }
  delete supplierData.id
  return supplierData
}

const cleanStylist = (stylist: Stylist) => {
  const stylistData = { ...stylist }
  delete stylistData.id
  return stylistData
}

const cleanVisit = (visit: ClientVisit) => {
  const visitData = { ...visit }
  delete visitData.id
  return visitData
}

const cleanAppointment = (appointment: AppointmentRecord) => {
  const appointmentData = { ...appointment }
  delete appointmentData.id
  return appointmentData
}

const actor = () => ({
  actorUid: auth.currentUser?.uid || 'unknown',
  actorEmail: auth.currentUser?.email || 'Cuenta administradora',
})

const auditReference = () => doc(collection(db, 'auditLogs'))

const auditData = (
  entityType: AuditEntity,
  entityId: string,
  entityName: string,
  action: AuditAction,
  changes: string[],
) => ({
  entityType,
  entityId,
  entityName,
  action,
  changes,
  ...actor(),
  createdAt: serverTimestamp(),
})

const humanValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (value === null || value === undefined || value === '') return 'Sin información'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

const describeChanges = (
  previous: Record<string, unknown> | null,
  next: Record<string, unknown>,
  labels: Record<string, string>,
) =>
  Object.entries(labels)
    .filter(([key]) => !previous || previous[key] !== next[key])
    .map(
      ([key, label]) =>
        previous
          ? `${label}: ${humanValue(previous[key])} → ${humanValue(next[key])}`
          : `${label}: ${humanValue(next[key])}`,
    )

export const saveProduct = async (product: Product) => {
  const reference = product.id
    ? doc(db, 'products', product.id)
    : doc(collection(db, 'products'))
  const batch = writeBatch(db)
  const productData = cleanProduct(product)
  const previous = product.id ? (await getDoc(reference)).data() || null : null
  const changes = describeChanges(previous, productData, {
    brand: 'Marca',
    title: 'Nombre',
    price: 'Precio',
    image: 'Imagen',
    category: 'Categoría',
    description: 'Descripción',
    benefits: 'Beneficios',
    size: 'Formato',
    order: 'Orden',
    active: 'Visible',
  })
  batch.set(
    reference,
    {
      ...productData,
      updatedAt: serverTimestamp(),
      ...(product.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  if (!product.id) {
    batch.set(doc(db, 'inventory', reference.id), {
      productId: reference.id,
      sku: '',
      stock: 0,
      minimumStock: 2,
      costPrice: 0,
      supplier: '',
      location: '',
      updatedAt: serverTimestamp(),
    })
  }
  batch.set(
    auditReference(),
    auditData(
      'product',
      reference.id,
      product.title,
      product.id ? 'update' : 'create',
      changes.length ? changes : ['Producto guardado sin cambios visibles'],
    ),
  )
  await batch.commit()
}

export const saveNewsItem = async (newsItem: NewsItem) => {
  const reference = newsItem.id
    ? doc(db, 'news', newsItem.id)
    : doc(collection(db, 'news'))
  const batch = writeBatch(db)
  const previous = newsItem.id
    ? (await getDoc(reference)).data() || null
    : null
  batch.set(
    reference,
    {
      ...cleanNewsItem(newsItem),
      updatedAt: serverTimestamp(),
      ...(newsItem.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'news',
      reference.id,
      newsItem.title,
      newsItem.id ? 'update' : 'create',
      describeChanges(previous, cleanNewsItem(newsItem), {
        title: 'Título',
        category: 'Categoría',
        date: 'Fecha',
        description: 'Descripción',
        link: 'Enlace',
        image: 'Imagen',
        order: 'Orden',
        active: 'Visible',
      }),
    ),
  )
  await batch.commit()
}

export const saveServiceCategory = async (category: ServiceCategory) => {
  const reference = category.id
    ? doc(db, 'serviceCategories', category.id)
    : doc(collection(db, 'serviceCategories'))
  const data = cleanServiceCategory(category)
  const previous = category.id ? (await getDoc(reference)).data() || null : null
  const batch = writeBatch(db)
  batch.set(
    reference,
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(category.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    doc(db, 'siteSettings', 'services'),
    { servicesInitialized: true, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'service',
      reference.id,
      category.title,
      category.id ? 'update' : 'create',
      describeChanges(previous, data, {
        kicker: 'Etiqueta',
        title: 'Categoría',
        note: 'Nota',
        accent: 'Acento',
        disclaimer: 'Aviso',
        order: 'Orden',
        active: 'Visible',
      }),
    ),
  )
  await batch.commit()
}

export const saveServiceItem = async (item: ServiceItem) => {
  const reference = item.id
    ? doc(db, 'serviceItems', item.id)
    : doc(collection(db, 'serviceItems'))
  const data = cleanServiceItem(item)
  const previous = item.id ? (await getDoc(reference)).data() || null : null
  const batch = writeBatch(db)
  batch.set(
    reference,
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(item.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    doc(db, 'siteSettings', 'services'),
    { servicesInitialized: true, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'service',
      reference.id,
      item.name,
      item.id ? 'update' : 'create',
      describeChanges(previous, data, {
        categoryId: 'Categoría',
        name: 'Servicio',
        price: 'Precio',
        order: 'Orden',
        active: 'Visible',
      }),
    ),
  )
  await batch.commit()
}

export const removeProduct = async (id: string, name = 'Producto') => {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'products', id))
  batch.delete(doc(db, 'inventory', id))
  batch.set(
    auditReference(),
    auditData('product', id, name, 'delete', ['Producto eliminado del catálogo']),
  )
  await batch.commit()
}

export const removeNewsItem = async (id: string, name = 'Novedad') => {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'news', id))
  batch.set(
    auditReference(),
    auditData('news', id, name, 'delete', ['Publicación eliminada']),
  )
  await batch.commit()
}

export const removeServiceCategory = async (
  category: ServiceCategory,
  items: ServiceItem[],
) => {
  if (!category.id) return
  const batch = writeBatch(db)
  batch.delete(doc(db, 'serviceCategories', category.id))
  items
    .filter((item) => item.id && item.categoryId === category.id)
    .forEach((item) => batch.delete(doc(db, 'serviceItems', item.id as string)))
  batch.set(
    doc(db, 'siteSettings', 'services'),
    { servicesInitialized: true, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'service',
      category.id,
      category.title,
      'delete',
      ['Categoría y servicios asociados eliminados'],
    ),
  )
  await batch.commit()
}

export const removeServiceItem = async (item: ServiceItem) => {
  if (!item.id) return
  const batch = writeBatch(db)
  batch.delete(doc(db, 'serviceItems', item.id))
  batch.set(
    doc(db, 'siteSettings', 'services'),
    { servicesInitialized: true, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData('service', item.id, item.name, 'delete', ['Servicio eliminado']),
  )
  await batch.commit()
}

export const saveClient = async (client: Client) => {
  const reference = client.id
    ? doc(db, 'clients', client.id)
    : doc(collection(db, 'clients'))
  const data = cleanClient(client)
  const previous = client.id ? (await getDoc(reference)).data() || null : null
  const batch = writeBatch(db)
  batch.set(
    reference,
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(client.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'client',
      reference.id,
      [client.firstName, client.paternalSurname, client.maternalSurname]
        .filter(Boolean)
        .join(' '),
      client.id ? 'update' : 'create',
      describeChanges(previous, data, {
        firstName: 'Nombre',
        paternalSurname: 'Apellido paterno',
        maternalSurname: 'Apellido materno',
        phone: 'Teléfono',
        birthday: 'Cumpleaños',
        commune: 'Comuna',
        email: 'Correo',
        instagram: 'Instagram',
        vip: 'Clienta VIP',
        notes: 'Observaciones',
        active: 'Estado activo',
      }),
    ),
  )
  await batch.commit()
  return reference.id
}

export const saveInventorySupplier = async (supplier: InventorySupplier) => {
  const reference = supplier.id
    ? doc(db, 'inventorySuppliers', supplier.id)
    : doc(collection(db, 'inventorySuppliers'))
  const data = cleanSupplier(supplier)
  const previous = supplier.id ? (await getDoc(reference)).data() || null : null
  const batch = writeBatch(db)
  batch.set(
    reference,
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(supplier.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'inventory',
      reference.id,
      supplier.name,
      supplier.id ? 'update' : 'create',
      describeChanges(previous, data, {
        name: 'Proveedor',
        rut: 'RUT',
        contactName: 'Contacto',
        phone: 'Teléfono',
        email: 'Correo',
        address: 'Dirección',
        notes: 'Notas',
        active: 'Activo',
      }),
    ),
  )
  await batch.commit()
}

export const removeInventorySupplier = async (supplier: InventorySupplier) => {
  if (!supplier.id) return
  const batch = writeBatch(db)
  batch.set(
    doc(db, 'inventorySuppliers', supplier.id),
    { active: false, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'inventory',
      supplier.id,
      supplier.name,
      'delete',
      ['Proveedor archivado'],
    ),
  )
  await batch.commit()
}

export const saveStylist = async (stylist: Stylist) => {
  const reference = stylist.id
    ? doc(db, 'stylists', stylist.id)
    : doc(collection(db, 'stylists'))
  const data = cleanStylist(stylist)
  const previous = stylist.id ? (await getDoc(reference)).data() || null : null
  const batch = writeBatch(db)
  batch.set(
    reference,
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(stylist.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'appointment',
      reference.id,
      stylist.name,
      stylist.id ? 'update' : 'create',
      describeChanges(previous, data, {
        name: 'Estilista',
        role: 'Rol',
        phone: 'Teléfono',
        email: 'Correo',
        paymentFrequency: 'Frecuencia de pago',
        active: 'Activa',
        notes: 'Notas',
      }),
    ),
  )
  await batch.commit()
}

export const removeStylist = async (stylist: Stylist) => {
  if (!stylist.id) return
  const batch = writeBatch(db)
  batch.set(
    doc(db, 'stylists', stylist.id),
    { active: false, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'appointment',
      stylist.id,
      stylist.name,
      'delete',
      ['Estilista archivada'],
    ),
  )
  await batch.commit()
}

export const removeClient = async (client: Client) => {
  if (!client.id) return
  const batch = writeBatch(db)
  batch.set(
    doc(db, 'clients', client.id),
    { active: false, updatedAt: serverTimestamp() },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'client',
      client.id,
      [client.firstName, client.paternalSurname].filter(Boolean).join(' '),
      'delete',
      ['Ficha archivada; su historial técnico se conserva'],
    ),
  )
  await batch.commit()
}

export const saveClientVisit = async (
  visit: ClientVisit,
  clientName: string,
) => {
  const reference = visit.id
    ? doc(db, 'clients', visit.clientId, 'visits', visit.id)
    : doc(collection(db, 'clients', visit.clientId, 'visits'))
  const batch = writeBatch(db)
  const previous = visit.id ? (await getDoc(reference)).data() || null : null
  batch.set(
    reference,
    {
      ...cleanVisit(visit),
      updatedAt: serverTimestamp(),
      ...(visit.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'visit',
      reference.id,
      clientName,
      visit.id ? 'update' : 'create',
      describeChanges(previous, cleanVisit(visit), {
        date: 'Fecha',
        service: 'Servicio',
        colorFormula: 'Fórmula / colorimetría',
        stylist: 'Estilista',
        notes: 'Notas',
        amount: 'Valor',
      }),
    ),
  )
  await batch.commit()
}

export const removeClientVisit = async (
  visit: ClientVisit,
  clientName: string,
) => {
  if (!visit.id) return
  const batch = writeBatch(db)
  batch.delete(doc(db, 'clients', visit.clientId, 'visits', visit.id))
  batch.set(
    auditReference(),
    auditData(
      'visit',
      visit.id,
      clientName,
      'delete',
      [`Atención eliminada: ${visit.date || 'sin fecha'} · ${visit.service}`],
    ),
  )
  await batch.commit()
}

const appointmentTitle = (appointment: AppointmentRecord) =>
  appointment.clientName ||
  appointment.productClientName ||
  appointment.service ||
  appointment.productName ||
  'Hora registrada'

export const saveAppointment = async (appointment: AppointmentRecord) => {
  const reference = appointment.id
    ? doc(db, 'appointments', appointment.id)
    : appointment.sourceId
      ? doc(db, 'appointments', appointment.sourceId)
      : doc(collection(db, 'appointments'))
  const previous = appointment.id ? (await getDoc(reference)).data() || null : null
  const data = {
    ...cleanAppointment(appointment),
    sourceId: appointment.sourceId || reference.id,
  }
  const batch = writeBatch(db)
  batch.set(
    reference,
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(appointment.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'appointment',
      reference.id,
      appointmentTitle(appointment),
      appointment.id ? 'update' : 'create',
      describeChanges(previous, data, {
        date: 'Fecha',
        depositDate: 'Fecha abono',
        depositAmount: 'Abono',
        survey: 'Encuesta',
        stylist: 'Estilista',
        clientName: 'Clienta',
        service: 'Servicio',
        serviceCash: 'Servicio efectivo',
        serviceCard: 'Servicio tarjeta',
        serviceTransfer: 'Servicio transferencia',
        serviceReceipt: 'Boleta servicio',
        productStylist: 'Venta estilista',
        productClientName: 'Nombre venta',
        productName: 'Producto',
        productCash: 'Producto efectivo',
        productCard: 'Producto tarjeta',
        productTransfer: 'Producto transferencia',
        productReceipt: 'Boleta producto',
        notes: 'Notas',
      }),
    ),
  )
  await batch.commit()
}

export const importAppointments = async (appointments: AppointmentRecord[]) => {
  const chunks: AppointmentRecord[][] = []
  for (let index = 0; index < appointments.length; index += 450) {
    chunks.push(appointments.slice(index, index + 450))
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db)
    chunk.forEach((appointment) => {
      const reference = doc(
        db,
        'appointments',
        appointment.sourceId || crypto.randomUUID(),
      )
      batch.set(
        reference,
        {
          ...cleanAppointment(appointment),
          sourceId: appointment.sourceId || reference.id,
          updatedAt: serverTimestamp(),
          importedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })
    await batch.commit()
  }

  const auditBatch = writeBatch(db)
  auditBatch.set(
    auditReference(),
    auditData(
      'appointment',
      'bulk-import',
      'Importación de horas',
      'create',
      [`${appointments.length} registros importados desde Excel`],
    ),
  )
  await auditBatch.commit()
}

export const ensureInitialAppointmentsSeeded = async (
  appointments: AppointmentRecord[],
) => {
  const seedReference = doc(db, 'systemSeeds', 'hours2026')
  const seedSnapshot = await getDoc(seedReference)
  if (seedSnapshot.exists()) return

  const batch = writeBatch(db)
  appointments.forEach((appointment) => {
    const reference = doc(db, 'appointments', appointment.sourceId)
    batch.set(
      reference,
      {
        ...cleanAppointment(appointment),
        importedAt: serverTimestamp(),
        sourceId: appointment.sourceId,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  })
  batch.set(seedReference, {
    key: 'hours2026',
    records: appointments.length,
    source: 'HORAS 2026.xlsx',
    createdAt: serverTimestamp(),
    ...actor(),
  })
  batch.set(
    auditReference(),
    auditData(
      'appointment',
      'hours2026',
      'Carga inicial HORAS 2026',
      'create',
      [`${appointments.length} registros cargados automáticamente desde Excel`],
    ),
  )
  await batch.commit()
}

export const ensureInitialServicesSeeded = async (
  categories: ServiceCategory[],
) => {
  const seedReference = doc(db, 'systemSeeds', 'servicesV1')
  const seedSnapshot = await getDoc(seedReference)
  if (seedSnapshot.exists()) return

  const batch = writeBatch(db)
  let itemCount = 0
  categories.forEach((category) => {
    const categoryReference = doc(collection(db, 'serviceCategories'))
    const categoryData = cleanServiceCategory({
      ...category,
      id: categoryReference.id,
    })
    batch.set(categoryReference, {
      ...categoryData,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
    category.items.forEach((item) => {
      const itemReference = doc(collection(db, 'serviceItems'))
      batch.set(itemReference, {
        ...cleanServiceItem({
          ...item,
          id: itemReference.id,
          categoryId: categoryReference.id,
        }),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      itemCount += 1
    })
  })
  batch.set(doc(db, 'siteSettings', 'services'), {
    servicesInitialized: true,
    updatedAt: serverTimestamp(),
  })
  batch.set(seedReference, {
    key: 'servicesV1',
    categories: categories.length,
    items: itemCount,
    createdAt: serverTimestamp(),
    ...actor(),
  })
  batch.set(
    auditReference(),
    auditData(
      'service',
      'servicesV1',
      'Carga inicial de servicios',
      'create',
      [`${categories.length} categorías y ${itemCount} servicios cargados`],
    ),
  )
  await batch.commit()
}

export const removeAppointment = async (appointment: AppointmentRecord) => {
  const appointmentId = appointment.id || appointment.sourceId
  if (!appointmentId) return
  const batch = writeBatch(db)
  batch.delete(doc(db, 'appointments', appointmentId))
  batch.set(
    auditReference(),
    auditData(
      'appointment',
      appointmentId,
      appointmentTitle(appointment),
      'delete',
      [`Hora eliminada: ${appointment.date || 'sin fecha'}`],
    ),
  )
  await batch.commit()
}

export const saveInventoryDetails = async (
  product: Product,
  item: InventoryItem,
) => {
  const batch = writeBatch(db)
  const reference = doc(db, 'inventory', product.id || item.productId)
  const previous = (await getDoc(reference)).data() || null
  const inventoryData = { ...item } as Partial<InventoryItem>
  delete inventoryData.id
  batch.set(
    reference,
    {
      ...inventoryData,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  batch.set(
    auditReference(),
    auditData(
      'inventory',
      product.id || item.productId,
      product.title,
      'update',
      describeChanges(previous, inventoryData, {
        sku: 'SKU',
        minimumStock: 'Stock mínimo',
        costPrice: 'Costo unitario',
        supplier: 'Proveedor',
        location: 'Ubicación',
      }),
    ),
  )
  await batch.commit()
}

const IVA_RATE = 0.19

const moneyRound = (value: number) => Math.round(value)

const invoiceLineTotals = (line: {
  quantity: number
  netUnitValue: number
  discountTotal: number
}) => {
  const quantity = Math.max(line.quantity, 0)
  const netTotal = Math.max(line.netUnitValue * quantity - line.discountTotal, 0)
  const grossTotal = moneyRound(netTotal * (1 + IVA_RATE))
  return {
    netTotal,
    grossUnitValue: quantity ? moneyRound(grossTotal / quantity) : 0,
    grossTotalValue: grossTotal,
  }
}

export type InventoryInvoiceInput = {
  invoiceNumber: string
  supplier: string
  invoiceDate: string
  paymentMethod: string
  image: string
  notes: string
  lines: Array<{
    productId: string
    productName: string
    sku: string
    quantity: number
    netUnitValue: number
    discountTotal: number
  }>
}

export const saveInventoryInvoice = async (invoice: InventoryInvoiceInput) => {
  const validLines = invoice.lines
    .map((line) => ({
      ...line,
      quantity: Math.max(Number(line.quantity), 0),
      netUnitValue: Math.max(Number(line.netUnitValue), 0),
      discountTotal: Math.max(Number(line.discountTotal), 0),
    }))
    .filter((line) => line.productId && line.productName && line.quantity > 0)

  if (!invoice.invoiceNumber.trim()) {
    throw new Error('Ingresa el número de factura.')
  }
  if (!validLines.length) {
    throw new Error('Agrega al menos un producto válido a la factura.')
  }

  const invoiceReference = doc(collection(db, 'inventoryInvoices'))
  const auditLogReference = auditReference()
  const createdAt = serverTimestamp()

  const totals = validLines.reduce(
    (accumulator, line) => {
      const lineTotals = invoiceLineTotals(line)
      accumulator.netTotal += lineTotals.netTotal
      accumulator.grossTotal += lineTotals.grossTotalValue
      return accumulator
    },
    { netTotal: 0, grossTotal: 0 },
  )

  const quantitiesByProduct = new Map<
    string,
    { productName: string; sku: string; quantity: number }
  >()
  validLines.forEach((line) => {
    const current = quantitiesByProduct.get(line.productId) || {
      productName: line.productName,
      sku: line.sku,
      quantity: 0,
    }
    current.quantity += line.quantity
    quantitiesByProduct.set(line.productId, current)
  })

  await runTransaction(db, async (transaction) => {
    const inventorySnapshots = new Map<string, DocumentData | null>()
    for (const productId of quantitiesByProduct.keys()) {
      const snapshot = await transaction.get(doc(db, 'inventory', productId))
      inventorySnapshots.set(productId, snapshot.exists() ? snapshot.data() : null)
    }

    transaction.set(invoiceReference, {
      invoiceNumber: invoice.invoiceNumber.trim(),
      supplier: invoice.supplier.trim(),
      invoiceDate: invoice.invoiceDate,
      paymentMethod: invoice.paymentMethod.trim(),
      image: invoice.image,
      notes: invoice.notes.trim(),
      netTotal: moneyRound(totals.netTotal),
      taxTotal: moneyRound(totals.grossTotal - totals.netTotal),
      grossTotal: moneyRound(totals.grossTotal),
      lineCount: validLines.length,
      ...actor(),
      createdAt,
      updatedAt: createdAt,
    })

    validLines.forEach((line) => {
      const lineReference = doc(collection(db, 'inventoryInvoiceLines'))
      const lineTotals = invoiceLineTotals(line)
      transaction.set(lineReference, {
        invoiceId: invoiceReference.id,
        invoiceNumber: invoice.invoiceNumber.trim(),
        invoiceDate: invoice.invoiceDate,
        supplier: invoice.supplier.trim(),
        productId: line.productId,
        productName: line.productName.trim(),
        sku: line.sku.trim(),
        quantity: line.quantity,
        remainingQuantity: line.quantity,
        netUnitValue: line.netUnitValue,
        discountTotal: line.discountTotal,
        grossUnitValue: lineTotals.grossUnitValue,
        grossTotalValue: lineTotals.grossTotalValue,
        createdAt,
        updatedAt: createdAt,
      })
    })

    quantitiesByProduct.forEach((entry, productId) => {
      const inventoryReference = doc(db, 'inventory', productId)
      const current = inventorySnapshots.get(productId) as InventoryItem | null
      const previousStock = current?.stock || 0
      const nextStock = previousStock + entry.quantity
      transaction.set(
        inventoryReference,
        {
          productId,
          sku: current?.sku || entry.sku,
          stock: nextStock,
          minimumStock: current?.minimumStock ?? 2,
          costPrice: current?.costPrice ?? 0,
          supplier: current?.supplier || invoice.supplier.trim(),
          location: current?.location || '',
          updatedAt: createdAt,
        },
        { merge: true },
      )
      transaction.set(doc(collection(db, 'inventoryMovements')), {
        productId,
        productName: entry.productName,
        type: 'entry',
        quantity: entry.quantity,
        previousStock,
        newStock: nextStock,
        reason: `Factura ${invoice.invoiceNumber.trim()}`,
        ...actor(),
        createdAt,
      })
    })

    transaction.set(
      auditLogReference,
      auditData(
        'inventory',
        invoiceReference.id,
        `Factura ${invoice.invoiceNumber.trim()}`,
        'create',
        [
          `${validLines.length} productos ingresados por factura`,
          `Total con IVA: ${moneyRound(totals.grossTotal)}`,
        ],
      ),
    )
  })
}

const saleLineTotal = (line: ProductSale['lines'][number]) =>
  Math.max(line.unitPrice * line.quantity - line.discountTotal, 0)

const paymentAmounts = (sale: ProductSale) => {
  const total = sale.lines.reduce((sum, line) => sum + saleLineTotal(line), 0)
  return {
    productCash: sale.paymentMethod === 'cash' ? total : 0,
    productCard:
      sale.paymentMethod === 'credit' || sale.paymentMethod === 'debit'
        ? total
        : 0,
    productTransfer:
      sale.paymentMethod === 'transfer' || sale.paymentMethod === 'check'
        ? total
        : 0,
    total,
  }
}

const lineDateValue = (line: InventoryInvoiceLine) => {
  const createdAt = line.createdAt?.toDate?.()
  if (createdAt) return createdAt.getTime()
  return new Date(`${line.invoiceDate || '2000-01-01'}T12:00:00`).getTime()
}

export const registerProductSale = async (
  sale: ProductSale,
  invoiceLines: InventoryInvoiceLine[],
) => {
  const validLines = sale.lines
    .map((line) => ({
      ...line,
      quantity: Math.max(Number(line.quantity), 0),
      unitPrice: Math.max(Number(line.unitPrice), 0),
      discountTotal: Math.max(Number(line.discountTotal), 0),
    }))
    .filter((line) => line.productId && line.quantity > 0)

  if (!validLines.length) {
    throw new Error('Agrega al menos un producto a la venta.')
  }
  if (!sale.stylist.trim()) {
    throw new Error('Selecciona quién realizó la venta.')
  }

  const appointmentReference = doc(collection(db, 'appointments'))
  const clientVisitReference = sale.clientId
    ? doc(collection(db, 'clients', sale.clientId, 'visits'))
    : null
  const auditLogReference = auditReference()
  const createdAt = serverTimestamp()

  await runTransaction(db, async (transaction) => {
    const inventorySnapshots = new Map<string, DocumentData | null>()
    const productIds = [...new Set(validLines.map((line) => line.productId))]
    for (const productId of productIds) {
      const snapshot = await transaction.get(doc(db, 'inventory', productId))
      inventorySnapshots.set(productId, snapshot.exists() ? snapshot.data() : null)
    }

    const candidateLines = new Map<string, InventoryInvoiceLine[]>()
    productIds.forEach((productId) => {
      candidateLines.set(
        productId,
        invoiceLines
          .filter(
            (line) =>
              line.id &&
              line.productId === productId &&
              line.remainingQuantity > 0,
          )
          .sort((first, second) => lineDateValue(first) - lineDateValue(second)),
      )
    })

    const lineSnapshots = new Map<string, DocumentData>()
    for (const line of [...candidateLines.values()].flat()) {
      const snapshot = await transaction.get(doc(db, 'inventoryInvoiceLines', line.id))
      if (snapshot.exists()) lineSnapshots.set(line.id, snapshot.data())
    }

    const allocations: Array<{ id: string; quantity: number; previous: number }> = []
    validLines.forEach((saleLine) => {
      const currentInventory = inventorySnapshots.get(saleLine.productId)
      const currentStock =
        typeof currentInventory?.stock === 'number' ? currentInventory.stock : 0
      if (currentStock < saleLine.quantity) {
        throw new Error(`No hay stock suficiente para ${saleLine.productName}.`)
      }

      let pending = saleLine.quantity
      const candidates = candidateLines.get(saleLine.productId) || []
      candidates.forEach((candidate) => {
        if (pending <= 0) return
        const freshLine = lineSnapshots.get(candidate.id)
        const remaining =
          typeof freshLine?.remainingQuantity === 'number'
            ? freshLine.remainingQuantity
            : 0
        const quantity = Math.min(remaining, pending)
        if (quantity > 0) {
          allocations.push({
            id: candidate.id,
            quantity,
            previous: remaining,
          })
          pending -= quantity
        }
      })

      // Legacy/manual stock may exist before invoice-level tracking was added.
      // In that case the aggregate stock remains the source of truth for the sale.
    })

    validLines.forEach((saleLine) => {
      const inventoryReference = doc(db, 'inventory', saleLine.productId)
      const current = inventorySnapshots.get(saleLine.productId) as InventoryItem | null
      const previousStock = current?.stock || 0
      const nextStock = previousStock - saleLine.quantity
      transaction.set(
        inventoryReference,
        {
          ...current,
          productId: saleLine.productId,
          stock: nextStock,
          updatedAt: createdAt,
        },
        { merge: true },
      )
      transaction.set(doc(collection(db, 'inventoryMovements')), {
        productId: saleLine.productId,
        productName: saleLine.productName,
        type: 'sale',
        quantity: -saleLine.quantity,
        previousStock,
        newStock: nextStock,
        reason: `Venta boleta ${sale.receiptNumber || 'sin boleta'}`,
        ...actor(),
        createdAt,
      })
    })

    allocations.forEach((allocation) => {
      transaction.set(
        doc(db, 'inventoryInvoiceLines', allocation.id),
        {
          remainingQuantity: allocation.previous - allocation.quantity,
          updatedAt: createdAt,
        },
        { merge: true },
      )
    })

    const amounts = paymentAmounts({ ...sale, lines: validLines })
    const productSummary = validLines
      .map((line) => `${line.quantity} x ${line.productName}`)
      .join(', ')
      .slice(0, 300)

    transaction.set(appointmentReference, {
      date: sale.date,
      depositDate: '',
      depositAmount: 0,
      survey: '',
      stylist: '',
      clientName: sale.clientName.trim(),
      service: '',
      serviceCash: 0,
      serviceCard: 0,
      serviceTransfer: 0,
      serviceReceipt: '',
      productStylist: sale.stylist.trim(),
      productClientName: sale.clientName.trim(),
      productName: productSummary,
      productCash: amounts.productCash,
      productCard: amounts.productCard,
      productTransfer: amounts.productTransfer,
      productReceipt: sale.receiptNumber.trim(),
      notes: sale.notes.trim(),
      sourceSheet: 'Venta inventario',
      sourceRow: 0,
      sourceId: appointmentReference.id,
      ...actor(),
      createdAt,
      updatedAt: createdAt,
    })

    if (clientVisitReference) {
      transaction.set(clientVisitReference, {
        clientId: sale.clientId,
        date: sale.date,
        service: 'Venta de producto',
        colorFormula: productSummary,
        stylist: sale.stylist.trim(),
        notes: [
          sale.receiptNumber ? `Boleta: ${sale.receiptNumber.trim()}` : '',
          sale.notes.trim(),
        ]
          .filter(Boolean)
          .join(' · '),
        amount: String(amounts.total),
        createdAt,
        updatedAt: createdAt,
      })
    }

    transaction.set(
      auditLogReference,
      auditData(
        'inventory',
        appointmentReference.id,
        `Venta ${sale.receiptNumber || appointmentReference.id}`,
        'stock',
        [
          productSummary,
          `Total venta: ${amounts.total}`,
          `Estilista: ${sale.stylist.trim()}`,
        ],
      ),
    )
  })
}

export const adjustInventory = async (
  product: Product,
  item: InventoryItem,
  type: InventoryMovementType,
  quantity: number,
  reason: string,
) => {
  if (!product.id) throw new Error('El producto no tiene identificador.')
  const productId = product.id
  const inventoryReference = doc(db, 'inventory', productId)
  const movementReference = doc(collection(db, 'inventoryMovements'))
  const logReference = auditReference()

  await runTransaction(db, async (transaction) => {
    const inventorySnapshot = await transaction.get(inventoryReference)
    const current = inventorySnapshot.exists()
      ? (inventorySnapshot.data() as InventoryItem)
      : item
    const delta =
      type === 'entry' || type === 'return'
        ? Math.abs(quantity)
        : type === 'sale'
          ? -Math.abs(quantity)
          : quantity
    const nextStock = current.stock + delta

    if (nextStock < 0) {
      throw new Error('El stock no puede quedar bajo cero.')
    }

    transaction.set(
      inventoryReference,
      {
        ...current,
        productId,
        stock: nextStock,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    transaction.set(movementReference, {
      productId,
      productName: product.title,
      type,
      quantity: delta,
      previousStock: current.stock,
      newStock: nextStock,
      reason,
      ...actor(),
      createdAt: serverTimestamp(),
    })
    transaction.set(
      logReference,
      auditData(
        'inventory',
        productId,
        product.title,
        'stock',
        [
          `Stock: ${current.stock} → ${nextStock}`,
          `Motivo: ${reason || 'Sin detalle'}`,
        ],
      ),
    )
  })
}

export const loginAdmin = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password)

export const logoutAdmin = () => signOut(auth)

export const observeAdmin = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback)

const getSessionId = () => {
  const storageKey = 'sr-analytics-session'
  const current = sessionStorage.getItem(storageKey)
  if (current) return current
  const next = crypto.randomUUID()
  sessionStorage.setItem(storageKey, next)
  return next
}

export const trackSiteEvent = (
  name: SiteEventName,
  details: {
    section?: string
    itemId?: string
    itemName?: string
  } = {},
) => {
  if (typeof window === 'undefined' || window.location.hash === '#admin') return

  void analyticsPromise.then((analytics) => {
    if (!analytics) return
    if (name === 'page_view') {
      logEvent(analytics, 'page_view', {
        page_path: window.location.pathname,
        page_location: window.location.href,
      })
    } else {
      logEvent(analytics, name, {
        content_type: details.section,
        item_id: details.itemId,
        item_name: details.itemName,
      })
    }
  })

  void addDoc(collection(db, 'analyticsEvents'), {
    name,
    sessionId: getSessionId(),
    path: window.location.pathname,
    ...details,
    createdAt: serverTimestamp(),
  }).catch(() => {
    // The external analytics report remains active if the local summary is unavailable.
  })
}
