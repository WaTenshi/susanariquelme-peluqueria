import { useMemo, useState, type FormEvent } from 'react'
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  Filter,
  Pencil,
  ReceiptText,
  Scissors,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  WalletCards,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { cancelBooking, saveBooking } from './firebase'
import ClientPickerModal from './ClientPickerModal'
import type {
  AppointmentRecord,
  Booking,
  BookingAttendanceStatus,
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingServiceLine,
  Client,
  ClientVisit,
  ServiceCategory,
  ServiceItem,
  Stylist,
} from './types'

type HoursPanelProps = {
  bookings: Booking[]
  clients: Client[]
  allVisits: ClientVisit[]
  stylists: Stylist[]
  serviceCategories: ServiceCategory[]
  serviceItems: ServiceItem[]
  appointments: AppointmentRecord[]
  onNotice: (message: string) => void
}

type StatusFilter = 'all' | BookingAttendanceStatus

type StylistOption = {
  key: string
  name: string
  active: boolean
  fromHistory: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value || 0)

const normalizeText = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const normalizeName = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('es')

const parseMoney = (value: string) => Number(value.replace(/\D/g, '')) || 0

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'full',
  }).format(new Date(`${value}T12:00:00`))

const moveDate = (value: string, amount: number) => {
  const next = new Date(`${value}T12:00:00`)
  next.setDate(next.getDate() + amount)
  return next.toISOString().slice(0, 10)
}

const productTotal = (appointment: AppointmentRecord) =>
  appointment.productCash + appointment.productCard + appointment.productTransfer

const paymentMethodLabels: Record<BookingPaymentMethod, string> = {
  none: 'Sin pago',
  cash: 'Efectivo',
  credit: 'Credito',
  debit: 'Debito',
  transfer: 'Transferencia',
  check: 'Cheque',
}

const paymentStatusLabels: Record<BookingPaymentStatus, string> = {
  pending: 'Pendiente',
  deposit: 'Abonado',
  paid: 'Pagado',
}

const attendanceStatusMeta: Record<
  BookingAttendanceStatus,
  { label: string; tone: string; Icon: LucideIcon }
> = {
  no_deposit: { label: 'Sin abono', tone: 'pending', Icon: Clock },
  deposited: { label: 'Abonado', tone: 'deposit', Icon: WalletCards },
  not_performed: { label: 'No realizada', tone: 'missed', Icon: XCircle },
  performed: { label: 'Realizada', tone: 'done', Icon: CheckCircle2 },
}

const emptyBooking = (date = today()): Booking => ({
  clientId: '',
  clientName: '',
  stylistId: '',
  stylistName: '',
  date,
  time: '10:00',
  services: [],
  totalAmount: 0,
  depositAmount: 0,
  depositPaymentMethod: 'none',
  paymentStatus: 'pending',
  attendanceStatus: 'no_deposit',
  finalPaymentMethod: 'none',
  notes: '',
  active: true,
})

