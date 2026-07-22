import { useMemo, useState, type FormEvent } from 'react'
import {
  Archive,
  CalendarDays,
  ChartNoAxesCombined,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import {
  removeAppointment,
  removeStylist,
  saveAppointment,
  saveStylist,
} from './firebase'
import ClientPickerModal from './ClientPickerModal'
import type {
  AppointmentRecord,
  Client,
  ClientVisit,
  Stylist,
  StylistPaymentFrequency,
} from './types'
import { AdminButton } from './admin-ui'
import { useAdminConfirm } from './admin-confirm'

type AppointmentsPanelProps = {
  appointments: AppointmentRecord[]
  clients: Client[]
  allVisits: ClientVisit[]
  stylists: Stylist[]
}

type FinanceView = 'summary' | 'stylists' | 'calendar' | 'records'
type ServicePaymentMethod = 'cash' | 'credit' | 'debit' | 'transfer' | 'check'

type StylistContribution = {
  services: number
  products: number
  total: number
  records: number
}

type StylistOption = {
  id?: string
  key: string
  name: string
  role: string
  paymentFrequency: StylistPaymentFrequency
  active: boolean
  fromHistory: boolean
}

const paymentLabels: Record<ServicePaymentMethod, string> = {
  cash: 'Efectivo',
  credit: 'Credito',
  debit: 'Debito',
  transfer: 'Transferencia',
  check: 'Cheque',
}

const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value || 0)

const dateLabel = (value: string) => {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T12:00:00`))
}

const monthLabel = (value: string) =>
  new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}-01T12:00:00`))

const normalizeName = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('es')

const normalizeText = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const serviceTotal = (appointment: AppointmentRecord) =>
  appointment.serviceCash + appointment.serviceCard + appointment.serviceTransfer

const productTotal = (appointment: AppointmentRecord) =>
  appointment.productCash + appointment.productCard + appointment.productTransfer

const appointmentTotal = (appointment: AppointmentRecord) =>
  serviceTotal(appointment) + productTotal(appointment)

const emptyContribution = (): StylistContribution => ({
  products: 0,
  records: 0,
  services: 0,
  total: 0,
})

const emptyAppointment = (): AppointmentRecord => ({
  date: new Date().toISOString().slice(0, 10),
  depositDate: new Date().toISOString().slice(0, 10),
  depositAmount: 0,
  survey: '',
  stylist: '',
  clientName: '',
  service: '',
  serviceCash: 0,
  serviceCard: 0,
  serviceTransfer: 0,
  serviceReceipt: '',
  productStylist: '',
  productClientName: '',
  productName: '',
  productCash: 0,
  productCard: 0,
  productTransfer: 0,
  productReceipt: '',
  notes: '',
  sourceSheet: 'Finanzas',
  sourceRow: 0,
  sourceId: '',
})

const emptyStylist = (): Stylist => ({
  name: '',
  role: 'Estilista',
  phone: '',
  email: '',
  paymentFrequency: 'monthly',
  active: true,
  notes: '',
  searchText: '',
})

const inferPaymentMethod = (appointment: AppointmentRecord): ServicePaymentMethod => {
  if (appointment.serviceCash) return 'cash'
  if (appointment.serviceCard) return 'debit'
  if (appointment.serviceTransfer) return 'transfer'
  return 'cash'
}

const paymentAmount = (
  method: ServicePaymentMethod,
  amount: number,
) => ({
  serviceCash: method === 'cash' ? amount : 0,
  serviceCard: method === 'credit' || method === 'debit' ? amount : 0,
  serviceTransfer: method === 'transfer' || method === 'check' ? amount : 0,
})

const stylistContribution = (
  appointment: AppointmentRecord,
  stylistKey: string,
) => {
  const totals = emptyContribution()
  if (normalizeName(appointment.stylist) === stylistKey) {
    const total = serviceTotal(appointment)
    totals.services += total
    totals.total += total
    if (total || appointment.service) totals.records += 1
  }
  if (normalizeName(appointment.productStylist) === stylistKey) {
    const total = productTotal(appointment)
    totals.products += total
    totals.total += total
    if (total || appointment.productName) totals.records += 1
  }
  return totals
}

const addContribution = (
  target: StylistContribution,
  next: StylistContribution,
) => {
  target.services += next.services
  target.products += next.products
  target.records += next.records
  target.total += next.total
}

