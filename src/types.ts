export type Product = {
  id?: string
  brand: string
  title: string
  price: string
  image: string
  category: string
  description: string
  benefits: string[]
  size: string
  order: number
  active: boolean
}

export type ServiceItem = {
  id?: string
  categoryId: string
  name: string
  price: string
  order: number
  active: boolean
}

export type ServiceCategory = {
  id?: string
  kicker: string
  title: string
  note: string
  accent: string
  disclaimer: string
  order: number
  active: boolean
  items: ServiceItem[]
}

export type ServiceSettings = {
  servicesInitialized: boolean
}

export type Client = {
  id?: string
  legacyId?: string
  firstName: string
  paternalSurname: string
  maternalSurname: string
  phone: string
  birthday: string
  commune: string
  email: string
  instagram: string
  vip: boolean
  notes: string
  active: boolean
  searchText: string
}

export type InventorySupplier = {
  id?: string
  name: string
  rut: string
  contactName: string
  phone: string
  email: string
  address: string
  notes: string
  active: boolean
  searchText: string
  createdAt?: { toDate?: () => Date }
}

export type StylistPaymentFrequency = 'weekly' | 'monthly'

export type Stylist = {
  id?: string
  name: string
  role: string
  phone: string
  email: string
  paymentFrequency: StylistPaymentFrequency
  active: boolean
  notes: string
  searchText: string
  createdAt?: { toDate?: () => Date }
}

export type ClientVisit = {
  id?: string
  clientId: string
  date: string
  service: string
  colorFormula: string
  stylist: string
  notes: string
  amount: string
}

export type BookingPaymentMethod =
  | 'none'
  | 'cash'
  | 'credit'
  | 'debit'
  | 'transfer'
  | 'check'

export type BookingPaymentStatus = 'pending' | 'deposit' | 'paid'

export type BookingAttendanceStatus =
  | 'no_deposit'
  | 'deposited'
  | 'not_performed'
  | 'performed'

export type BookingServiceLine = {
  serviceId: string
  serviceName: string
  categoryId: string
  price: number
}

export type Booking = {
  id?: string
  clientId: string
  clientName: string
  stylistId: string
  stylistName: string
  date: string
  time: string
  services: BookingServiceLine[]
  totalAmount: number
  depositAmount: number
  depositPaymentMethod: BookingPaymentMethod
  paymentStatus: BookingPaymentStatus
  attendanceStatus: BookingAttendanceStatus
  finalPaymentMethod: BookingPaymentMethod
  notes: string
  active: boolean
  sourceAppointmentId?: string
  sourceVisitId?: string
  cancelledAt?: { toDate?: () => Date }
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export type AppointmentRecord = {
  id?: string
  date: string
  depositDate: string
  depositAmount: number
  survey: string
  stylist: string
  clientName: string
  service: string
  serviceCash: number
  serviceCard: number
  serviceTransfer: number
  serviceReceipt: string
  productStylist: string
  productClientName: string
  productName: string
  productCash: number
  productCard: number
  productTransfer: number
  productReceipt: string
  notes: string
  sourceSheet: string
  sourceRow: number
  sourceId: string
}

export type InventoryItem = {
  id: string
  productId: string
  sku: string
  stock: number
  minimumStock: number
  costPrice: number
  supplier: string
  location: string
}

export type InventoryMovementType =
  | 'entry'
  | 'sale'
  | 'adjustment'
  | 'return'

export type InventoryMovement = {
  id: string
  productId: string
  productName: string
  type: InventoryMovementType
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  actorEmail: string
  createdAt?: { toDate?: () => Date }
}

export type InventoryInvoice = {
  id: string
  invoiceNumber: string
  supplier: string
  invoiceDate: string
  paymentMethod: string
  image: string
  notes: string
  netTotal: number
  taxTotal: number
  grossTotal: number
  lineCount: number
  createdAt?: { toDate?: () => Date }
}

export type InventoryInvoiceLine = {
  id: string
  invoiceId: string
  invoiceNumber: string
  invoiceDate: string
  supplier: string
  productId: string
  productName: string
  sku: string
  quantity: number
  remainingQuantity: number
  netUnitValue: number
  discountTotal: number
  grossUnitValue: number
  grossTotalValue: number
  createdAt?: { toDate?: () => Date }
}

export type ProductSaleLine = {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  discountTotal: number
}

export type ProductSale = {
  date: string
  clientId: string
  clientName: string
  stylist: string
  paymentMethod: 'cash' | 'credit' | 'debit' | 'transfer' | 'check'
  receiptNumber: string
  notes: string
  lines: ProductSaleLine[]
}

export type AuditEntity =
  | 'appointment'
  | 'booking'
  | 'client'
  | 'visit'
  | 'product'
  | 'service'
  | 'news'
  | 'inventory'

export type AuditAction = 'create' | 'update' | 'delete' | 'stock'

export type AuditLog = {
  id: string
  entityType: AuditEntity
  entityId: string
  entityName: string
  action: AuditAction
  changes: string[]
  actorUid: string
  actorEmail: string
  createdAt?: { toDate?: () => Date }
}

export type NewsItem = {
  id?: string
  category: string
  date: string
  title: string
  description: string
  link: string
  image: string
  order: number
  active: boolean
}

export type SiteEventName =
  | 'page_view'
  | 'section_view'
  | 'product_view'
  | 'product_whatsapp'
  | 'booking_open'
  | 'news_open'

export type SiteEvent = {
  id: string
  name: SiteEventName
  sessionId: string
  path: string
  section?: string
  itemId?: string
  itemName?: string
  createdAt?: { toDate?: () => Date }
}