function StatusBadge({ status }: { status: BookingAttendanceStatus }) {
  const meta = attendanceStatusMeta[status]
  const Icon = meta.Icon
  return (
    <span className={`hours-status-badge is-${meta.tone}`}>
      <Icon size={15} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="hours-field-icon" size={16} aria-hidden="true" />
}

function BookingForm({
  initial,
  clients,
  allVisits,
  stylistOptions,
  serviceItems,
  serviceCategories,
  bookings,
  onClose,
  onSaved,
}: {
  initial: Booking
  clients: Client[]
  allVisits: ClientVisit[]
  stylistOptions: StylistOption[]
  serviceItems: ServiceItem[]
  serviceCategories: ServiceCategory[]
  bookings: Booking[]
  onClose: () => void
  onSaved: () => void
}) {
  const [booking, setBooking] = useState(initial)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const categoryById = useMemo(() => {
    const map = new Map<string, string>()
    serviceCategories.forEach((category) => {
      if (category.id) map.set(category.id, category.title)
    })
    return map
  }, [serviceCategories])

  const activeServices = useMemo(
    () =>
      serviceItems
        .filter((service) => service.active)
        .sort((first, second) => first.order - second.order),
    [serviceItems],
  )

  const duplicateHint = useMemo(
    () =>
      bookings.some(
        (item) =>
          item.id !== booking.id &&
          item.active !== false &&
          item.stylistId === booking.stylistId &&
          item.date === booking.date &&
          item.time === booking.time,
      ),
    [booking, bookings],
  )

  const update = <K extends keyof Booking>(key: K, value: Booking[K]) =>
    setBooking((current) => ({ ...current, [key]: value }))

  const setServices = (services: BookingServiceLine[]) =>
    setBooking((current) => ({
      ...current,
      services,
      totalAmount: services.reduce((total, service) => total + service.price, 0),
    }))

  const toggleService = (service: ServiceItem) => {
    const serviceId = service.id || service.name
    const exists = booking.services.some((line) => line.serviceId === serviceId)
    if (exists) {
      setServices(booking.services.filter((line) => line.serviceId !== serviceId))
      return
    }
    setServices([
      ...booking.services,
      {
        serviceId,
        serviceName: service.name,
        categoryId: service.categoryId,
        price: parseMoney(service.price),
      },
    ])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!booking.clientId) {
      setError('Selecciona una clienta para registrar la hora.')
      return
    }
    if (!booking.stylistId) {
      setError('Selecciona una estilista para registrar la hora.')
      return
    }
    if (!booking.services.length) {
      setError('Agrega al menos un servicio.')
      return
    }
    if (duplicateHint) {
      setError('La estilista ya tiene una hora registrada en ese horario.')
      return
    }

    setIsSaving(true)
    try {
      await saveBooking(booking)
      onSaved()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No fue posible guardar la hora.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor hours-editor" onSubmit={handleSubmit}>
      <div className="admin-editor-head">
        <div>
          <p>{booking.id ? 'Editar hora' : 'Registrar hora'}</p>
          <h2>{booking.clientName || 'Nueva reserva'}</h2>
        </div>
        <button className="admin-text-button" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {duplicateHint ? (
        <p className="hours-warning">
          Esta estilista ya tiene una reserva activa en la misma fecha y hora.
        </p>
      ) : null}

      <div className="admin-form-grid hours-form-grid">
        <label className="is-wide">
          <span><FieldIcon icon={UserRound} /> Clienta</span>
          <button
            className="inventory-client-picker-button"
            type="button"
            onClick={() => setClientPickerOpen(true)}
          >
            {booking.clientName || 'Buscar clienta'}
          </button>
        </label>
        <label>
          <span><FieldIcon icon={Calendar} /> Fecha</span>
          <input
            type="date"
            value={booking.date}
            onChange={(event) => update('date', event.target.value)}
            required
          />
        </label>
        <label>
          <span><FieldIcon icon={Clock} /> Hora</span>
          <input
            type="time"
            value={booking.time}
            onChange={(event) => update('time', event.target.value)}
            required
          />
        </label>
        <label className="is-wide">
          <span><FieldIcon icon={Scissors} /> Estilista</span>
          <select
            value={booking.stylistId}
            onChange={(event) => {
              const stylist = stylistOptions.find((item) => item.key === event.target.value)
              update('stylistId', event.target.value)
              update('stylistName', stylist?.name || '')
            }}
            required
          >
            <option value="">Seleccionar estilista</option>
            {stylistOptions.map((stylist) => (
              <option value={stylist.key} key={stylist.key}>
                {stylist.name}{stylist.fromHistory ? ' · historico' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="hours-service-picker is-wide">
          <span><FieldIcon icon={Scissors} /> Servicios a realizar</span>
          <div>
            {activeServices.map((service) => {
              const serviceId = service.id || service.name
              const checked = booking.services.some((line) => line.serviceId === serviceId)
              return (
                <button
                  className={checked ? 'is-selected' : ''}
                  type="button"
                  onClick={() => toggleService(service)}
                  key={serviceId}
                >
                  <span>{service.name}</span>
                  <small>
                    {categoryById.get(service.categoryId) || 'Servicio'} · {service.price}
                  </small>
                </button>
              )
            })}
          </div>
        </div>

        <label>
          <span><FieldIcon icon={CircleDollarSign} /> Valor total</span>
          <input
            type="number"
            min="0"
            value={booking.totalAmount}
            onChange={(event) => update('totalAmount', Number(event.target.value))}
          />
        </label>
        <label>
          <span><FieldIcon icon={WalletCards} /> Abono</span>
          <input
            type="number"
            min="0"
            value={booking.depositAmount}
            onChange={(event) => {
              const amount = Number(event.target.value)
              update('depositAmount', amount)
              if (amount > 0 && booking.paymentStatus === 'pending') {
                update('paymentStatus', 'deposit')
                update('attendanceStatus', 'deposited')
              }
            }}
          />
        </label>
        <label>
          Medio de abono
          <select
            value={booking.depositPaymentMethod}
            onChange={(event) =>
              update('depositPaymentMethod', event.target.value as BookingPaymentMethod)
            }
          >
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Estado de pago
          <select
            value={booking.paymentStatus}
            onChange={(event) =>
              update('paymentStatus', event.target.value as BookingPaymentStatus)
            }
          >
            {Object.entries(paymentStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Estado de atención
          <select
            value={booking.attendanceStatus}
            onChange={(event) =>
              update('attendanceStatus', event.target.value as BookingAttendanceStatus)
            }
          >
            {Object.entries(attendanceStatusMeta).map(([value, meta]) => (
              <option value={value} key={value}>{meta.label}</option>
            ))}
          </select>
        </label>
        <label>
          Medio pago final
          <select
            value={booking.finalPaymentMethod}
            onChange={(event) =>
              update('finalPaymentMethod', event.target.value as BookingPaymentMethod)
            }
          >
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="is-wide">
          <span><FieldIcon icon={ReceiptText} /> Observaciones</span>
          <textarea
            value={booking.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Notas internas, detalles técnicos o indicaciones de la clienta"
          />
        </label>
      </div>

      <div className="hours-editor-footer">
        <div>
          <span>Total</span>
          <strong>{money(booking.totalAmount)}</strong>
          <small>Pendiente: {money(Math.max(booking.totalAmount - booking.depositAmount, 0))}</small>
        </div>
        <button className="admin-primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar hora'}
        </button>
      </div>

      {clientPickerOpen ? (
        <ClientPickerModal
          clients={clients}
          allVisits={allVisits}
          selectedClientId={booking.clientId}
          selectedClientName={booking.clientName}
          eyebrow="Agenda de horas"
          title="Seleccionar clienta"
          onSelect={(client, name) => {
            update('clientId', client.id || '')
            update('clientName', name)
          }}
          onClose={() => setClientPickerOpen(false)}
          onClear={() => {
            update('clientId', '')
            update('clientName', '')
          }}
        />
      ) : null}
    </form>
  )
}

export default function HoursPanel({
  bookings,
  clients,
  allVisits,
  stylists,
  serviceCategories,
  serviceItems,
  appointments,
  onNotice,
}: HoursPanelProps) {
  const [selectedDate, setSelectedDate] = useState(today())
  const [stylistFilter, setStylistFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Booking | null>(null)
  const [detail, setDetail] = useState<Booking | null>(null)

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.active !== false),
    [bookings],
  )

  const stylistOptions = useMemo(() => {
    const options = new Map<string, StylistOption>()
    stylists.forEach((stylist) => {
      const key = stylist.id || normalizeName(stylist.name)
      if (!key) return
      options.set(key, {
        key,
        name: stylist.name,
        active: stylist.active,
        fromHistory: false,
      })
    })
    appointments.forEach((appointment) => {
      ;[appointment.stylist, appointment.productStylist].forEach((name) => {
        const key = normalizeName(name)
        if (key && !options.has(key)) {
          options.set(key, {
            key,
            name: name.trim(),
            active: true,
            fromHistory: true,
          })
        }
      })
    })
    bookings.forEach((booking) => {
      const key = booking.stylistId || normalizeName(booking.stylistName)
      if (key && !options.has(key)) {
        options.set(key, {
          key,
          name: booking.stylistName,
          active: true,
          fromHistory: true,
        })
      }
    })
    return [...options.values()]
      .filter((stylist) => stylist.active)
      .sort((first, second) => first.name.localeCompare(second.name, 'es'))
  }, [appointments, bookings, stylists])

  const dayBookings = useMemo(
    () =>
      activeBookings
        .filter((booking) => booking.date === selectedDate)
        .sort((first, second) => first.time.localeCompare(second.time)),
    [activeBookings, selectedDate],
  )

  const visibleBookings = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return dayBookings.filter((booking) => {
      const matchesStylist =
        stylistFilter === 'all' || booking.stylistId === stylistFilter
      const matchesStatus =
        statusFilter === 'all' || booking.attendanceStatus === statusFilter
      const matchesQuery =
        !normalizedQuery || normalizeText(booking.clientName).includes(normalizedQuery)
      return matchesStylist && matchesStatus && matchesQuery
    })
  }, [dayBookings, query, statusFilter, stylistFilter])

  const productSales = useMemo(
    () =>
      appointments.filter(
        (appointment) => appointment.date === selectedDate && appointment.productName,
      ),
    [appointments, selectedDate],
  )

  const dailyRows = useMemo(() => {
    const matchedSaleIds = new Set<string>()
    const rows = dayBookings.map((booking) => {
      const bookingClient = normalizeText(booking.clientName)
      const sales = productSales.filter((sale) => {
        const saleClient = normalizeText(sale.productClientName || sale.clientName)
        const matches = bookingClient && saleClient && bookingClient === saleClient
        if (matches) matchedSaleIds.add(sale.id || sale.sourceId || sale.productName)
        return matches
      })
      return {
        id: booking.id || `${booking.date}-${booking.time}-${booking.clientName}`,
        time: booking.time,
        clientName: booking.clientName,
        stylistName: booking.stylistName,
        services: booking.services
          .map((service) => `${service.serviceName} (${money(service.price)})`)
          .join(', '),
        serviceValue: booking.attendanceStatus === 'performed'
          ? booking.totalAmount
          : 0,
        deposit: booking.depositAmount,
        depositLabel: booking.depositAmount
          ? `${paymentMethodLabels[booking.depositPaymentMethod]} · ${money(booking.depositAmount)}`
          : 'Sin abono',
        products: sales.map((sale) => sale.productName).join(', '),
        productValue: sales.reduce((total, sale) => total + productTotal(sale), 0),
        status: booking.attendanceStatus,
      }
    })

    productSales
      .filter((sale) => !matchedSaleIds.has(sale.id || sale.sourceId || sale.productName))
      .forEach((sale) => {
        rows.push({
          id: sale.id || sale.sourceId || `sale-${sale.productName}`,
          time: 'Venta',
          clientName: sale.productClientName || sale.clientName || 'Sin clienta',
          stylistName: sale.productStylist || 'Sin estilista',
          services: '-',
          serviceValue: 0,
          deposit: 0,
          depositLabel: '-',
          products: sale.productName,
          productValue: productTotal(sale),
          status: 'performed',
        })
      })

    return rows.sort((first, second) => first.time.localeCompare(second.time))
  }, [dayBookings, productSales])

  const summary = useMemo(() => {
    const performed = dayBookings.filter(
      (booking) => booking.attendanceStatus === 'performed',
    )
    const notPerformed = dayBookings.filter(
      (booking) => booking.attendanceStatus === 'not_performed',
    )
    const pending = dayBookings.filter(
      (booking) =>
        booking.attendanceStatus === 'no_deposit' ||
        booking.attendanceStatus === 'deposited',
    )
    const stylistTotals = new Map<string, number>()
    performed.forEach((booking) => {
      stylistTotals.set(
        booking.stylistName,
        (stylistTotals.get(booking.stylistName) || 0) + booking.totalAmount,
      )
    })
    productSales.forEach((sale) => {
      const stylist = sale.productStylist || 'Sin estilista'
      stylistTotals.set(stylist, (stylistTotals.get(stylist) || 0) + productTotal(sale))
    })

    const serviceCounts = new Map<string, { count: number; total: number }>()
    performed.forEach((booking) => {
      booking.services.forEach((service) => {
        const current = serviceCounts.get(service.serviceName) || { count: 0, total: 0 }
        serviceCounts.set(service.serviceName, {
          count: current.count + 1,
          total: current.total + service.price,
        })
      })
    })

    return {
      performed: performed.length,
      pending: pending.length,
      notPerformed: notPerformed.length,
      deposits: dayBookings.reduce((total, booking) => total + booking.depositAmount, 0),
      servicesTotal: performed.reduce((total, booking) => total + booking.totalAmount, 0),
      productsTotal: productSales.reduce((total, sale) => total + productTotal(sale), 0),
      stylistTotals: [...stylistTotals.entries()].sort((a, b) => b[1] - a[1]),
      serviceCounts: [...serviceCounts.entries()].sort((a, b) => b[1].total - a[1].total),
    }
  }, [dayBookings, productSales])

  const startNew = () => {
    setDetail(null)
    setDraft(emptyBooking(selectedDate))
  }

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`¿Anular la hora de ${booking.clientName}?`)) return
    await cancelBooking(booking)
    setDetail(null)
    onNotice('Hora anulada. El registro quedó en el historial de cambios.')
  }

  if (draft) {
    return (
      <BookingForm
        initial={draft}
        clients={clients}
        allVisits={allVisits}
        stylistOptions={stylistOptions}
        serviceItems={serviceItems}
        serviceCategories={serviceCategories}
        bookings={activeBookings}
        onClose={() => setDraft(null)}
        onSaved={() => {
          setDraft(null)
          onNotice('Hora guardada.')
        }}
      />
    )
  }

  return (
    <div className="hours-panel">
      <section className="finance-hero hours-hero">
        <div>
          <p>Agenda del salón</p>
          <h2>Horas, reservas y atenciones</h2>
          <span>
            Gestiona reservas por estilista, registra abonos y consolida el día
            sin separar la ficha de la clienta de la información financiera.
          </span>
        </div>
        <button className="admin-primary-button" type="button" onClick={startNew}>
          <CalendarPlus size={18} aria-hidden="true" />
          Registrar hora
        </button>
      </section>

      <section className="admin-content-card hours-summary">
        <div className="admin-card-heading">
          <div>
            <p>Resumen diario</p>
            <h2>{dateLabel(selectedDate)}</h2>
          </div>
          <div className="hours-day-nav">
            <button type="button" onClick={() => setSelectedDate(moveDate(selectedDate, -1))}>
              Dia anterior
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <button type="button" onClick={() => setSelectedDate(today())}>Hoy</button>
            <button type="button" onClick={() => setSelectedDate(moveDate(selectedDate, 1))}>
              Dia siguiente
            </button>
          </div>
        </div>

        <div className="hours-summary-grid">
          <article><CheckCircle2 size={18} /><span>Realizadas</span><strong>{summary.performed}</strong></article>
          <article><Clock size={18} /><span>Pendientes</span><strong>{summary.pending}</strong></article>
          <article><XCircle size={18} /><span>No realizadas</span><strong>{summary.notPerformed}</strong></article>
          <article><WalletCards size={18} /><span>Abonos</span><strong>{money(summary.deposits)}</strong></article>
          <article><Scissors size={18} /><span>Servicios</span><strong>{money(summary.servicesTotal)}</strong></article>
          <article><ShoppingBag size={18} /><span>Productos</span><strong>{money(summary.productsTotal)}</strong></article>
        </div>

        <div className="hours-daily-table" role="table" aria-label="Resumen diario por hora">
          <div className="hours-daily-table-head" role="row">
            <span role="columnheader">Hora</span>
            <span role="columnheader">Clienta</span>
            <span role="columnheader">Estilista</span>
            <span role="columnheader">Servicio y valor</span>
            <span role="columnheader">Abono</span>
            <span role="columnheader">Producto</span>
          </div>
          {dailyRows.length ? dailyRows.map((row) => (
            <div className="hours-daily-row" role="row" key={row.id}>
              <strong role="cell">{row.time}</strong>
              <span role="cell">{row.clientName}</span>
              <span role="cell">{row.stylistName}</span>
              <span role="cell">
                {row.services}
                {row.serviceValue ? <small>{money(row.serviceValue)}</small> : null}
              </span>
              <span role="cell">
                {row.depositLabel}
                {row.deposit ? <small>Pago parcial</small> : null}
              </span>
              <span role="cell">
                {row.products || '-'}
                {row.productValue ? <small>{money(row.productValue)}</small> : null}
              </span>
            </div>
          )) : (
            <div className="hours-daily-empty" role="row">
              No hay horas ni ventas registradas para este día.
            </div>
          )}
        </div>
      </section>

      <section className="admin-content-card hours-board">
        <div className="admin-card-heading">
          <div>
            <p>Listado de horas</p>
            <h2>{visibleBookings.length} reservas visibles</h2>
          </div>
          <button className="admin-secondary-button" type="button" onClick={startNew}>
            <CalendarPlus size={16} aria-hidden="true" />
            Registrar hora
          </button>
        </div>

        <div className="hours-toolbar">
          <label>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar clienta"
            />
          </label>
          <label>
            <Filter size={16} aria-hidden="true" />
            <select
              value={stylistFilter}
              onChange={(event) => setStylistFilter(event.target.value)}
            >
              <option value="all">Todas las estilistas</option>
              {stylistOptions.map((stylist) => (
                <option value={stylist.key} key={stylist.key}>
                  {stylist.name}{stylist.fromHistory ? ' · historico' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <Filter size={16} aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(attendanceStatusMeta).map(([value, meta]) => (
                <option value={value} key={value}>{meta.label}</option>
              ))}
            </select>
          </label>
        </div>

        {visibleBookings.length ? (
          <div className="hours-list">
            {visibleBookings.map((booking) => (
              <article className={`hours-card is-${attendanceStatusMeta[booking.attendanceStatus].tone}`} key={booking.id}>
                <div className="hours-card-time">
                  <Clock size={16} aria-hidden="true" />
                  <strong>{booking.time}</strong>
                </div>
                <div className="hours-card-main">
                  <h3><UserRound size={16} aria-hidden="true" /> {booking.clientName}</h3>
                  <p><Scissors size={15} aria-hidden="true" /> {booking.stylistName}</p>
                  <p>{booking.services.map((service) => service.serviceName).join(', ')}</p>
                </div>
                <div className="hours-card-money">
                  <StatusBadge status={booking.attendanceStatus} />
                  <span><WalletCards size={14} aria-hidden="true" /> {paymentStatusLabels[booking.paymentStatus]}</span>
                  <strong>{money(booking.totalAmount)}</strong>
                  <small>Abono {money(booking.depositAmount)}</small>
                </div>
                <div className="hours-card-actions">
                  <button type="button" title="Ver detalle" onClick={() => setDetail(booking)}>
                    <Eye size={16} aria-hidden="true" /> Ver
                  </button>
                  <button type="button" title="Editar reserva" onClick={() => setDraft(booking)}>
                    <Pencil size={16} aria-hidden="true" /> Editar
                  </button>
                  <button type="button" title="Anular hora" onClick={() => void handleCancel(booking)}>
                    <Trash2 size={16} aria-hidden="true" /> Anular
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <Calendar size={28} aria-hidden="true" />
            <h3>No hay horas para los filtros seleccionados</h3>
            <p>Registra una nueva hora o cambia el día, la estilista o el estado.</p>
            <button type="button" onClick={startNew}>Registrar hora</button>
          </div>
        )}
      </section>

      {detail ? (
        <section className="admin-content-card hours-detail">
          <div className="admin-card-heading">
            <div>
              <p>Detalle de la reserva</p>
              <h2>{detail.clientName}</h2>
            </div>
            <div className="hours-detail-actions">
              <button className="admin-secondary-button" type="button" onClick={() => setDraft(detail)}>
                <Pencil size={16} aria-hidden="true" /> Editar
              </button>
              <button className="admin-text-button" type="button" onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>
          </div>
          <div className="hours-detail-grid">
            <p><Calendar size={16} /> {dateLabel(detail.date)} · {detail.time}</p>
            <p><UserRound size={16} /> {detail.clientName}</p>
            <p><Scissors size={16} /> {detail.stylistName}</p>
            <p><WalletCards size={16} /> {paymentStatusLabels[detail.paymentStatus]} · {paymentMethodLabels[detail.finalPaymentMethod]}</p>
            <p><CircleDollarSign size={16} /> Total {money(detail.totalAmount)} · Abono {money(detail.depositAmount)}</p>
            <p><ReceiptText size={16} /> {detail.notes || 'Sin observaciones'}</p>
          </div>
          <div className="hours-detail-services">
            {detail.services.map((service) => (
              <span key={service.serviceId}>{service.serviceName} · {money(service.price)}</span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
