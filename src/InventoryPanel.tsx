import { useMemo, useState, type FormEvent } from 'react'
import {
  Archive,
  ContactRound,
  Files,
  LayoutGrid,
  PackagePlus,
  Pencil,
  ReceiptText,
  Search,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import {
  adjustInventory,
  removeInventorySupplier,
  registerProductSale,
  saveInventoryDetails,
  saveInventoryInvoice,
  saveInventorySupplier,
} from './firebase'
import { uploadContentImage } from './cloudinary'
import ContentImage from './ContentImage'
import ClientPickerModal from './ClientPickerModal'
import type {
  AppointmentRecord,
  Client,
  ClientVisit,
  InventoryInvoice,
  InventoryInvoiceLine,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  InventorySupplier,
  Product,
  ProductSale,
  Stylist,
} from './types'
import { AdminButton } from './admin-ui'
import { useAdminConfirm } from './admin-confirm'

const IVA_RATE = 0.19

const movementLabels: Record<InventoryMovementType, string> = {
  entry: 'Entrada',
  sale: 'Salida / venta',
  adjustment: 'Ajuste',
  return: 'Devolución',
}

const paymentLabels: Record<ProductSale['paymentMethod'], string> = {
  cash: 'Efectivo',
  credit: 'Crédito',
  debit: 'Débito',
  transfer: 'Transferencia',
  check: 'Cheque',
}

const invoicePaymentOptions = [
  'Efectivo',
  'Crédito',
  'Débito',
  'Transferencia',
  'Cheque',
]

const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value || 0)

