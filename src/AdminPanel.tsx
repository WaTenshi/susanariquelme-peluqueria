import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FolderPlus,
  ImagePlus,
  LogOut,
  Menu,
  Newspaper,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Save,
  Scissors,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import {
  ensureInitialServicesSeeded,
  loginAdmin,
  logoutAdmin,
  observeAdmin,
  removeNewsItem,
  removeProduct,
  removeServiceCategory,
  removeServiceItem,
  saveNewsItem,
  saveProduct,
  saveServiceCategory,
  saveServiceItem,
  subscribeToAuditLogs,
  subscribeToAllClientVisits,
  subscribeToAnalytics,
  subscribeToAppointments,
  subscribeToBookings,
  subscribeToClients,
  subscribeToInventory,
  subscribeToInventoryInvoiceLines,
  subscribeToInventoryInvoices,
  subscribeToInventoryMovements,
  subscribeToInventorySuppliers,
  subscribeToNews,
  subscribeToProducts,
  subscribeToServiceCategories,
  subscribeToServiceItems,
  subscribeToStylists,
} from './firebase'
import type {
  AuditLog,
  AppointmentRecord,
  Booking,
  Client,
  ClientVisit,
  InventoryItem,
  InventoryInvoice,
  InventoryInvoiceLine,
  InventoryMovement,
  InventorySupplier,
  NewsItem,
  Product,
  ServiceCategory,
  ServiceItem,
  SiteEvent,
  Stylist,
} from './types'
import { uploadContentImage } from './cloudinary'
import ContentImage from './ContentImage'
import ClientsPanel from './ClientsPanel'
import InventoryPanel from './InventoryPanel'
import AuditPanel from './AuditPanel'
import AppointmentsPanel from './AppointmentsPanel'
import HoursPanel from './HoursPanel'
import { initialServiceCategories } from './servicesContent'
import {
  AdminButton,
  CatalogPriceInput,
  AdminField,
  CurrencyInput,
} from './admin-ui'
import {
  adminNavigation,
  getAdminNavigationItem,
  type AdminTab,
} from './admin-navigation'
import { useAdminConfirm } from './admin-confirm'
import { useAdminFormGuard } from './admin-form-guard'
import './AdminPanel.css'
import './AdminUI.css'

const emptyProduct = (order = 1): Product => ({
  brand: '',
  title: '',
  price: '',
  image: '',
  category: '',
  description: '',
  benefits: [],
  size: '',
  order,
  active: true,
})

const emptyNewsItem = (order = 1): NewsItem => ({
  category: 'Novedades',
  date: new Date().toISOString().slice(0, 10),
  title: '',
  description: '',
  link: '',
  image: '',
  order,
  active: true,
})

const emptyServiceCategory = (order = 1): ServiceCategory => ({
  kicker: '',
  title: '',
  note: '',
  accent: '',
  disclaimer: '',
  order,
  active: true,
  items: [],
})

const emptyServiceItem = (categoryId: string, order = 1): ServiceItem => ({
  categoryId,
  name: '',
  price: '',
  order,
  active: true,
})

const getFriendlyErrorMessage = (error: unknown) => {
  const uploadMessages = [
    'Usa una imagen',
    'La imagen debe pesar',
    'No fue posible subir',
    'La subida tardó',
  ]

  if (
    error instanceof Error &&
    uploadMessages.some((message) => error.message.startsWith(message))
  ) {
    return error.message
  }

  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : ''

  if (code.includes('invalid-credential')) return 'Correo o contraseña incorrectos.'
  if (code.includes('too-many-requests')) {
    return 'Acceso bloqueado temporalmente por demasiados intentos.'
  }
  if (code.includes('permission-denied')) {
    return 'Tu cuenta no tiene permisos para realizar esta operación.'
  }
  return 'No fue posible completar la operación. Intenta nuevamente.'
}

const formatEventDate = (event: SiteEvent) => {
  const date = event.createdAt?.toDate?.()
  return date
    ? new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Ahora'
}