const monthDays = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(year, monthNumber - 1, 1)
  const last = new Date(year, monthNumber, 0)
  const prefix = Array.from({ length: (first.getDay() + 6) % 7 }, () => null)
  const days = Array.from({ length: last.getDate() }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return `${month}-${day}`
  })
  return [...prefix, ...days]
}

const weekPeriod = (date: string) => {
  const day = new Date(`${date}T12:00:00`)
  const offset = (day.getDay() + 6) % 7
  const start = new Date(day)
  start.setDate(day.getDate() - offset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const key = start.toISOString().slice(0, 10)
  return {
    key,
    label: `${dateLabel(key)} al ${dateLabel(end.toISOString().slice(0, 10))}`,
  }
}

function ServiceForm({
  initial,
  clients,
  allVisits,
  stylistOptions,
  onClose,
}: {
  initial: AppointmentRecord
  clients: Client[]
  allVisits: ClientVisit[]
  stylistOptions: StylistOption[]
  onClose: () => void
}) {
  const [appointment, setAppointment] = useState(initial)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<ServicePaymentMethod>(
    inferPaymentMethod(initial),
  )
  const [serviceAmount, setServiceAmount] = useState(serviceTotal(initial))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const update = <K extends keyof AppointmentRecord>(
    key: K,
    value: AppointmentRecord[K],
  ) => setAppointment((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!appointment.clientName.trim()) {
      setError('Selecciona una clienta para guardar el servicio.')
      return
    }
    setIsSaving(true)
    try {
      const servicePayments = paymentAmount(paymentMethod, serviceAmount)
      await saveAppointment({
        ...appointment,
        ...servicePayments,
        productStylist: '',
        productClientName: '',
        productName: '',
        productCash: 0,
        productCard: 0,
        productTransfer: 0,
        productReceipt: '',
        sourceSheet: appointment.sourceSheet || 'Finanzas',
      })
      onClose()
    } catch {
      setError('No fue posible guardar el registro de servicio.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor finance-service-editor" onSubmit={handleSubmit}>
      <div className="admin-editor-head">
        <div>
          <p>{appointment.id ? 'Editar servicio' : 'Registrar servicio'}</p>
          <h2>{appointment.clientName || 'Ingreso de dinero por hora'}</h2>
        </div>
        <button className="admin-text-button" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="admin-form-grid">
        <label>
          Fecha
          <input
            type="date"
            value={appointment.date}
            onChange={(event) => update('date', event.target.value)}
            required
          />
        </label>
        <label>
          Estilista
          <select
            value={appointment.stylist}
            onChange={(event) => update('stylist', event.target.value)}
            required
          >
            <option value="">Seleccionar estilista</option>
            {stylistOptions.map((stylist) => (
              <option value={stylist.name} key={stylist.key}>
                {stylist.name}
              </option>
            ))}
          </select>
        </label>
        <label className="is-wide">
          Clienta
          <button
            className="inventory-client-picker-button"
            type="button"
            onClick={() => setClientPickerOpen(true)}
          >
            {appointment.clientName || 'Buscar clienta'}
          </button>
        </label>
        <label className="is-wide">
          Servicio
          <input
            value={appointment.service}
            onChange={(event) => update('service', event.target.value)}
            placeholder="Ej. Color, brushing, corte, tratamiento"
            maxLength={300}
            required
          />
        </label>
        <label>
          Metodo de pago
          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as ServicePaymentMethod)
            }
          >
            {Object.entries(paymentLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Valor servicio
          <input
            type="number"
            min="0"
            value={serviceAmount}
            onChange={(event) => setServiceAmount(Number(event.target.value))}
            required
          />
        </label>
        <label>
          Abono
          <input
            type="number"
            min="0"
            value={appointment.depositAmount}
            onChange={(event) => update('depositAmount', Number(event.target.value))}
          />
        </label>
        <label>
          Fecha abono
          <input
            type="date"
            value={appointment.depositDate}
            onChange={(event) => update('depositDate', event.target.value)}
          />
        </label>
        <label>
          Numero de boleta
          <input
            value={appointment.serviceReceipt}
            onChange={(event) => update('serviceReceipt', event.target.value)}
            maxLength={80}
          />
        </label>
        <label className="is-wide">
          Notas
          <textarea
            value={appointment.notes}
            onChange={(event) => update('notes', event.target.value)}
            maxLength={2000}
          />
        </label>
      </div>

      <div className="finance-service-total">
        <span>{paymentLabels[paymentMethod]}</span>
        <strong>Total servicio {money(serviceAmount)}</strong>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {clientPickerOpen ? (
        <ClientPickerModal
          clients={clients}
          allVisits={allVisits}
          selectedClientName={appointment.clientName}
          eyebrow="Clienta del servicio"
          title="Buscar clienta"
          onSelect={(_, name) => update('clientName', name)}
          onClear={() => update('clientName', '')}
          onClose={() => setClientPickerOpen(false)}
        />
      ) : null}
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="admin-primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar servicio'}
        </button>
      </div>
    </form>
  )
}

function StylistForm({
  initial,
  onClose,
}: {
  initial: Stylist
  onClose: () => void
}) {
  const [stylist, setStylist] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const update = <K extends keyof Stylist>(key: K, value: Stylist[K]) =>
    setStylist((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveStylist({
        ...stylist,
        searchText: normalizeText(
          `${stylist.name} ${stylist.role} ${stylist.phone} ${stylist.email}`,
        ),
      })
      onClose()
    } catch {
      setError('No fue posible guardar la ficha de la estilista.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor finance-stylist-editor" onSubmit={handleSubmit}>
      <div className="admin-editor-head">
        <div>
          <p>{stylist.id ? 'Editar estilista' : 'Nueva estilista'}</p>
          <h2>{stylist.name || 'Ficha de estilista'}</h2>
        </div>
        <button className="admin-text-button" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="admin-form-grid">
        <label>
          Nombre
          <input
            value={stylist.name}
            onChange={(event) => update('name', event.target.value)}
            maxLength={120}
            required
          />
        </label>
        <label>
          Rol
          <input
            value={stylist.role}
            onChange={(event) => update('role', event.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Frecuencia de pago
          <select
            value={stylist.paymentFrequency}
            onChange={(event) =>
              update(
                'paymentFrequency',
                event.target.value as StylistPaymentFrequency,
              )
            }
          >
            <option value="monthly">Mensual</option>
            <option value="weekly">Semanal</option>
          </select>
        </label>
        <label>
          Telefono
          <input
            value={stylist.phone}
            onChange={(event) => update('phone', event.target.value)}
            maxLength={40}
          />
        </label>
        <label>
          Correo
          <input
            type="email"
            value={stylist.email}
            onChange={(event) => update('email', event.target.value)}
            maxLength={160}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={stylist.active}
            onChange={(event) => update('active', event.target.checked)}
          />
          Activa
        </label>
        <label className="is-wide">
          Notas
          <textarea
            value={stylist.notes}
            onChange={(event) => update('notes', event.target.value)}
            maxLength={1000}
          />
        </label>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="admin-primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar estilista'}
        </button>
      </div>
    </form>
  )
}

export default function AppointmentsPanel({
  appointments,
  clients,
  allVisits,
  stylists,
}: AppointmentsPanelProps) {
  const [view, setView] = useState<FinanceView>('summary')
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7),
  )
  const [draft, setDraft] = useState<AppointmentRecord | null>(null)
  const [stylistDraft, setStylistDraft] = useState<Stylist | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  )
  const { confirm, confirmDialog } = useAdminConfirm()

  const stylistOptions = useMemo(() => {
    const options = new Map<string, StylistOption>()
    stylists.forEach((stylist) => {
      const key = normalizeName(stylist.name)
      if (!key) return
      options.set(key, {
        id: stylist.id,
        key,
        name: stylist.name,
        role: stylist.role,
        paymentFrequency: stylist.paymentFrequency,
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
            role: 'Estilista',
            paymentFrequency: 'monthly',
            active: true,
            fromHistory: true,
          })
        }
      })
    })
    return [...options.values()]
      .filter((stylist) => stylist.active)
      .sort((first, second) => first.name.localeCompare(second.name, 'es'))
  }, [appointments, stylists])

  const selectedStylistOption = selectedStylist
    ? stylistOptions.find((stylist) => stylist.key === selectedStylist)
    : null

  const monthOptions = useMemo(
    () =>
      [...new Set(appointments.map((item) => item.date.slice(0, 7)).filter(Boolean))]
        .sort()
        .reverse(),
    [appointments],
  )

  const yearOptions = useMemo(
    () =>
      [...new Set(appointments.map((item) => item.date.slice(0, 4)).filter(Boolean))]
        .sort()
        .reverse(),
    [appointments],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return appointments
      .filter((appointment) => {
        const haystack = normalizeText(
          [
            appointment.clientName,
            appointment.service,
            appointment.stylist,
            appointment.productClientName,
            appointment.productName,
            appointment.productStylist,
            appointment.serviceReceipt,
            appointment.productReceipt,
          ].join(' '),
        )
        return (
          (!normalizedQuery || haystack.includes(normalizedQuery)) &&
          (!month || appointment.date.startsWith(month))
        )
      })
      .sort((first, second) => second.date.localeCompare(first.date))
  }, [appointments, month, query])

  const metrics = useMemo(
    () =>
      filtered.reduce(
        (totals, appointment) => ({
          deposits: totals.deposits + appointment.depositAmount,
          products: totals.products + productTotal(appointment),
          records: totals.records + 1,
          services: totals.services + serviceTotal(appointment),
          total: totals.total + appointmentTotal(appointment),
        }),
        { deposits: 0, products: 0, records: 0, services: 0, total: 0 },
      ),
    [filtered],
  )

  const stylistTotals = useMemo(() => {
    const totals = new Map<string, StylistContribution & { option: StylistOption }>()
    stylistOptions.forEach((stylist) =>
      totals.set(stylist.key, { ...emptyContribution(), option: stylist }),
    )
    filtered.forEach((appointment) => {
      stylistOptions.forEach((stylist) => {
        const row = totals.get(stylist.key)
        if (!row) return
        addContribution(row, stylistContribution(appointment, stylist.key))
      })
    })
    return [...totals.values()]
      .filter((row) => row.total || !row.option.fromHistory)
      .sort((first, second) => second.total - first.total)
  }, [filtered, stylistOptions])

  const monthlyTotals = useMemo(() => {
    const totals = new Map<string, number>()
    appointments.forEach((appointment) => {
      const key = appointment.date.slice(0, 7)
      totals.set(key, (totals.get(key) || 0) + appointmentTotal(appointment))
    })
    return [...totals.entries()].sort((first, second) =>
      first[0].localeCompare(second[0]),
    )
  }, [appointments])

  const calendarTotals = useMemo(() => {
    const totals = new Map<string, StylistContribution>()
    filtered.forEach((appointment) => {
      const row = totals.get(appointment.date) || emptyContribution()
      row.services += serviceTotal(appointment)
      row.products += productTotal(appointment)
      row.total += appointmentTotal(appointment)
      row.records += 1
      totals.set(appointment.date, row)
    })
    return totals
  }, [filtered])

  const selectedStylistRecords = useMemo(() => {
    if (!selectedStylist) return []
    return appointments
      .filter(
        (appointment) =>
          appointment.date.startsWith(selectedYear) &&
          (normalizeName(appointment.stylist) === selectedStylist ||
            normalizeName(appointment.productStylist) === selectedStylist),
      )
      .sort((first, second) => second.date.localeCompare(first.date))
  }, [appointments, selectedStylist, selectedYear])

  const selectedStylistMetrics = useMemo(
    () =>
      selectedStylistRecords.reduce((totals, appointment) => {
        if (!selectedStylist) return totals
        addContribution(totals, stylistContribution(appointment, selectedStylist))
        return totals
      }, emptyContribution()),
    [selectedStylist, selectedStylistRecords],
  )

  const selectedStylistMonthly = useMemo(() => {
    const totals = new Map<string, StylistContribution>()
    selectedStylistRecords.forEach((appointment) => {
      if (!selectedStylist) return
      const key = appointment.date.slice(0, 7)
      const row = totals.get(key) || emptyContribution()
      addContribution(row, stylistContribution(appointment, selectedStylist))
      totals.set(key, row)
    })
    return [...totals.entries()].sort((first, second) =>
      first[0].localeCompare(second[0]),
    )
  }, [selectedStylist, selectedStylistRecords])

  const selectedStylistDays = useMemo(() => {
    const days = new Map<
      string,
      { totals: StylistContribution; items: AppointmentRecord[] }
    >()
    selectedStylistRecords.forEach((appointment) => {
      if (!selectedStylist) return
      const row = days.get(appointment.date) || {
        totals: emptyContribution(),
        items: [],
      }
      addContribution(row.totals, stylistContribution(appointment, selectedStylist))
      row.items.push(appointment)
      days.set(appointment.date, row)
    })
    return [...days.entries()].sort((first, second) =>
      second[0].localeCompare(first[0]),
    )
  }, [selectedStylist, selectedStylistRecords])

  const paymentPeriods = useMemo(() => {
    if (!selectedStylist || !selectedStylistOption) return []
    const periods = new Map<string, { label: string; totals: StylistContribution }>()
    selectedStylistRecords.forEach((appointment) => {
      const period =
        selectedStylistOption.paymentFrequency === 'weekly'
          ? weekPeriod(appointment.date)
          : {
              key: appointment.date.slice(0, 7),
              label: monthLabel(appointment.date.slice(0, 7)),
            }
      const row = periods.get(period.key) || {
        label: period.label,
        totals: emptyContribution(),
      }
      addContribution(row.totals, stylistContribution(appointment, selectedStylist))
      periods.set(period.key, row)
    })
    return [...periods.entries()].sort((first, second) =>
      second[0].localeCompare(first[0]),
    )
  }, [selectedStylist, selectedStylistOption, selectedStylistRecords])

  const selectedStylistCalendar = useMemo(() => {
    const totals = new Map<string, StylistContribution>()
    selectedStylistRecords
      .filter((appointment) => appointment.date.startsWith(month))
      .forEach((appointment) => {
        if (!selectedStylist) return
        const row = totals.get(appointment.date) || emptyContribution()
        addContribution(row, stylistContribution(appointment, selectedStylist))
        totals.set(appointment.date, row)
      })
    return totals
  }, [month, selectedStylist, selectedStylistRecords])

  const recordsByDate = useMemo(() => {
    const groups = new Map<string, AppointmentRecord[]>()
    filtered.forEach((appointment) => {
      const items = groups.get(appointment.date) || []
      items.push(appointment)
      groups.set(appointment.date, items)
    })
    return [...groups.entries()]
  }, [filtered])

  if (draft) {
    return (
      <ServiceForm
        initial={draft}
        clients={clients}
        allVisits={allVisits}
        stylistOptions={stylistOptions}
        onClose={() => setDraft(null)}
      />
    )
  }

  if (stylistDraft) {
    return (
      <StylistForm
        initial={stylistDraft}
        onClose={() => setStylistDraft(null)}
      />
    )
  }

  const maxMonth = Math.max(...monthlyTotals.map((item) => item[1]), 1)
  const maxStylist = Math.max(...stylistTotals.map((item) => item.total), 1)
  const maxCalendar = Math.max(...[...calendarTotals.values()].map((item) => item.total), 1)
  const maxStylistMonth = Math.max(
    ...selectedStylistMonthly.map((item) => item[1].total),
    1,
  )
  const maxStylistDay = Math.max(
    ...selectedStylistDays.map((item) => item[1].totals.total),
    1,
  )

  if (selectedStylist && selectedStylistOption) {
    const calendarMax = Math.max(
      ...[...selectedStylistCalendar.values()].map((item) => item.total),
      1,
    )
    return (
      <div className="finance-view">
        <section className="finance-stylist-profile">
          <div>
            <p>Ficha financiera</p>
            <h2>{selectedStylistOption.name}</h2>
            <span>
              Pago {selectedStylistOption.paymentFrequency === 'weekly' ? 'semanal' : 'mensual'} · {selectedYear}
            </span>
          </div>
          <div className="finance-hero-actions">
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {yearOptions.map((year) => (
                <option value={year} key={year}>{year}</option>
              ))}
            </select>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => {
                const original = stylists.find(
                  (stylist) => normalizeName(stylist.name) === selectedStylist,
                )
                if (original) setStylistDraft(original)
              }}
              disabled={selectedStylistOption.fromHistory}
            >
              Editar ficha
            </button>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => setSelectedStylist(null)}
            >
              Volver
            </button>
          </div>
        </section>

        <div className="finance-metrics">
          <article><span>Total anual</span><strong>{money(selectedStylistMetrics.total)}</strong></article>
          <article><span>Servicios</span><strong>{money(selectedStylistMetrics.services)}</strong></article>
          <article><span>Venta productos</span><strong>{money(selectedStylistMetrics.products)}</strong></article>
          <article><span>Dias activos</span><strong>{selectedStylistDays.length}</strong></article>
        </div>

        <div className="finance-stylist-grid">
          <section className="admin-content-card finance-payments-card">
            <div className="admin-card-heading">
              <div><p>Pagos</p><h2>Periodos de pago</h2></div>
            </div>
            {paymentPeriods.map(([key, period]) => (
              <article key={key}>
                <div>
                  <strong>{period.label}</strong>
                  <span>
                    Servicios {money(period.totals.services)} · Productos {money(period.totals.products)}
                  </span>
                </div>
                <b>{money(period.totals.total)}</b>
              </article>
            ))}
            {!paymentPeriods.length ? <p className="admin-empty-copy">Sin pagos calculados para este año.</p> : null}
          </section>

          <section className="admin-content-card finance-calendar-card">
            <div className="admin-card-heading">
              <div><p>Calendario</p><h2>{monthLabel(month)}</h2></div>
              <select value={month} onChange={(event) => setMonth(event.target.value)}>
                {monthOptions.map((item) => (
                  <option value={item} key={item}>{monthLabel(item)}</option>
                ))}
              </select>
            </div>
            <div className="finance-calendar-weekdays">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="finance-calendar-grid">
              {monthDays(month).map((date, index) => {
                const total = date ? selectedStylistCalendar.get(date)?.total || 0 : 0
                return (
                  <div
                    className={total ? 'has-money' : ''}
                    key={date || `empty-${index}`}
                    style={{
                      backgroundColor: total
                        ? `rgba(143, 109, 90, ${Math.max(total / calendarMax, 0.12)})`
                        : undefined,
                    }}
                  >
                    {date ? <span>{Number(date.slice(-2))}</span> : null}
                    {total ? <strong>{money(total)}</strong> : null}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <section className="admin-content-card finance-month-card">
          <div className="admin-card-heading">
            <div><p>Mensual</p><h2>Ganancias por mes</h2></div>
          </div>
          <div className="finance-month-list">
            {selectedStylistMonthly.map(([key, totals]) => (
              <article key={key}>
                <div>
                  <strong>{monthLabel(key)}</strong>
                  <span>Servicios {money(totals.services)} · Productos {money(totals.products)}</span>
                </div>
                <b>{money(totals.total)}</b>
                <i style={{ width: `${(totals.total / maxStylistMonth) * 100}%` }} />
              </article>
            ))}
          </div>
        </section>

        <section className="admin-content-card finance-day-card">
          <div className="admin-card-heading">
            <div><p>Diario</p><h2>Detalle diario</h2></div>
          </div>
          <div className="finance-day-list">
            {selectedStylistDays.map(([date, group]) => (
              <article key={date}>
                <div className="finance-day-head">
                  <div>
                    <strong>{dateLabel(date)}</strong>
                    <span>Servicios {money(group.totals.services)} · Productos {money(group.totals.products)}</span>
                  </div>
                  <b>{money(group.totals.total)}</b>
                  <i style={{ width: `${(group.totals.total / maxStylistDay) * 100}%` }} />
                </div>
                <div className="finance-day-items">
                  {group.items.map((appointment) => {
                    const serviceMatches =
                      normalizeName(appointment.stylist) === selectedStylist
                    const productMatches =
                      normalizeName(appointment.productStylist) === selectedStylist
                    const total =
                      (serviceMatches ? serviceTotal(appointment) : 0) +
                      (productMatches ? productTotal(appointment) : 0)
                    return (
                      <div key={appointment.id || appointment.sourceId}>
                        <div>
                          <strong>
                            {serviceMatches
                              ? appointment.clientName || 'Servicio sin clienta'
                              : appointment.productClientName || 'Venta de producto'}
                          </strong>
                          <span>
                            {serviceMatches ? appointment.service || 'Servicio' : ''}
                            {serviceMatches && productMatches ? ' · ' : ''}
                            {productMatches ? appointment.productName || 'Producto' : ''}
                          </span>
                        </div>
                        <b>{money(total)}</b>
                        {serviceMatches ? (
                          <button type="button" onClick={() => setDraft(appointment)}>
                            Editar
                          </button>
                        ) : (
                          <small>Inventario</small>
                        )}
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
            {!selectedStylistDays.length ? (
              <div className="admin-empty-state">
                <h3>Sin registros</h3>
                <p>No hay servicios o ventas para esta estilista en el año seleccionado.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="finance-view">
      {confirmDialog}
      <section className="finance-hero">
        <div>
          <p>Finanzas</p>
          <h2>{money(metrics.total)}</h2>
          <span>
            Servicios {money(metrics.services)} · Productos {money(metrics.products)}
          </span>
        </div>
        <div className="finance-hero-actions">
          <AdminButton
            variant="primary"
            icon={Plus}
            type="button"
            onClick={() => setDraft(emptyAppointment())}
          >
            Registrar servicio
          </AdminButton>
          <AdminButton
            icon={UserPlus}
            type="button"
            onClick={() => setStylistDraft(emptyStylist())}
          >
            Nueva estilista
          </AdminButton>
        </div>
      </section>

      <div className="finance-toolbar">
        <span className="admin-search-control">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar clienta, servicio, producto, estilista o boleta"
          />
        </span>
        <select value={month} onChange={(event) => setMonth(event.target.value)}>
          {monthOptions.map((item) => (
            <option value={item} key={item}>{monthLabel(item)}</option>
          ))}
        </select>
        <div className="finance-view-toggle">
          {([
            ['summary', 'Resumen', ChartNoAxesCombined],
            ['stylists', 'Estilistas', UsersRound],
            ['calendar', 'Calendario', CalendarDays],
            ['records', 'Registros', ListChecks],
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

      <div className="finance-metrics">
        <article><span>Total mes</span><strong>{money(metrics.total)}</strong></article>
        <article><span>Servicios</span><strong>{money(metrics.services)}</strong></article>
        <article><span>Productos</span><strong>{money(metrics.products)}</strong></article>
        <article><span>Abonos</span><strong>{money(metrics.deposits)}</strong></article>
      </div>

      {view === 'summary' ? (
        <div className="finance-summary-grid">
          <section className="admin-content-card finance-chart-card">
            <div className="admin-card-heading">
              <div><p>Anual</p><h2>Recaudacion por mes</h2></div>
            </div>
            <div className="appointment-column-chart">
              {monthlyTotals.map(([key, total]) => (
                <div key={key}>
                  <i style={{ height: `${Math.max((total / maxMonth) * 100, 4)}%` }} />
                  <span>{monthLabel(key).slice(0, 3)}</span>
                  <strong>{money(total)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-content-card finance-team-preview">
            <div className="admin-card-heading">
              <div><p>Equipo</p><h2>Fichas financieras</h2></div>
              <button className="admin-secondary-button" type="button" onClick={() => setView('stylists')}>
                Ver equipo
              </button>
            </div>
            {stylistTotals.slice(0, 6).map((item) => (
              <button
                className="finance-stylist-row"
                type="button"
                key={item.option.key}
                onClick={() => {
                  setSelectedStylist(item.option.key)
                  setSelectedYear(yearOptions[0] || selectedYear)
                }}
              >
                <div>
                  <strong>{item.option.name}</strong>
                  <span>Servicios {money(item.services)} · Productos {money(item.products)}</span>
                </div>
                <b>{money(item.total)}</b>
                <i style={{ width: `${(item.total / maxStylist) * 100}%` }} />
              </button>
            ))}
          </section>
        </div>
      ) : null}

      {view === 'stylists' ? (
        <section className="admin-content-card finance-stylists-board">
          <div className="admin-card-heading">
            <div><p>Equipo</p><h2>{stylistTotals.length} fichas de estilistas</h2></div>
            <button
              className="admin-primary-button"
              type="button"
              onClick={() => setStylistDraft(emptyStylist())}
            >
              Nueva estilista
            </button>
          </div>
          <div className="finance-stylist-cards">
            {stylistTotals.map((item) => (
              <article key={item.option.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStylist(item.option.key)
                    setSelectedYear(yearOptions[0] || selectedYear)
                  }}
                >
                  <span>{item.option.role}</span>
                  <strong>{item.option.name}</strong>
                  <small>
                    Pago {item.option.paymentFrequency === 'weekly' ? 'semanal' : 'mensual'}
                    {item.option.fromHistory ? ' · historico' : ''}
                  </small>
                  <b>{money(item.total)}</b>
                </button>
                {!item.option.fromHistory ? (
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        const original = stylists.find(
                          (stylist) => normalizeName(stylist.name) === item.option.key,
                        )
                        if (original) setStylistDraft(original)
                      }}
                    >
                      <Pencil size={17} aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const original = stylists.find(
                          (stylist) => normalizeName(stylist.name) === item.option.key,
                        )
                        if (!original) return
                        const accepted = await confirm({
                          title: `Archivar ficha de ${original.name}`,
                          description: 'La estilista dejará de aparecer entre las opciones activas, pero sus registros se conservarán.',
                          confirmLabel: 'Archivar ficha',
                        })
                        if (accepted) void removeStylist(original)
                      }}
                    >
                      <Archive size={17} aria-hidden="true" /> Archivar
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === 'calendar' ? (
        <section className="admin-content-card finance-calendar-card">
          <div className="admin-card-heading">
            <div><p>Calendario</p><h2>{monthLabel(month)}</h2></div>
          </div>
          <div className="finance-calendar-weekdays">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="finance-calendar-grid">
            {monthDays(month).map((date, index) => {
              const total = date ? calendarTotals.get(date)?.total || 0 : 0
              return (
                <div
                  className={total ? 'has-money' : ''}
                  key={date || `empty-${index}`}
                  style={{
                    backgroundColor: total
                      ? `rgba(143, 109, 90, ${Math.max(total / maxCalendar, 0.12)})`
                      : undefined,
                  }}
                >
                  {date ? <span>{Number(date.slice(-2))}</span> : null}
                  {total ? <strong>{money(total)}</strong> : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {view === 'records' ? (
        <section className="admin-content-card appointment-records-card">
          <div className="admin-card-heading">
            <div><p>Registro</p><h2>{filtered.length} movimientos del mes</h2></div>
          </div>
          {recordsByDate.map(([date, items]) => (
            <div className="appointment-day-group" key={date}>
              <div className="appointment-day-heading">
                <strong>{dateLabel(date)}</strong>
                <span>{money(items.reduce((total, item) => total + appointmentTotal(item), 0))}</span>
              </div>
              <div className="appointment-table">
                {items.map((appointment) => {
                  const hasService = serviceTotal(appointment) > 0 || appointment.service
                  return (
                    <article key={appointment.id || appointment.sourceId}>
                      <div>
                        <span>{appointment.depositAmount ? money(appointment.depositAmount) : '-'}</span>
                        <small>{hasService ? 'Servicio' : 'Producto'}</small>
                      </div>
                      <div>
                        <strong>{hasService ? appointment.stylist || '-' : appointment.productStylist || '-'}</strong>
                        <span>{appointment.clientName || appointment.productClientName || '-'}</span>
                      </div>
                      <div>
                        <strong>{hasService ? appointment.service || '-' : appointment.productName || '-'}</strong>
                        <span>{money(hasService ? serviceTotal(appointment) : productTotal(appointment))}</span>
                      </div>
                      <div>
                        <strong>{appointment.serviceReceipt || appointment.productReceipt || '-'}</strong>
                        <span>{appointment.notes || '-'}</span>
                      </div>
                      <b>{money(appointmentTotal(appointment))}</b>
                      <div className="admin-row-actions">
                        {hasService ? (
                          <button type="button" onClick={() => setDraft(appointment)}>
                            <Pencil size={17} aria-hidden="true" /> Editar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={async () => {
                            const accepted = await confirm({
                              title: 'Eliminar movimiento financiero',
                              description: `Se eliminará el registro asociado a ${appointment.clientName || appointment.productClientName || 'esta clienta'}.`,
                              confirmLabel: 'Eliminar movimiento',
                            })
                            if (accepted) void removeAppointment(appointment)
                          }}
                        >
                          <Trash2 size={17} aria-hidden="true" /> Eliminar
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
          {!recordsByDate.length ? (
            <div className="admin-empty-state">
              <h3>Sin movimientos</h3>
              <p>Registra un servicio o una venta desde inventario para comenzar.</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