const parseMoney = (value: string) => {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

const dateLabel = (value: string) => {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T12:00:00`))
}

const imageHref = (source: string) => {
  if (/^(https?:|data:|blob:)/i.test(source)) return source
  return `https://res.cloudinary.com/dbyjbsq43/image/upload/${source}`
}

const normalizeName = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('es')

const defaultInventory = (productId: string): InventoryItem => ({
  id: productId,
  productId,
  sku: '',
  stock: 0,
  minimumStock: 2,
  costPrice: 0,
  supplier: '',
  location: '',
})

type InvoiceDraftLine = {
  productId: string
  productName: string
  sku: string
  quantity: number
  netUnitValue: number
  discountTotal: number
}

type InvoiceDraft = {
  invoiceNumber: string
  supplier: string
  invoiceDate: string
  paymentMethod: string
  image: string
  notes: string
  lines: InvoiceDraftLine[]
}

type InventoryScreen = 'list' | 'movement' | 'details' | 'invoice' | 'sale'
type InventoryView = 'general' | 'invoices' | 'suppliers'

type InventoryPanelProps = {
  products: Product[]
  inventory: InventoryItem[]
  invoices: InventoryInvoice[]
  invoiceLines: InventoryInvoiceLine[]
  movements: InventoryMovement[]
  appointments: AppointmentRecord[]
  clients: Client[]
  allVisits: ClientVisit[]
  suppliers: InventorySupplier[]
  stylists: Stylist[]
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const emptySupplier = (): InventorySupplier => ({
  name: '',
  rut: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  active: true,
  searchText: '',
})

const emptyInvoiceLine = (): InvoiceDraftLine => ({
  productId: '',
  productName: '',
  sku: '',
  quantity: 1,
  netUnitValue: 0,
  discountTotal: 0,
})

const emptyInvoice = (): InvoiceDraft => ({
  invoiceNumber: '',
  supplier: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  paymentMethod: '',
  image: '',
  notes: '',
  lines: [emptyInvoiceLine()],
})

const emptySaleLine = (): ProductSale['lines'][number] => ({
  productId: '',
  productName: '',
  sku: '',
  quantity: 1,
  unitPrice: 0,
  discountTotal: 0,
})

const emptySale = (): ProductSale => ({
  date: new Date().toISOString().slice(0, 10),
  clientId: '',
  clientName: '',
  stylist: '',
  paymentMethod: 'cash',
  receiptNumber: '',
  notes: '',
  lines: [emptySaleLine()],
})

const invoiceLineValues = (line: {
  quantity: number
  netUnitValue: number
  discountTotal: number
}) => {
  const quantity = Math.max(line.quantity, 0)
  const netTotal = Math.max(line.netUnitValue * quantity - line.discountTotal, 0)
  const grossTotal = Math.round(netTotal * (1 + IVA_RATE))
  return {
    netTotal,
    grossUnit: quantity ? Math.round(grossTotal / quantity) : 0,
    grossTotal,
  }
}

const saleLineTotal = (line: ProductSale['lines'][number]) =>
  Math.max(line.unitPrice * line.quantity - line.discountTotal, 0)

export default function InventoryPanel({
  products,
  inventory,
  invoices,
  invoiceLines,
  movements,
  appointments,
  clients,
  allVisits,
  suppliers,
  stylists,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: InventoryPanelProps) {
  const [view, setView] = useState<InventoryView>('general')
  const [screen, setScreen] = useState<InventoryScreen>('list')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'low' | 'out'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movementType, setMovementType] =
    useState<InventoryMovementType>('entry')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [inventoryDraft, setInventoryDraft] = useState<InventoryItem | null>(null)
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>(emptyInvoice)
  const [saleDraft, setSaleDraft] = useState<ProductSale>(emptySale)
  const [supplierDraft, setSupplierDraft] = useState<InventorySupplier | null>(null)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const { confirm, confirmDialog } = useAdminConfirm()

  const inventoryMap = useMemo(
    () => new Map(inventory.map((item) => [item.productId, item])),
    [inventory],
  )

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id || '', product])),
    [products],
  )

  const stylistOptions = useMemo(() => {
    const names = new Map<string, string>()
    stylists
      .filter((stylist) => stylist.active)
      .forEach((stylist) => {
        const key = normalizeName(stylist.name)
        if (key && !names.has(key)) names.set(key, stylist.name.trim())
      })
    appointments.forEach((appointment) => {
      ;[appointment.stylist, appointment.productStylist].forEach((name) => {
        const key = normalizeName(name)
        if (key && !names.has(key)) names.set(key, name.trim())
      })
    })
    return [...names.values()].sort((first, second) =>
      first.localeCompare(second, 'es'),
    )
  }, [appointments, stylists])

  const activeSuppliers = useMemo(
    () =>
      suppliers
        .filter((supplier) => supplier.active)
        .sort((first, second) => first.name.localeCompare(second.name, 'es')),
    [suppliers],
  )

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())
    return suppliers
      .filter(
        (supplier) =>
          !normalizedQuery || supplier.searchText.includes(normalizedQuery),
      )
      .sort((first, second) => first.name.localeCompare(second.name, 'es'))
  }, [query, suppliers])

  const rows = useMemo(
    () =>
      products
        .map((product) => ({
          product,
          item:
            inventoryMap.get(product.id || '') ||
            defaultInventory(product.id || ''),
        }))
        .filter(({ product, item }) => {
          const matchesQuery = `${product.title} ${product.brand} ${item.sku}`
            .toLocaleLowerCase('es')
            .includes(query.trim().toLocaleLowerCase('es'))
          const matchesStatus =
            status === 'all' ||
            (status === 'out' && item.stock === 0) ||
            (status === 'low' &&
              item.stock > 0 &&
              item.stock <= item.minimumStock)
          return matchesQuery && matchesStatus
        }),
    [inventoryMap, products, query, status],
  )

  const invoiceLinesByInvoice = useMemo(() => {
    const groups = new Map<string, InventoryInvoiceLine[]>()
    invoiceLines.forEach((line) => {
      const lines = groups.get(line.invoiceId) || []
      lines.push(line)
      groups.set(line.invoiceId, lines)
    })
    return groups
  }, [invoiceLines])

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return invoices.filter((invoice) => {
      const lines = invoiceLinesByInvoice.get(invoice.id) || []
      const haystack = [
        invoice.invoiceNumber,
        invoice.supplier,
        ...lines.flatMap((line) => [line.sku, line.productName]),
      ]
        .join(' ')
        .toLocaleLowerCase('es')
      return !normalizedQuery || haystack.includes(normalizedQuery)
    })
  }, [invoiceLinesByInvoice, invoices, query])

  const lowStockCount = products.filter((product) => {
    const item = inventoryMap.get(product.id || '')
    return item && item.stock <= item.minimumStock
  }).length

  const closeEditor = () => {
    setScreen('list')
    setSelectedProduct(null)
    setInventoryDraft(null)
    setInvoiceDraft(emptyInvoice())
    setSaleDraft(emptySale())
    setSupplierDraft(null)
    setClientPickerOpen(false)
    setQuantity(1)
    setReason('')
    setError('')
  }

  const updateInvoiceLine = (
    index: number,
    nextLine: Partial<InvoiceDraftLine>,
  ) => {
    setInvoiceDraft((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...nextLine } : line,
      ),
    }))
  }

  const updateSaleLine = (
    index: number,
    nextLine: Partial<ProductSale['lines'][number]>,
  ) => {
    setSaleDraft((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...nextLine } : line,
      ),
    }))
  }

  const handleInvoiceProduct = (index: number, productId: string) => {
    const product = productMap.get(productId)
    const item = inventoryMap.get(productId)
    updateInvoiceLine(index, {
      productId,
      productName: product?.title || '',
      sku: item?.sku || '',
    })
  }

  const handleSaleProduct = (index: number, productId: string) => {
    const product = productMap.get(productId)
    const item = inventoryMap.get(productId)
    updateSaleLine(index, {
      productId,
      productName: product?.title || '',
      sku: item?.sku || '',
      unitPrice: product ? parseMoney(product.price) : 0,
    })
  }

  const handleInvoiceImage = async (file?: File) => {
    if (!file) return
    setError('')
    setIsUploading(true)
    try {
      const image = await uploadContentImage(file)
      setInvoiceDraft((current) => ({ ...current, image }))
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'No fue posible subir la imagen.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleSupplierSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supplierDraft) return
    setError('')
    setIsSaving(true)
    try {
      const searchText = normalizeText(
        [
          supplierDraft.name,
          supplierDraft.rut,
          supplierDraft.contactName,
          supplierDraft.phone,
          supplierDraft.email,
        ].join(' '),
      )
      await saveInventorySupplier({ ...supplierDraft, searchText })
      setSupplierDraft(null)
    } catch {
      setError('No fue posible guardar el proveedor.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMovement = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProduct?.id) return
    const item =
      inventoryMap.get(selectedProduct.id) ||
      defaultInventory(selectedProduct.id)
    setError('')
    setIsSaving(true)
    try {
      await adjustInventory(
        selectedProduct,
        item,
        movementType,
        quantity,
        reason,
      )
      closeEditor()
    } catch (movementError) {
      setError(
        movementError instanceof Error
          ? movementError.message
          : 'No fue posible actualizar el stock.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleInventoryDetails = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProduct || !inventoryDraft) return
    setError('')
    setIsSaving(true)
    try {
      await saveInventoryDetails(selectedProduct, inventoryDraft)
      closeEditor()
    } catch {
      setError('No fue posible guardar los datos de inventario.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInvoiceSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveInventoryInvoice(invoiceDraft)
      closeEditor()
      setView('invoices')
    } catch (invoiceError) {
      setError(
        invoiceError instanceof Error
          ? invoiceError.message
          : 'No fue posible guardar la factura.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!saleDraft.clientId || !saleDraft.clientName.trim()) {
      setError('Selecciona una clienta desde la ficha para registrar la venta.')
      return
    }
    setIsSaving(true)
    try {
      await registerProductSale(saleDraft, invoiceLines)
      closeEditor()
    } catch (saleError) {
      setError(
        saleError instanceof Error
          ? saleError.message
          : 'No fue posible registrar la venta.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (supplierDraft) {
    return (
      <form className="admin-editor" onSubmit={handleSupplierSubmit}>
        <div className="admin-editor-head">
          <div>
            <p>{supplierDraft.id ? 'Editar proveedor' : 'Nuevo proveedor'}</p>
            <h2>{supplierDraft.name || 'Proveedor de inventario'}</h2>
          </div>
          <button
            className="admin-text-button"
            type="button"
            onClick={() => {
              setSupplierDraft(null)
              setError('')
            }}
          >
            Cerrar
          </button>
        </div>
        <div className="admin-form-grid">
          <label>
            Nombre proveedor
            <input
              value={supplierDraft.name}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, name: event.target.value })
              }
              maxLength={200}
              required
            />
          </label>
          <label>
            RUT
            <input
              value={supplierDraft.rut}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, rut: event.target.value })
              }
              maxLength={40}
            />
          </label>
          <label>
            Contacto
            <input
              value={supplierDraft.contactName}
              onChange={(event) =>
                setSupplierDraft({
                  ...supplierDraft,
                  contactName: event.target.value,
                })
              }
              maxLength={120}
            />
          </label>
          <label>
            Teléfono
            <input
              value={supplierDraft.phone}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, phone: event.target.value })
              }
              maxLength={40}
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={supplierDraft.email}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, email: event.target.value })
              }
              maxLength={160}
            />
          </label>
          <label>
            Dirección
            <input
              value={supplierDraft.address}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, address: event.target.value })
              }
              maxLength={200}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={supplierDraft.active}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, active: event.target.checked })
              }
            />
            Proveedor activo
          </label>
          <label className="is-wide">
            Notas
            <textarea
              value={supplierDraft.notes}
              onChange={(event) =>
                setSupplierDraft({ ...supplierDraft, notes: event.target.value })
              }
              maxLength={1000}
            />
          </label>
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <button
            className="admin-secondary-button"
            type="button"
            onClick={() => {
              setSupplierDraft(null)
              setError('')
            }}
          >
            Cancelar
          </button>
          <button className="admin-primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar proveedor'}
          </button>
        </div>
      </form>
    )
  }

  if (screen === 'details' && selectedProduct && inventoryDraft) {
    return (
      <form className="admin-editor" onSubmit={handleInventoryDetails}>
        <div className="admin-editor-head">
          <div>
            <p>Configuración de inventario</p>
            <h2>{selectedProduct.title}</h2>
          </div>
          <button className="admin-text-button" type="button" onClick={closeEditor}>
            Cerrar
          </button>
        </div>
        <div className="admin-form-grid">
          <label>
            SKU / código interno
            <input
              value={inventoryDraft.sku}
              onChange={(event) =>
                setInventoryDraft({ ...inventoryDraft, sku: event.target.value })
              }
            />
          </label>
          <label>
            Stock mínimo
            <input
              type="number"
              min="0"
              value={inventoryDraft.minimumStock}
              onChange={(event) =>
                setInventoryDraft({
                  ...inventoryDraft,
                  minimumStock: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            Costo unitario
            <input
              type="number"
              min="0"
              value={inventoryDraft.costPrice}
              onChange={(event) =>
                setInventoryDraft({
                  ...inventoryDraft,
                  costPrice: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            Proveedor
            <input
              value={inventoryDraft.supplier}
              onChange={(event) =>
                setInventoryDraft({
                  ...inventoryDraft,
                  supplier: event.target.value,
                })
              }
            />
          </label>
          <label className="is-wide">
            Ubicación física
            <input
              value={inventoryDraft.location}
              onChange={(event) =>
                setInventoryDraft({
                  ...inventoryDraft,
                  location: event.target.value,
                })
              }
              placeholder="Ej. Vitrina principal, repisa 2"
            />
          </label>
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <button className="admin-secondary-button" type="button" onClick={closeEditor}>
            Cancelar
          </button>
          <button className="admin-primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar inventario'}
          </button>
        </div>
      </form>
    )
  }

  if (screen === 'movement' && selectedProduct) {
    const item =
      inventoryMap.get(selectedProduct.id || '') ||
      defaultInventory(selectedProduct.id || '')
    return (
      <form className="admin-editor stock-movement-form" onSubmit={handleMovement}>
        <div className="admin-editor-head">
          <div>
            <p>Movimiento de stock</p>
            <h2>{selectedProduct.title}</h2>
          </div>
          <button className="admin-text-button" type="button" onClick={closeEditor}>
            Cerrar
          </button>
        </div>
        <div className="stock-current">
          <span>Stock actual</span>
          <strong>{item.stock}</strong>
        </div>
        <div className="admin-form-grid">
          <label>
            Tipo de movimiento
            <select
              value={movementType}
              onChange={(event) =>
                setMovementType(event.target.value as InventoryMovementType)
              }
            >
              {Object.entries(movementLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input
              type="number"
              value={quantity}
              min={movementType === 'adjustment' ? undefined : 1}
              onChange={(event) => setQuantity(Number(event.target.value))}
              required
            />
          </label>
          <label className="is-wide">
            Motivo
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Compra a proveedor, venta, corrección de conteo..."
              required
            />
          </label>
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <button className="admin-secondary-button" type="button" onClick={closeEditor}>
            Cancelar
          </button>
          <button className="admin-primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    )
  }

  if (screen === 'invoice') {
    const invoiceTotals = invoiceDraft.lines.reduce(
      (totals, line) => {
        const values = invoiceLineValues(line)
        totals.net += values.netTotal
        totals.gross += values.grossTotal
        return totals
      },
      { net: 0, gross: 0 },
    )

    return (
      <form className="admin-editor inventory-invoice-form" onSubmit={handleInvoiceSubmit}>
        <div className="admin-editor-head">
          <div>
            <p>Nueva factura</p>
            <h2>Ingreso de productos por factura</h2>
          </div>
          <button className="admin-text-button" type="button" onClick={closeEditor}>
            Cerrar
          </button>
        </div>

        <div className="admin-form-grid">
          <label>
            Nro. de factura
            <input
              value={invoiceDraft.invoiceNumber}
              onChange={(event) =>
                setInvoiceDraft({ ...invoiceDraft, invoiceNumber: event.target.value })
              }
              required
              maxLength={80}
            />
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={invoiceDraft.invoiceDate}
              onChange={(event) =>
                setInvoiceDraft({ ...invoiceDraft, invoiceDate: event.target.value })
              }
              required
            />
          </label>
          <label>
            Proveedor
            <select
              value={invoiceDraft.supplier}
              onChange={(event) =>
                setInvoiceDraft({ ...invoiceDraft, supplier: event.target.value })
              }
              required
            >
              <option value="">Seleccionar proveedor</option>
              {activeSuppliers.map((supplier) => (
                <option value={supplier.name} key={supplier.id || supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Forma de pago factura
            <select
              value={invoiceDraft.paymentMethod}
              onChange={(event) =>
                setInvoiceDraft({ ...invoiceDraft, paymentMethod: event.target.value })
              }
              required
            >
              <option value="">Seleccionar forma de pago</option>
              {invoicePaymentOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="admin-file-field is-wide">
            Foto o captura de factura
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void handleInvoiceImage(event.target.files?.[0])}
            />
            <span>
              {isUploading
                ? 'Subiendo imagen...'
                : invoiceDraft.image
                  ? 'Imagen cargada.'
                  : 'JPG, PNG o WebP, máximo 1 MB'}
            </span>
          </label>
          <label className="is-wide">
            Notas
            <textarea
              value={invoiceDraft.notes}
              onChange={(event) =>
                setInvoiceDraft({ ...invoiceDraft, notes: event.target.value })
              }
              maxLength={1000}
            />
          </label>
        </div>

        <div className="invoice-lines-editor">
          <div className="invoice-lines-heading">
            <strong>Productos de la factura</strong>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() =>
                setInvoiceDraft((current) => ({
                  ...current,
                  lines: [...current.lines, emptyInvoiceLine()],
                }))
              }
            >
              Agregar línea
            </button>
          </div>
          {invoiceDraft.lines.map((line, index) => {
            const values = invoiceLineValues(line)
            return (
              <article className="invoice-line-row" key={index}>
                <label>
                  Catálogo
                  <select
                    value={line.productId}
                    onChange={(event) =>
                      handleInvoiceProduct(index, event.target.value)
                    }
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option value={product.id} key={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  SKU
                  <input
                    value={line.sku}
                    onChange={(event) =>
                      updateInvoiceLine(index, { sku: event.target.value })
                    }
                    maxLength={100}
                  />
                </label>
                <label>
                  Producto en factura
                  <input
                    value={line.productName}
                    onChange={(event) =>
                      updateInvoiceLine(index, { productName: event.target.value })
                    }
                    required
                    maxLength={180}
                  />
                </label>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateInvoiceLine(index, {
                        quantity: Number(event.target.value),
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Valor neto unitario
                  <input
                    type="number"
                    min="0"
                    value={line.netUnitValue}
                    onChange={(event) =>
                      updateInvoiceLine(index, {
                        netUnitValue: Number(event.target.value),
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Dscto total
                  <input
                    type="number"
                    min="0"
                    value={line.discountTotal}
                    onChange={(event) =>
                      updateInvoiceLine(index, {
                        discountTotal: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <div className="invoice-line-computed invoice-line-tax-summary">
                  <span>Neto unit. {money(line.netUnitValue)}</span>
                  <span>Total neto {money(values.netTotal)}</span>
                  <span>Unit. c/IVA {money(values.grossUnit)}</span>
                  <strong>Total c/IVA {money(values.grossTotal)}</strong>
                </div>
                <button
                  className="admin-text-button"
                  type="button"
                  onClick={() =>
                    setInvoiceDraft((current) => ({
                      ...current,
                      lines:
                        current.lines.length === 1
                          ? [emptyInvoiceLine()]
                          : current.lines.filter((_, lineIndex) => lineIndex !== index),
                    }))
                  }
                >
                  Quitar
                </button>
              </article>
            )
          })}
        </div>

        <div className="invoice-total-box">
          <span>Neto {money(invoiceTotals.net)}</span>
          <span>IVA 19% {money(invoiceTotals.gross - invoiceTotals.net)}</span>
          <strong>Total con IVA {money(invoiceTotals.gross)}</strong>
        </div>

        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <button className="admin-secondary-button" type="button" onClick={closeEditor}>
            Cancelar
          </button>
          <button
            className="admin-primary-button"
            type="submit"
            disabled={isSaving || isUploading}
          >
            {isSaving ? 'Guardando...' : 'Guardar factura'}
          </button>
        </div>
      </form>
    )
  }

  if (screen === 'sale') {
    const saleTotal = saleDraft.lines.reduce(
      (total, line) => total + saleLineTotal(line),
      0,
    )

    return (
      <form className="admin-editor inventory-sale-form" onSubmit={handleSaleSubmit}>
        <div className="admin-editor-head">
          <div>
            <p>Registrar venta</p>
            <h2>Salida de productos y caja</h2>
          </div>
          <button className="admin-text-button" type="button" onClick={closeEditor}>
            Cerrar
          </button>
        </div>

        <div className="admin-form-grid">
          <label>
            Fecha
            <input
              type="date"
              value={saleDraft.date}
              onChange={(event) =>
                setSaleDraft({ ...saleDraft, date: event.target.value })
              }
              required
            />
          </label>
          <label>
            Clienta
            <button
              className="inventory-client-picker-button"
              type="button"
              onClick={() => setClientPickerOpen(true)}
            >
              {saleDraft.clientName || 'Buscar clienta'}
            </button>
          </label>
          <label>
            Quién vendió
            <select
              value={saleDraft.stylist}
              onChange={(event) =>
                setSaleDraft({ ...saleDraft, stylist: event.target.value })
              }
              required
            >
              <option value="">Seleccionar estilista</option>
              {stylistOptions.map((name) => (
                <option value={name} key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Forma de pago
            <select
              value={saleDraft.paymentMethod}
              onChange={(event) =>
                setSaleDraft({
                  ...saleDraft,
                  paymentMethod: event.target.value as ProductSale['paymentMethod'],
                })
              }
            >
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Número de boleta
            <input
              value={saleDraft.receiptNumber}
              onChange={(event) =>
                setSaleDraft({ ...saleDraft, receiptNumber: event.target.value })
              }
              maxLength={80}
            />
          </label>
          <label className="is-wide">
            Notas
            <textarea
              value={saleDraft.notes}
              onChange={(event) =>
                setSaleDraft({ ...saleDraft, notes: event.target.value })
              }
              maxLength={1000}
            />
          </label>
        </div>

        {clientPickerOpen ? (
          <ClientPickerModal
            clients={clients}
            allVisits={allVisits}
            selectedClientId={saleDraft.clientId}
            selectedClientName={saleDraft.clientName}
            eyebrow="Clienta de la venta"
            title="Buscar clienta"
            onSelect={(client, name) =>
              setSaleDraft({
                ...saleDraft,
                clientId: client.id || '',
                clientName: name,
              })
            }
            onClear={() =>
              setSaleDraft({
                ...saleDraft,
                clientId: '',
                clientName: '',
              })
            }
            onClose={() => setClientPickerOpen(false)}
          />
        ) : null}

        <div className="sale-lines-editor">
          <div className="invoice-lines-heading">
            <strong>Productos vendidos</strong>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() =>
                setSaleDraft((current) => ({
                  ...current,
                  lines: [...current.lines, emptySaleLine()],
                }))
              }
            >
              Agregar producto
            </button>
          </div>
          {saleDraft.lines.map((line, index) => {
            const stock = inventoryMap.get(line.productId)?.stock || 0
            return (
              <article className="sale-line-row" key={index}>
                <label>
                  Producto
                  <select
                    value={line.productId}
                    onChange={(event) => handleSaleProduct(index, event.target.value)}
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option value={product.id} key={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sale-stock-pill">
                  <span>Stock</span>
                  <strong>{line.productId ? stock : '-'}</strong>
                </div>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    max={line.productId ? stock : undefined}
                    value={line.quantity}
                    onChange={(event) =>
                      updateSaleLine(index, { quantity: Number(event.target.value) })
                    }
                    required
                  />
                </label>
                <label>
                  Valor producto
                  <input
                    type="number"
                    min="0"
                    value={line.unitPrice}
                    onChange={(event) =>
                      updateSaleLine(index, { unitPrice: Number(event.target.value) })
                    }
                    required
                  />
                </label>
                <label>
                  Descuento línea
                  <input
                    type="number"
                    min="0"
                    value={line.discountTotal}
                    onChange={(event) =>
                      updateSaleLine(index, {
                        discountTotal: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <div className="invoice-line-computed">
                  <span>{line.sku || 'Sin SKU'}</span>
                  <strong>{money(saleLineTotal(line))}</strong>
                </div>
                <button
                  className="admin-text-button"
                  type="button"
                  onClick={() =>
                    setSaleDraft((current) => ({
                      ...current,
                      lines:
                        current.lines.length === 1
                          ? [emptySaleLine()]
                          : current.lines.filter((_, lineIndex) => lineIndex !== index),
                    }))
                  }
                >
                  Quitar
                </button>
              </article>
            )
          })}
        </div>

        <div className="invoice-total-box">
          <span>{paymentLabels[saleDraft.paymentMethod]}</span>
          <strong>Total venta {money(saleTotal)}</strong>
        </div>

        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-form-actions">
          <button className="admin-secondary-button" type="button" onClick={closeEditor}>
            Cancelar
          </button>
          <button className="admin-primary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Registrando...' : 'Registrar venta'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="inventory-view">
      {confirmDialog}
      <div className="inventory-summary">
        <article><span>Productos</span><strong>{products.length}</strong></article>
        <article className={lowStockCount ? 'has-warning' : ''}>
          <span>Stock bajo o agotado</span><strong>{lowStockCount}</strong>
        </article>
        <article>
          <span>Facturas ingresadas</span><strong>{invoices.length}</strong>
        </article>
        <article>
          <span>Proveedores activos</span><strong>{activeSuppliers.length}</strong>
        </article>
        <div className="inventory-main-actions">
          <AdminButton variant="primary" icon={PackagePlus} type="button" onClick={onAddProduct}>
            Agregar producto
          </AdminButton>
          <AdminButton
            icon={ReceiptText}
            type="button"
            onClick={() => setScreen('invoice')}
          >
            Añadir factura
          </AdminButton>
          <AdminButton
            icon={ShoppingCart}
            type="button"
            onClick={() => setScreen('sale')}
          >
            Registrar venta
          </AdminButton>
          <AdminButton
            icon={Truck}
            type="button"
            onClick={() => {
              setView('suppliers')
              setSupplierDraft(emptySupplier())
            }}
          >
            Agregar proveedor
          </AdminButton>
        </div>
      </div>

      <section className="admin-content-card">
        <div className="inventory-toolbar">
          <span className="admin-search-control">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                view === 'general'
                  ? 'Buscar producto o SKU'
                  : view === 'invoices'
                    ? 'Buscar factura, proveedor, SKU o producto'
                    : 'Buscar proveedor, RUT o contacto'
              }
            />
          </span>
          <div>
            {([
              ['general', 'Vista general', LayoutGrid],
              ['invoices', 'Por factura', Files],
              ['suppliers', 'Proveedores', ContactRound],
            ] as const).map(([value, label, ViewIcon]) => (
              <button
                className={view === value ? 'is-active' : ''}
                type="button"
                onClick={() => setView(value)}
                key={value}
              >
                <ViewIcon size={17} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {view === 'general' ? (
          <>
            <div className="inventory-status-filter">
              {(['all', 'low', 'out'] as const).map((filter) => (
                <button
                  className={status === filter ? 'is-active' : ''}
                  type="button"
                  onClick={() => setStatus(filter)}
                  key={filter}
                >
                  {filter === 'all'
                    ? 'Todos'
                    : filter === 'low'
                      ? 'Stock bajo'
                      : 'Agotados'}
                </button>
              ))}
            </div>
            <div className="inventory-list">
              {rows.map(({ product, item }) => {
                const stockStatus =
                  item.stock === 0
                    ? 'is-out'
                    : item.stock <= item.minimumStock
                      ? 'is-low'
                      : 'is-ok'
                return (
                  <article key={product.id}>
                    <ContentImage source={product.image} alt="" mode="preview" />
                    <div className="inventory-product-name">
                      <strong>{product.title}</strong>
                      <span>{product.brand} · {item.sku || 'Sin SKU'}</span>
                    </div>
                    <div className={`inventory-stock ${stockStatus}`}>
                      <strong>{item.stock}</strong>
                      <span>
                        {stockStatus === 'is-out'
                          ? 'Agotado'
                          : stockStatus === 'is-low'
                            ? 'Stock bajo'
                            : 'Disponible'}
                      </span>
                    </div>
                    <div className="inventory-row-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product)
                          setScreen('movement')
                        }}
                      >
                        Mover stock
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product)
                          setInventoryDraft(item)
                          setScreen('details')
                        }}
                      >
                        Configurar
                      </button>
                      <button type="button" onClick={() => onEditProduct(product)}>
                        Editar catálogo
                      </button>
                      <button type="button" onClick={() => onDeleteProduct(product)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                )
              })}
              {!rows.length ? (
                <p className="admin-empty-copy">No hay productos para este filtro.</p>
              ) : null}
            </div>
          </>
        ) : view === 'invoices' ? (
          <div className="invoice-list">
            {filteredInvoices.map((invoice) => {
              const lines = invoiceLinesByInvoice.get(invoice.id) || []
              return (
                <article className="invoice-card" key={invoice.id}>
                  <div className="invoice-card-head">
                    <div>
                      <span>Factura {invoice.invoiceNumber}</span>
                      <strong>{invoice.supplier || 'Proveedor sin nombre'}</strong>
                      <small>{dateLabel(invoice.invoiceDate)}</small>
                    </div>
                    <div>
                      <b>{money(invoice.grossTotal)}</b>
                      {invoice.image ? (
                        <a href={imageHref(invoice.image)} target="_blank" rel="noreferrer">
                          Ver foto
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="invoice-line-table">
                    {lines.map((line) => (
                      <div key={line.id}>
                        <span>{line.sku || 'Sin SKU'}</span>
                        <strong>{line.productName}</strong>
                        <small>
                          {line.remainingQuantity} de {line.quantity} disponibles
                        </small>
                        <span>Neto {money(line.netUnitValue)}</span>
                        <span>
                          Total neto{' '}
                          {money(
                            invoiceLineValues({
                              quantity: line.quantity,
                              netUnitValue: line.netUnitValue,
                              discountTotal: line.discountTotal,
                            }).netTotal,
                          )}
                        </span>
                        <span>Dscto {money(line.discountTotal)}</span>
                        <b>Unit. c/IVA {money(line.grossUnitValue)}</b>
                        <b>Total c/IVA {money(line.grossTotalValue)}</b>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
            {!filteredInvoices.length ? (
              <div className="admin-empty-state">
                <h3>Aún no hay facturas ingresadas</h3>
                <p>Agrega una factura para ver el inventario por compra.</p>
                <button type="button" onClick={() => setScreen('invoice')}>
                  Añadir factura
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="supplier-list">
            <div className="invoice-lines-heading">
              <strong>{filteredSuppliers.length} proveedores</strong>
              <button
                className="admin-primary-button"
                type="button"
                onClick={() => setSupplierDraft(emptySupplier())}
              >
                Nuevo proveedor
              </button>
            </div>
            {filteredSuppliers.map((supplier) => (
              <article className="supplier-card" key={supplier.id}>
                <div>
                  <span>{supplier.active ? 'Activo' : 'Archivado'}</span>
                  <strong>{supplier.name}</strong>
                  <small>{supplier.rut || 'Sin RUT'} · {supplier.contactName || 'Sin contacto'}</small>
                </div>
                <div>
                  <span>{supplier.phone || 'Sin teléfono'}</span>
                  <span>{supplier.email || 'Sin correo'}</span>
                </div>
                <p>{supplier.notes || supplier.address || 'Sin notas registradas.'}</p>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => setSupplierDraft(supplier)}>
                    <Pencil size={17} aria-hidden="true" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const accepted = await confirm({
                        title: `Archivar proveedor ${supplier.name}`,
                        description: 'El proveedor dejará de aparecer entre las opciones activas, pero sus facturas se conservarán.',
                        confirmLabel: 'Archivar proveedor',
                      })
                      if (accepted) void removeInventorySupplier(supplier)
                    }}
                  >
                    <Archive size={17} aria-hidden="true" /> Archivar
                  </button>
                </div>
              </article>
            ))}
            {!filteredSuppliers.length ? (
              <div className="admin-empty-state">
                <h3>Aún no hay proveedores</h3>
                <p>Agrega proveedores para seleccionarlos al crear facturas.</p>
                <button type="button" onClick={() => setSupplierDraft(emptySupplier())}>
                  Nuevo proveedor
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="admin-content-card inventory-movements">
        <div className="admin-card-heading">
          <div><p>Trazabilidad</p><h2>Últimos movimientos</h2></div>
        </div>
        {movements.slice(0, 12).map((movement) => (
          <div key={movement.id}>
            <span>{movementLabels[movement.type]}</span>
            <strong>{movement.productName}</strong>
            <b>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</b>
            <small>{movement.previousStock} {'->'} {movement.newStock}</small>
            <p>{movement.reason}</p>
          </div>
        ))}
        {!movements.length ? <p className="admin-empty-copy">Aún no hay movimientos.</p> : null}
      </section>
    </div>
  )
}