const countBy = (events: SiteEvent[], field: 'section' | 'itemName') => {
  const counts = new Map<string, number>()
  events.forEach((event) => {
    const value = event[field]
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await loginAdmin(email, password)
    } catch (loginError) {
      setError(getFriendlyErrorMessage(loginError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="admin-login admin-theme">
      <a className="admin-back-link" href="#inicio">
        <ExternalLink size={19} aria-hidden="true" />
        Volver al sitio
      </a>
      <section className="admin-login-card">
        <div className="admin-monogram" aria-hidden="true">SR</div>
        <p>Acceso privado</p>
        <h1>Panel de administración</h1>
        <span>
          Ingresa con tu cuenta de administración. El acceso está reservado al
          equipo autorizado.
        </span>
        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              minLength={8}
              required
            />
          </label>
          {error ? <p className="admin-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}

type ProductFormProps = {
  product: Product
  onChange: (product: Product) => void
  onCancel: () => void
  onSaved: () => void
}

function ProductForm({ product, onChange, onCancel, onSaved }: ProductFormProps) {
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { requestClose, unsavedDialog } = useAdminFormGuard(product, onCancel)

  const update = <K extends keyof Product>(key: K, value: Product[K]) =>
    onChange({ ...product, [key]: value })

  const handleImage = async (file?: File) => {
    if (!file) return
    setError('')
    setIsUploading(true)
    try {
      update('image', await uploadContentImage(file))
    } catch (uploadError) {
      setError(getFriendlyErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveProduct(product)
      onSaved()
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      {unsavedDialog}
      <div className="admin-editor-head">
        <div>
          <p>{product.id ? 'Editar producto' : 'Nuevo producto'}</p>
          <h2>{product.id ? product.title : 'Agregar al catálogo'}</h2>
        </div>
        <AdminButton icon={X} variant="ghost" type="button" onClick={() => void requestClose()}>Cerrar</AdminButton>
      </div>
      <div className="admin-form-grid">
        <label className="is-wide">
          Nombre
          <input value={product.title} onChange={(e) => update('title', e.target.value)} required maxLength={180} />
        </label>
        <label>
          Marca
          <input value={product.brand} onChange={(e) => update('brand', e.target.value)} required maxLength={100} />
        </label>
        <label>
          Categoría
          <input value={product.category} onChange={(e) => update('category', e.target.value)} required maxLength={100} />
        </label>
        <AdminField
          label="Precio"
          icon={CircleDollarSign}
          hint="El signo $ y los separadores de miles se agregan automáticamente."
          required
        >
          <CurrencyInput
            value={product.price}
            onValueChange={(_value, formatted) => update('price', formatted)}
            placeholder="19.990"
            aria-label="Precio del producto en pesos chilenos"
            required
          />
        </AdminField>
        <label>
          Formato
          <input value={product.size} onChange={(e) => update('size', e.target.value)} placeholder="500 ml" required maxLength={80} />
        </label>
        <label>
          Orden
          <input type="number" min="0" value={product.order} onChange={(e) => update('order', Number(e.target.value))} required />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={product.active} onChange={(e) => update('active', e.target.checked)} />
          Visible en la web
        </label>
        <label className="is-wide">
          Descripción
          <textarea value={product.description} onChange={(e) => update('description', e.target.value)} required maxLength={2000} />
        </label>
        <label className="is-wide">
          Beneficios
          <input
            value={product.benefits.join(', ')}
            onChange={(e) =>
              update(
                'benefits',
                e.target.value.split(',').map((value) => value.trim()).filter(Boolean),
              )
            }
            placeholder="Brillo, suavidad, control de frizz"
          />
        </label>
        <label className="is-wide">
          URL de imagen
          <input value={product.image} onChange={(e) => update('image', e.target.value)} required />
        </label>
        <label className="admin-file-field is-wide">
          <span><ImagePlus size={18} aria-hidden="true" /> O subir una imagen</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void handleImage(e.target.files?.[0])} />
          <span>
            {isUploading
              ? 'Optimizando y subiendo imagen...'
              : 'JPG, PNG o WebP, máximo 1 MB'}
          </span>
        </label>
      </div>
      {product.image ? (
        <ContentImage
          className="admin-image-preview"
          source={product.image}
          alt=""
          mode="preview"
        />
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-form-actions">
        <AdminButton type="button" onClick={() => void requestClose()}>Cancelar</AdminButton>
        <AdminButton variant="primary" icon={Save} type="submit" isLoading={isSaving} disabled={isUploading}>Guardar producto</AdminButton>
      </div>
    </form>
  )
}

type NewsFormProps = {
  item: NewsItem
  onChange: (item: NewsItem) => void
  onCancel: () => void
  onSaved: () => void
}

function NewsForm({ item, onChange, onCancel, onSaved }: NewsFormProps) {
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { requestClose, unsavedDialog } = useAdminFormGuard(item, onCancel)
  const update = <K extends keyof NewsItem>(key: K, value: NewsItem[K]) =>
    onChange({ ...item, [key]: value })

  const handleImage = async (file?: File) => {
    if (!file) return
    setError('')
    setIsUploading(true)
    try {
      update('image', await uploadContentImage(file))
    } catch (uploadError) {
      setError(getFriendlyErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveNewsItem(item)
      onSaved()
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      {unsavedDialog}
      <div className="admin-editor-head">
        <div>
          <p>{item.id ? 'Editar novedad' : 'Nueva publicación'}</p>
          <h2>{item.id ? item.title : 'Publicar una novedad'}</h2>
        </div>
        <AdminButton icon={X} variant="ghost" type="button" onClick={() => void requestClose()}>Cerrar</AdminButton>
      </div>
      <div className="admin-form-grid">
        <label className="is-wide">
          Título
          <input value={item.title} onChange={(e) => update('title', e.target.value)} required maxLength={180} />
        </label>
        <label>
          Categoría
          <input value={item.category} onChange={(e) => update('category', e.target.value)} required maxLength={100} />
        </label>
        <label>
          Fecha
          <input type="date" value={item.date} onChange={(e) => update('date', e.target.value)} required />
        </label>
        <label>
          Orden
          <input type="number" min="0" value={item.order} onChange={(e) => update('order', Number(e.target.value))} required />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={item.active} onChange={(e) => update('active', e.target.checked)} />
          Visible en la web
        </label>
        <label className="is-wide">
          Descripción
          <textarea value={item.description} onChange={(e) => update('description', e.target.value)} required maxLength={3000} />
        </label>
        <label className="is-wide">
          Enlace opcional
          <input type="url" value={item.link} onChange={(e) => update('link', e.target.value)} placeholder="https://..." />
        </label>
        <label className="is-wide">
          URL de imagen
          <input value={item.image} onChange={(e) => update('image', e.target.value)} required />
        </label>
        <label className="admin-file-field is-wide">
          <span><ImagePlus size={18} aria-hidden="true" /> O subir una imagen</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void handleImage(e.target.files?.[0])} />
          <span>
            {isUploading
              ? 'Optimizando y subiendo imagen...'
              : 'JPG, PNG o WebP, máximo 1 MB'}
          </span>
        </label>
      </div>
      {item.image ? (
        <ContentImage
          className="admin-image-preview"
          source={item.image}
          alt=""
          mode="preview"
        />
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-form-actions">
        <AdminButton type="button" onClick={() => void requestClose()}>Cancelar</AdminButton>
        <AdminButton variant="primary" icon={Save} type="submit" isLoading={isSaving} disabled={isUploading}>Guardar novedad</AdminButton>
      </div>
    </form>
  )
}

type ServiceCategoryFormProps = {
  category: ServiceCategory
  onChange: (category: ServiceCategory) => void
  onCancel: () => void
  onSaved: () => void
}

function ServiceCategoryForm({
  category,
  onChange,
  onCancel,
  onSaved,
}: ServiceCategoryFormProps) {
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { requestClose, unsavedDialog } = useAdminFormGuard(category, onCancel)
  const update = <K extends keyof ServiceCategory>(
    key: K,
    value: ServiceCategory[K],
  ) => onChange({ ...category, [key]: value })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveServiceCategory(category)
      onSaved()
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      {unsavedDialog}
      <div className="admin-editor-head">
        <div>
          <p>{category.id ? 'Editar categoría' : 'Nueva categoría'}</p>
          <h2>{category.title || 'Categoría de servicios'}</h2>
        </div>
        <AdminButton icon={X} variant="ghost" type="button" onClick={() => void requestClose()}>Cerrar</AdminButton>
      </div>
      <div className="admin-form-grid">
        <label className="is-wide">
          Nombre de categoría
          <input value={category.title} onChange={(e) => update('title', e.target.value)} required maxLength={120} />
        </label>
        <label>
          Etiqueta
          <input value={category.kicker} onChange={(e) => update('kicker', e.target.value)} placeholder="Colorimetria" required maxLength={80} />
        </label>
        <label>
          Acento
          <input value={category.accent} onChange={(e) => update('accent', e.target.value)} placeholder="Personalizado" required maxLength={80} />
        </label>
        <label>
          Orden
          <input type="number" min="0" value={category.order} onChange={(e) => update('order', Number(e.target.value))} required />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={category.active} onChange={(e) => update('active', e.target.checked)} />
          Visible en la landing
        </label>
        <label className="is-wide">
          Nota
          <input value={category.note} onChange={(e) => update('note', e.target.value)} placeholder="Incluye lavado y brushing." maxLength={180} />
        </label>
        <label className="is-wide">
          Aviso opcional
          <textarea value={category.disclaimer} onChange={(e) => update('disclaimer', e.target.value)} maxLength={600} />
        </label>
      </div>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-form-actions">
        <AdminButton type="button" onClick={() => void requestClose()}>Cancelar</AdminButton>
        <AdminButton variant="primary" icon={Save} type="submit" isLoading={isSaving}>Guardar categoría</AdminButton>
      </div>
    </form>
  )
}

type ServiceItemFormProps = {
  item: ServiceItem
  categories: ServiceCategory[]
  onChange: (item: ServiceItem) => void
  onCancel: () => void
  onSaved: () => void
}

function ServiceItemForm({
  item,
  categories,
  onChange,
  onCancel,
  onSaved,
}: ServiceItemFormProps) {
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { requestClose, unsavedDialog } = useAdminFormGuard(item, onCancel)
  const update = <K extends keyof ServiceItem>(key: K, value: ServiceItem[K]) =>
    onChange({ ...item, [key]: value })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveServiceItem(item)
      onSaved()
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      {unsavedDialog}
      <div className="admin-editor-head">
        <div>
          <p>{item.id ? 'Editar servicio' : 'Nuevo servicio'}</p>
          <h2>{item.name || 'Servicio de la landing'}</h2>
        </div>
        <AdminButton icon={X} variant="ghost" type="button" onClick={() => void requestClose()}>Cerrar</AdminButton>
      </div>
      <div className="admin-form-grid">
        <label className="is-wide">
          Categoría
          <select value={item.categoryId} onChange={(e) => update('categoryId', e.target.value)} required>
            <option value="">Seleccionar categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.title}</option>
            ))}
          </select>
        </label>
        <label>
          Nombre
          <input value={item.name} onChange={(e) => update('name', e.target.value)} required maxLength={140} />
        </label>
        <AdminField
          label="Precio"
          icon={CircleDollarSign}
          hint="Elige un formato; el valor público se genera automáticamente."
          required
        >
          <CatalogPriceInput
            value={item.price}
            onChange={(value) => update('price', value)}
            required
          />
        </AdminField>
        <label>
          Orden
          <input type="number" min="0" value={item.order} onChange={(e) => update('order', Number(e.target.value))} required />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={item.active} onChange={(e) => update('active', e.target.checked)} />
          Visible en la landing
        </label>
      </div>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-form-actions">
        <AdminButton type="button" onClick={() => void requestClose()}>Cancelar</AdminButton>
        <AdminButton variant="primary" icon={Save} type="submit" isLoading={isSaving}>Guardar servicio</AdminButton>
      </div>
    </form>
  )
}

type ServicesPanelProps = {
  categories: ServiceCategory[]
  items: ServiceItem[]
  onNotice: (message: string) => void
}

function ServicesPanel({ categories, items, onNotice }: ServicesPanelProps) {
  const [categoryDraft, setCategoryDraft] = useState<ServiceCategory | null>(null)
  const [itemDraft, setItemDraft] = useState<ServiceItem | null>(null)
  const { confirm, confirmDialog } = useAdminConfirm()
  const sortedCategories = useMemo(
    () => [...categories].sort((first, second) => first.order - second.order),
    [categories],
  )
  const sortedItems = useMemo(
    () => [...items].sort((first, second) => first.order - second.order),
    [items],
  )

  if (categoryDraft) {
    return (
      <ServiceCategoryForm
        category={categoryDraft}
        onChange={setCategoryDraft}
        onCancel={() => setCategoryDraft(null)}
        onSaved={() => {
          setCategoryDraft(null)
          onNotice('Categoría de servicios guardada.')
        }}
      />
    )
  }

  if (itemDraft) {
    return (
      <ServiceItemForm
        item={itemDraft}
        categories={sortedCategories}
        onChange={setItemDraft}
        onCancel={() => setItemDraft(null)}
        onSaved={() => {
          setItemDraft(null)
          onNotice('Servicio guardado.')
        }}
      />
    )
  }

  return (
    <section className="admin-content-card services-admin-board">
      {confirmDialog}
      <div className="admin-card-heading">
        <div><p>Landing</p><h2>{categories.length} categorías de servicios</h2></div>
        <div className="services-admin-actions">
          <AdminButton
            icon={Plus}
            type="button"
            onClick={() => {
              const firstCategory = sortedCategories[0]
              setItemDraft(
                emptyServiceItem(
                  firstCategory?.id || '',
                  sortedItems.filter((item) => item.categoryId === firstCategory?.id)
                    .length + 1,
                ),
              )
            }}
            disabled={!sortedCategories.length}
          >
            Agregar servicio
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={FolderPlus}
            type="button"
            onClick={() => setCategoryDraft(emptyServiceCategory(categories.length + 1))}
          >
            Agregar categoría
          </AdminButton>
        </div>
      </div>
      {!sortedCategories.length ? (
        <div className="admin-empty-state">
          <h3>Aún no hay categorías editables</h3>
          <p>Agrega una categoría o vuelve a entrar al panel para cargar el listado inicial.</p>
          <button type="button" onClick={() => setCategoryDraft(emptyServiceCategory(1))}>
            Agregar categoría
          </button>
        </div>
      ) : (
        <div className="services-admin-list">
          {sortedCategories.map((category) => {
            const categoryItems = sortedItems.filter(
              (item) => item.categoryId === category.id,
            )
            return (
              <article className="services-admin-category" key={category.id}>
                <header>
                  <div>
                    <span>{String(category.order).padStart(2, '0')}</span>
                    <div>
                      <strong>{category.title}</strong>
                      <small>{category.kicker} · {category.accent}</small>
                    </div>
                  </div>
                  <small className={category.active ? 'is-published' : ''}>
                    {category.active ? 'Visible' : 'Oculta'}
                  </small>
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => setCategoryDraft(category)}><Pencil size={17} aria-hidden="true" /> Editar</button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemDraft(
                          emptyServiceItem(category.id || '', categoryItems.length + 1),
                        )
                      }
                    >
                      <Plus size={17} aria-hidden="true" /> Servicio
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const accepted = await confirm({
                          title: `Eliminar categoría ${category.title}`,
                          description: `También se eliminarán sus ${categoryItems.length} servicios asociados.`,
                          confirmLabel: 'Eliminar categoría',
                        })
                        if (accepted) {
                          void removeServiceCategory(category, sortedItems).then(() =>
                            onNotice('Categoría eliminada.'),
                          )
                        }
                      }}
                    >
                      <Trash2 size={17} aria-hidden="true" /> Eliminar
                    </button>
                  </div>
                </header>
                {category.note ? <p>{category.note}</p> : null}
                {category.disclaimer ? <p>{category.disclaimer}</p> : null}
                <div className="services-admin-items">
                  {categoryItems.length ? categoryItems.map((item) => (
                    <div key={item.id}>
                      <span>{String(item.order).padStart(2, '0')}</span>
                      <strong>{item.name}</strong>
                      <small>{item.price}</small>
                      <em className={item.active ? 'is-published' : ''}>
                        {item.active ? 'Visible' : 'Oculto'}
                      </em>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => setItemDraft(item)}><Pencil size={17} aria-hidden="true" /> Editar</button>
                        <button
                          type="button"
                          onClick={async () => {
                            const accepted = await confirm({
                              title: `Eliminar servicio ${item.name}`,
                              description: 'El servicio dejará de aparecer en el panel y en el catálogo público.',
                              confirmLabel: 'Eliminar servicio',
                            })
                            if (accepted) {
                              void removeServiceItem(item).then(() =>
                                onNotice('Servicio eliminado.'),
                              )
                            }
                          }}
                        >
                          <Trash2 size={17} aria-hidden="true" /> Eliminar
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className="admin-empty-copy">Esta categoría aún no tiene servicios.</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function AnalyticsView({ events }: { events: SiteEvent[] }) {
  const pageViews = events.filter((event) => event.name === 'page_view')
  const productViews = events.filter((event) => event.name === 'product_view')
  const productContacts = events.filter((event) => event.name === 'product_whatsapp')
  const sessions = new Set(events.map((event) => event.sessionId)).size
  const popularProducts = countBy(productViews, 'itemName').slice(0, 5)
  const popularSections = countBy(
    events.filter((event) => event.name === 'section_view'),
    'section',
  ).slice(0, 5)
  const maxProduct = popularProducts[0]?.[1] ?? 1
  const maxSection = popularSections[0]?.[1] ?? 1
  const conversion = productViews.length
    ? Math.round((productContacts.length / productViews.length) * 100)
    : 0
  const eventLabels: Record<SiteEvent['name'], string> = {
    page_view: 'Visita a la página',
    section_view: 'Sección visitada',
    product_view: 'Producto abierto',
    product_whatsapp: 'Consulta de producto',
    booking_open: 'Reserva iniciada',
    review_click: 'Reseña iniciada',
    news_open: 'Novedad abierta',
  }

  return (
    <div className="admin-analytics">
      <div className="admin-metrics">
        <article><span>Sesiones registradas</span><strong>{sessions}</strong><small>Hasta 1.000 eventos recientes</small></article>
        <article><span>Visitas de página</span><strong>{pageViews.length}</strong><small>Desde la activación del panel</small></article>
        <article><span>Productos abiertos</span><strong>{productViews.length}</strong><small>Interés directo en catálogo</small></article>
        <article><span>Conversión WhatsApp</span><strong>{conversion}%</strong><small>{productContacts.length} clics de compra</small></article>
      </div>
      <div className="admin-chart-grid">
        <section className="admin-chart-card">
          <div><p>Contenido</p><h2>Productos más vistos</h2></div>
          {popularProducts.length ? popularProducts.map(([name, count]) => (
            <div className="admin-bar-row" key={name}>
              <span>{name}</span><strong>{count}</strong>
              <i style={{ width: `${(count / maxProduct) * 100}%` }} />
            </div>
          )) : <p className="admin-empty-copy">Aún no hay aperturas de productos.</p>}
        </section>
        <section className="admin-chart-card">
          <div><p>Navegación</p><h2>Secciones de interés</h2></div>
          {popularSections.length ? popularSections.map(([name, count]) => (
            <div className="admin-bar-row" key={name}>
              <span>{name}</span><strong>{count}</strong>
              <i style={{ width: `${(count / maxSection) * 100}%` }} />
            </div>
          )) : <p className="admin-empty-copy">Las secciones aparecerán cuando reciban visitas.</p>}
        </section>
      </div>
      <section className="admin-events-card">
        <div className="admin-card-heading">
          <div><p>Actividad reciente</p><h2>Últimas interacciones</h2></div>
          <a href="https://analytics.google.com/" target="_blank" rel="noreferrer">
            Abrir informe avanzado
          </a>
        </div>
        <div className="admin-event-list">
          {events.slice(0, 12).map((event) => (
            <div key={event.id}>
              <span>{eventLabels[event.name]}</span>
              <strong>{event.itemName || event.section || event.path}</strong>
              <time>{formatEventDate(event)}</time>
            </div>
          ))}
          {!events.length ? <p className="admin-empty-copy">Aún no se han registrado eventos.</p> : null}
        </div>
      </section>
      <p className="admin-analytics-note">
        Este resumen reúne las interacciones más recientes del sitio. El informe
        avanzado incluye además adquisición, dispositivos, ubicación y retención.
      </p>
    </div>
  )
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [events, setEvents] = useState<SiteEvent[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [allClientVisits, setAllClientVisits] = useState<ClientVisit[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryInvoices, setInventoryInvoices] = useState<InventoryInvoice[]>([])
  const [inventoryInvoiceLines, setInventoryInvoiceLines] = useState<
    InventoryInvoiceLine[]
  >([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [productDraft, setProductDraft] = useState<Product | null>(null)
  const [newsDraft, setNewsDraft] = useState<NewsItem | null>(null)
  const [notice, setNotice] = useState('')
  const [dataError, setDataError] = useState('')
  const { confirm: confirmAdmin, confirmDialog: adminConfirmDialog } = useAdminConfirm()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileSidebarRef = useRef<HTMLElement>(null)
  const mobileMenuWasOpen = useRef(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = window.localStorage.getItem('sr-admin-sidebar-collapsed')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(max-width: 1199px)').matches
  })
  const currentNavigationItem = getAdminNavigationItem(activeTab)

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('sr-admin-sidebar-collapsed', String(next))
      return next
    })
  }

  useEffect(() => observeAdmin((nextUser) => {
    setUser(nextUser)
    setAuthReady(true)
  }), [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      mobileMenuWasOpen.current = true
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      window.setTimeout(() => {
        mobileSidebarRef.current
          ?.querySelector<HTMLElement>('nav button[aria-current="page"]')
          ?.focus()
      }, 0)
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }
    if (mobileMenuWasOpen.current) {
      mobileMenuWasOpen.current = false
      mobileMenuButtonRef.current?.focus()
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!user) return
    void ensureInitialServicesSeeded(initialServiceCategories).catch(() =>
      setDataError('No fue posible cargar los servicios iniciales. Intenta nuevamente.'),
    )
    const handleError = (error: Error) => setDataError(getFriendlyErrorMessage(error))
    const handleProducts = (nextProducts: Product[]) => {
      setProducts(nextProducts)
      setDataError('')
    }
    const handleNews = (nextNews: NewsItem[]) => {
      setNews(nextNews)
      setDataError('')
    }
    const handleServiceCategories = (nextCategories: ServiceCategory[]) => {
      setServiceCategories(nextCategories)
      setDataError('')
    }
    const handleServiceItems = (nextItems: ServiceItem[]) => {
      setServiceItems(nextItems)
      setDataError('')
    }
    const handleEvents = (nextEvents: SiteEvent[]) => {
      setEvents(nextEvents)
      setDataError('')
    }
    const handleClients = (nextClients: Client[]) => {
      setClients(nextClients)
      setDataError('')
    }
    const handleAppointments = (nextAppointments: AppointmentRecord[]) => {
      setAppointments(nextAppointments)
      setDataError('')
    }
    const handleBookings = (nextBookings: Booking[]) => {
      setBookings(nextBookings)
      setDataError('')
    }
    const handleInventory = (nextInventory: InventoryItem[]) => {
      setInventory(nextInventory)
      setDataError('')
    }
    const handleAllVisits = (nextVisits: ClientVisit[]) => {
      setAllClientVisits(nextVisits)
      setDataError('')
    }
    const handleMovements = (nextMovements: InventoryMovement[]) => {
      setMovements(nextMovements)
      setDataError('')
    }
    const handleInvoices = (nextInvoices: InventoryInvoice[]) => {
      setInventoryInvoices(nextInvoices)
      setDataError('')
    }
    const handleInvoiceLines = (nextLines: InventoryInvoiceLine[]) => {
      setInventoryInvoiceLines(nextLines)
      setDataError('')
    }
    const handleSuppliers = (nextSuppliers: InventorySupplier[]) => {
      setSuppliers(nextSuppliers)
      setDataError('')
    }
    const handleStylists = (nextStylists: Stylist[]) => {
      setStylists(nextStylists)
      setDataError('')
    }
    const handleAudit = (nextLogs: AuditLog[]) => {
      setAuditLogs(nextLogs)
      setDataError('')
    }
    const unsubProducts = subscribeToProducts(handleProducts, handleError)
    const unsubNews = subscribeToNews(handleNews, handleError)
    const unsubServiceCategories = subscribeToServiceCategories(
      handleServiceCategories,
      handleError,
    )
    const unsubServiceItems = subscribeToServiceItems(handleServiceItems, handleError)
    const unsubAnalytics = subscribeToAnalytics(handleEvents, handleError)
    const unsubAppointments = subscribeToAppointments(handleAppointments, handleError)
    const unsubBookings = subscribeToBookings(handleBookings, handleError)
    const unsubClients = subscribeToClients(handleClients, handleError)
    const unsubAllVisits = subscribeToAllClientVisits(handleAllVisits, handleError)
    const unsubInventory = subscribeToInventory(handleInventory, handleError)
    const unsubInvoices = subscribeToInventoryInvoices(handleInvoices, handleError)
    const unsubInvoiceLines = subscribeToInventoryInvoiceLines(
      handleInvoiceLines,
      handleError,
    )
    const unsubMovements = subscribeToInventoryMovements(handleMovements, handleError)
    const unsubSuppliers = subscribeToInventorySuppliers(handleSuppliers, handleError)
    const unsubStylists = subscribeToStylists(handleStylists, handleError)
    const unsubAudit = subscribeToAuditLogs(handleAudit, handleError)
    return () => {
      unsubProducts()
      unsubNews()
      unsubServiceCategories()
      unsubServiceItems()
      unsubAnalytics()
      unsubAppointments()
      unsubBookings()
      unsubClients()
      unsubAllVisits()
      unsubInventory()
      unsubInvoices()
      unsubInvoiceLines()
      unsubMovements()
      unsubSuppliers()
      unsubStylists()
      unsubAudit()
    }
  }, [user])

  const visibleAppointments = appointments

  const stats = useMemo(
    () => ({
      activeProducts: products.filter((product) => product.active).length,
      activeNews: news.filter((item) => item.active).length,
      activeServices: serviceItems.filter((item) => item.active).length,
      sessions: new Set(events.map((event) => event.sessionId)).size,
      clients: clients.length,
      appointmentsRevenue: visibleAppointments.reduce(
        (total, appointment) =>
          total +
          appointment.serviceCash +
          appointment.serviceCard +
          appointment.serviceTransfer +
          appointment.productCash +
          appointment.productCard +
          appointment.productTransfer,
        0,
      ),
      lowStock: inventory.filter((item) => item.stock <= item.minimumStock).length,
    }),
    [
      clients.length,
      events,
      inventory,
      news,
      products,
      serviceItems,
      visibleAppointments,
    ],
  )

  if (!authReady) return <div className="admin-loading admin-theme">Cargando acceso seguro...</div>
  if (!user) return <AdminLogin />

  return (
    <div
      className={`admin-shell admin-theme ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''} ${mobileMenuOpen ? 'is-mobile-menu-open' : ''}`}
    >
      <button
        className="admin-mobile-backdrop"
        type="button"
        aria-label="Cerrar menú"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside
        className="admin-sidebar"
        aria-label="Navegación del panel"
        id="admin-mobile-navigation"
        ref={mobileSidebarRef}
      >
        <div className="admin-sidebar-brand">
          <span>SR</span>
          <div><strong>Susana Riquelme</strong><small>Administración</small></div>
        </div>
        <button
          className="admin-sidebar-collapse"
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Desplegar menú lateral' : 'Plegar menú lateral'}
          title={sidebarCollapsed ? 'Desplegar menú' : 'Plegar menú'}
        >
          {sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          <span>{sidebarCollapsed ? 'Desplegar menú' : 'Plegar menú'}</span>
        </button>
        <nav aria-label="Módulos administrativos">
          {adminNavigation.map((item) => {
            const Icon = item.icon
            return (
            <button
              className={activeTab === item.id ? 'is-active' : ''}
              type="button"
              onClick={() => selectTab(item.id)}
              key={item.id}
              aria-current={activeTab === item.id ? 'page' : undefined}
              aria-label={item.label}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
            )
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="#inicio"><ExternalLink aria-hidden="true" /><span>Ver sitio público</span></a>
          <button type="button" onClick={() => void logoutAdmin()}>
            <LogOut aria-hidden="true" /><span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {adminConfirmDialog}
        <div className="admin-mobile-bar">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-navigation"
            ref={mobileMenuButtonRef}
          >
            <Menu aria-hidden="true" />
          </button>
          <div><strong>{currentNavigationItem.label}</strong><small>Panel administrativo</small></div>
          <span aria-hidden="true">SR</span>
        </div>
        <header className="admin-topbar">
          <div>
            <p>Panel privado</p>
            <h1>{currentNavigationItem.title}</h1>
            <span>{currentNavigationItem.description}</span>
          </div>
          <div className="admin-user">
            <span>{user.email?.slice(0, 1).toUpperCase()}</span>
            <div><strong>{user.email}</strong><small>Administradora</small></div>
          </div>
        </header>

        {notice ? (
          <button className="admin-notice" type="button" onClick={() => setNotice('')} role="status">
            <CheckCircle2 size={20} aria-hidden="true" /><span>{notice}</span><X size={18} aria-hidden="true" />
          </button>
        ) : null}
        {dataError ? <p className="admin-error admin-page-error" role="alert">{dataError}</p> : null}

        {activeTab === 'overview' ? (
          <>
            <div className="admin-overview-grid">
              <article><PackageSearch aria-hidden="true" /><div><strong>{stats.activeProducts}</strong><span>Productos visibles</span></div></article>
              <article><UsersRound aria-hidden="true" /><div><strong>{stats.clients}</strong><span>Clientas registradas</span></div></article>
              <article><Activity aria-hidden="true" /><div><strong>{stats.sessions}</strong><span>Sesiones registradas</span></div></article>
              <article><Scissors aria-hidden="true" /><div><strong>{stats.activeServices}</strong><span>Servicios visibles</span></div></article>
              <article><CircleDollarSign aria-hidden="true" /><div><strong>{new Intl.NumberFormat('es-CL', {
                  currency: 'CLP',
                  maximumFractionDigits: 0,
                  style: 'currency',
                }).format(stats.appointmentsRevenue)}</strong><span>Ingresos registrados</span></div></article>
              <article><Newspaper aria-hidden="true" /><div><strong>{stats.activeNews}</strong><span>Novedades publicadas</span></div></article>
              <article className={stats.lowStock ? 'has-warning' : ''}><CalendarCheck2 aria-hidden="true" /><div><strong>{stats.lowStock}</strong><span>Productos con stock bajo</span></div></article>
            </div>
            <div className="admin-overview-actions" aria-label="Acciones frecuentes">
              <AdminButton variant="primary" icon={CalendarCheck2} type="button" onClick={() => selectTab('hours')}>Ir a la agenda</AdminButton>
              <AdminButton icon={UsersRound} type="button" onClick={() => selectTab('clients')}>Buscar clienta</AdminButton>
              <AdminButton icon={PackageSearch} type="button" onClick={() => selectTab('inventory')}>Revisar inventario</AdminButton>
            </div>
            <AnalyticsView events={events} />
          </>
        ) : null}

        {activeTab === 'clients' ? (
          <ClientsPanel clients={clients} allVisits={allClientVisits} />
        ) : null}

        {activeTab === 'hours' ? (
          <HoursPanel
            bookings={bookings}
            clients={clients}
            allVisits={allClientVisits}
            stylists={stylists}
            serviceCategories={serviceCategories}
            serviceItems={serviceItems}
            appointments={visibleAppointments}
            onNotice={setNotice}
          />
        ) : null}

        {activeTab === 'appointments' ? (
          <AppointmentsPanel
            appointments={visibleAppointments}
            clients={clients}
            allVisits={allClientVisits}
            stylists={stylists}
          />
        ) : null}

        {activeTab === 'services' ? (
          <ServicesPanel
            categories={serviceCategories}
            items={serviceItems}
            onNotice={setNotice}
          />
        ) : null}

        {activeTab === 'inventory' ? (
          productDraft ? (
            <ProductForm
              product={productDraft}
              onChange={setProductDraft}
              onCancel={() => setProductDraft(null)}
              onSaved={() => {
                setProductDraft(null)
                setNotice('Producto guardado.')
              }}
            />
          ) : (
            <InventoryPanel
              products={products}
              inventory={inventory}
              invoices={inventoryInvoices}
              invoiceLines={inventoryInvoiceLines}
              movements={movements}
              appointments={visibleAppointments}
              clients={clients}
              allVisits={allClientVisits}
              suppliers={suppliers}
              stylists={stylists}
              onAddProduct={() => setProductDraft(emptyProduct(products.length + 1))}
              onEditProduct={setProductDraft}
              onDeleteProduct={async (product) => {
                if (!product.id) return
                const accepted = await confirmAdmin({
                  title: `Eliminar producto ${product.title}`,
                  description: 'También se eliminará su registro de inventario y no aparecerá en el catálogo.',
                  confirmLabel: 'Eliminar producto',
                })
                if (accepted) {
                  void removeProduct(product.id, product.title)
                }
              }}
            />
          )
        ) : null}

        {activeTab === 'news' ? (
          newsDraft ? (
            <NewsForm
              item={newsDraft}
              onChange={setNewsDraft}
              onCancel={() => setNewsDraft(null)}
              onSaved={() => {
                setNewsDraft(null)
                setNotice('Novedad guardada.')
              }}
            />
          ) : (
            <section className="admin-content-card">
              <div className="admin-card-heading">
                <div><p>Publicaciones</p><h2>{news.length} novedades</h2></div>
                <AdminButton variant="primary" icon={Plus} type="button" onClick={() => setNewsDraft(emptyNewsItem(news.length + 1))}>
                  Agregar novedad
                </AdminButton>
              </div>
              {!news.length ? (
                <div className="admin-empty-state">
                  <h3>Aún no hay novedades publicadas</h3>
                  <p>Agrega la primera publicación para mostrar esta sección en el sitio.</p>
                  <button type="button" onClick={() => setNewsDraft(emptyNewsItem(1))}>Agregar novedad</button>
                </div>
              ) : (
                <div className="admin-table admin-news-table">
                  {news.map((item) => (
                    <article key={item.id}>
                      <ContentImage source={item.image} alt="" mode="preview" />
                      <div><strong>{item.title}</strong><span>{item.category} · {item.date}</span></div>
                      <small className={item.active ? 'is-published' : ''}>{item.active ? 'Publicada' : 'Oculta'}</small>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => setNewsDraft(item)}><Pencil size={17} aria-hidden="true" /> Editar</button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!item.id) return
                            const accepted = await confirmAdmin({
                              title: `Eliminar novedad ${item.title}`,
                              description: 'La publicación desaparecerá del panel y del sitio público.',
                              confirmLabel: 'Eliminar novedad',
                            })
                            if (accepted) {
                              void removeNewsItem(item.id, item.title)
                            }
                          }}
                        >
                          <Trash2 size={17} aria-hidden="true" /> Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )
        ) : null}

        {activeTab === 'audit' ? <AuditPanel logs={auditLogs} /> : null}
      </main>
    </div>
  )
}
