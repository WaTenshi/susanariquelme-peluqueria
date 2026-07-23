import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  AtSign,
  CalendarPlus,
  Cake,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  Star,
  Trash2,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import {
  removeClient,
  removeClientVisit,
  saveClient,
  saveClientVisit,
  subscribeToClientVisits,
} from './firebase'
import type { Client, ClientVisit } from './types'
import { AdminButton } from './admin-ui'
import { useAdminConfirm } from './admin-confirm'

const emptyClient = (): Client => ({
  firstName: '',
  paternalSurname: '',
  maternalSurname: '',
  phone: '',
  birthday: '',
  commune: '',
  email: '',
  instagram: '',
  vip: false,
  notes: '',
  active: true,
  searchText: '',
})

const emptyVisit = (clientId: string): ClientVisit => ({
  clientId,
  date: new Date().toISOString().slice(0, 10),
  service: '',
  colorFormula: '',
  stylist: '',
  notes: '',
  amount: '',
})

const clientName = (client: Client) =>
  [client.firstName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ')

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const communes = [
  'Alto Biobío',
  'Antuco',
  'Arauco',
  'Cabrero',
  'Cañete',
  'Chiguayante',
  'Concepción',
  'Contulmo',
  'Coronel',
  'Curanilahue',
  'Florida',
  'Hualpén',
  'Hualqui',
  'Laja',
  'Lebu',
  'Los Álamos',
  'Los Ángeles',
  'Lota',
  'Mulchén',
  'Nacimiento',
  'Negrete',
  'Penco',
  'Quilaco',
  'Quilleco',
  'San Pedro de la Paz',
  'San Rosendo',
  'Santa Bárbara',
  'Santa Juana',
  'Talcahuano',
  'Tirúa',
  'Tomé',
  'Tucapel',
  'Yumbel',
]

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const toIsoBirthday = (value: string) => {
  if (isIsoDate(value)) return value
  const match = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!match) return ''
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

const formatBirthday = (value: string) => {
  if (!isIsoDate(value)) return value
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

const spanishMonths: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

const parseVisitDate = (value: string) => {
  const clean = normalizeText(value.trim())
  if (!clean) return 0
  if (isIsoDate(clean)) return new Date(`${clean}T12:00:00`).getTime()

  const numeric = clean.match(/^(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?$/)
  if (numeric) {
    const yearText = numeric[3]
    const year = yearText
      ? Number(yearText.length === 2 ? `20${yearText}` : yearText)
      : 2000
    return new Date(year, Number(numeric[2]) - 1, Number(numeric[1])).getTime()
  }

  const written = clean.match(
    /^(\d{1,2})(?:\s+de)?\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{2,4}))?$/,
  )
  if (written) {
    const yearText = written[3]
    const year = yearText
      ? Number(yearText.length === 2 ? `20${yearText}` : yearText)
      : 2000
    return new Date(year, spanishMonths[written[2]], Number(written[1])).getTime()
  }

  return 0
}

type ClientFormProps = {
  initial: Client
  onClose: () => void
  onSaved: () => void
}

function ClientForm({ initial, onClose, onSaved }: ClientFormProps) {
  const [client, setClient] = useState(initial)
  const [birthdayDate, setBirthdayDate] = useState(() =>
    toIsoBirthday(initial.birthday),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const update = <K extends keyof Client>(key: K, value: Client[K]) =>
    setClient((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      const searchText = normalizeText(
        [
          client.firstName,
          client.paternalSurname,
          client.maternalSurname,
          client.phone,
          client.email,
          client.commune,
        ].join(' '),
      )
      await saveClient({ ...client, birthday: birthdayDate, searchText })
      onSaved()
    } catch {
      setError('No fue posible guardar la ficha. Intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="admin-editor client-editor" onSubmit={handleSubmit}>
      <div className="admin-editor-head">
        <div>
          <p>{client.id ? 'Editar ficha' : 'Nueva clienta'}</p>
          <h2>{client.id ? clientName(client) : 'Crear ficha de clienta'}</h2>
        </div>
        <button className="admin-text-button" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="admin-form-grid">
        <label>
          Nombre
          <input
            value={client.firstName}
            onChange={(event) => update('firstName', event.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label>
          Apellido paterno
          <input
            value={client.paternalSurname}
            onChange={(event) => update('paternalSurname', event.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Apellido materno
          <input
            value={client.maternalSurname}
            onChange={(event) => update('maternalSurname', event.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Teléfono
          <input
            value={client.phone}
            onChange={(event) => update('phone', event.target.value)}
            inputMode="tel"
            maxLength={40}
          />
        </label>
        <label>
          Cumpleaños
          <input
            type="date"
            value={birthdayDate}
            onChange={(event) => setBirthdayDate(event.target.value)}
            required
          />
          {client.id && client.birthday && !toIsoBirthday(client.birthday) ? (
            <small className="legacy-field-note">
              Valor anterior: {client.birthday}. Selecciona la fecha correcta para
              guardar la edición.
            </small>
          ) : null}
        </label>
        <label>
          Comuna
          <select
            value={client.commune}
            onChange={(event) => update('commune', event.target.value)}
            required
          >
            <option value="">Seleccionar comuna</option>
            {client.commune && !communes.includes(client.commune) ? (
              <option value={client.commune}>{client.commune}</option>
            ) : null}
            {communes.map((commune) => (
              <option value={commune} key={commune}>{commune}</option>
            ))}
          </select>
        </label>
        <label>
          Correo
          <input
            type="email"
            value={client.email}
            onChange={(event) => update('email', event.target.value)}
            maxLength={160}
          />
        </label>
        <label>
          Instagram
          <input
            value={client.instagram}
            onChange={(event) => update('instagram', event.target.value)}
            placeholder="@usuario"
            maxLength={100}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={client.vip}
            onChange={(event) => update('vip', event.target.checked)}
          />
          Clienta VIP
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={client.active}
            onChange={(event) => update('active', event.target.checked)}
          />
          Ficha activa
        </label>
        <label className="is-wide">
          Observaciones generales
          <textarea
            value={client.notes}
            onChange={(event) => update('notes', event.target.value)}
            maxLength={3000}
            placeholder="Preferencias, alergias informadas o antecedentes relevantes."
          />
        </label>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="admin-primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar ficha'}
        </button>
      </div>
    </form>
  )
}

type VisitFormProps = {
  initial: ClientVisit
  client: Client
  onClose: () => void
}

function VisitForm({ initial, client, onClose }: VisitFormProps) {
  const [visit, setVisit] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const update = <K extends keyof ClientVisit>(key: K, value: ClientVisit[K]) =>
    setVisit((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await saveClientVisit(visit, clientName(client))
      onClose()
    } catch {
      setError('No fue posible guardar la atención.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="client-visit-form" onSubmit={handleSubmit}>
      <div className="admin-editor-head">
        <div>
          <p>{visit.id ? 'Editar atención' : 'Nueva atención'}</p>
          <h2>{clientName(client)}</h2>
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
            value={visit.date}
            onChange={(event) => update('date', event.target.value)}
            required
          />
        </label>
        <label>
          Estilista
          <input
            value={visit.stylist}
            onChange={(event) => update('stylist', event.target.value)}
            maxLength={100}
          />
        </label>
        <label className="is-wide">
          Servicio
          <input
            value={visit.service}
            onChange={(event) => update('service', event.target.value)}
            maxLength={300}
            required
          />
        </label>
        <label className="is-wide">
          Fórmula / colorimetría
          <textarea
            value={visit.colorFormula}
            onChange={(event) => update('colorFormula', event.target.value)}
            maxLength={2000}
            placeholder="Tonos, gramos, oxidante y procedimiento."
          />
        </label>
        <label>
          Valor
          <input
            value={visit.amount}
            onChange={(event) => update('amount', event.target.value)}
            placeholder="$45.000"
            maxLength={100}
          />
        </label>
        <label className="is-wide">
          Notas de la atención
          <textarea
            value={visit.notes}
            onChange={(event) => update('notes', event.target.value)}
            maxLength={2000}
          />
        </label>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-form-actions">
        <button className="admin-secondary-button" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="admin-primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar atención'}
        </button>
      </div>
    </form>
  )
}

type ClientFilter = 'all' | 'vip' | 'recent' | 'oldest'

export default function ClientsPanel({
  clients,
  allVisits,
}: {
  clients: Client[]
  allVisits: ClientVisit[]
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id || null)
  const [clientDraft, setClientDraft] = useState<Client | null>(null)
  const [visitDraft, setVisitDraft] = useState<ClientVisit | null>(null)
  const [visitState, setVisitState] = useState<{
    clientId: string
    items: ClientVisit[]
  }>({ clientId: '', items: [] })
  const { confirm, confirmDialog } = useAdminConfirm()

  const lastVisitByClient = useMemo(() => {
    const dates = new Map<string, number>()
    allVisits.forEach((visit) => {
      const date = parseVisitDate(visit.date)
      if (date > (dates.get(visit.clientId) || 0)) {
        dates.set(visit.clientId, date)
      }
    })
    return dates
  }, [allVisits])

  const filteredClients = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())
    const matches = clients.filter(
      (client) =>
        (!normalizedQuery || client.searchText.includes(normalizedQuery)) &&
        (filter !== 'vip' || client.vip),
    )

    if (filter === 'recent' || filter === 'oldest') {
      return [...matches].sort((first, second) => {
        const firstDate = lastVisitByClient.get(first.id || '') || 0
        const secondDate = lastVisitByClient.get(second.id || '') || 0
        return filter === 'recent'
          ? secondDate - firstDate
          : firstDate - secondDate
      })
    }

    return matches
  }, [clients, filter, lastVisitByClient, query])

  const selectedClient =
    filteredClients.find((client) => client.id === selectedId) ||
    filteredClients[0]
  const visits =
    selectedClient?.id === visitState.clientId ? visitState.items : []

  useEffect(() => {
    if (!selectedClient?.id) return
    const clientId = selectedClient.id
    return subscribeToClientVisits(clientId, (items) =>
      setVisitState({ clientId, items }),
    )
  }, [selectedClient?.id])

  if (clientDraft) {
    return (
      <ClientForm
        initial={clientDraft}
        onClose={() => setClientDraft(null)}
        onSaved={() => setClientDraft(null)}
      />
    )
  }

  if (visitDraft && selectedClient) {
    return (
      <VisitForm
        initial={visitDraft}
        client={selectedClient}
        onClose={() => setVisitDraft(null)}
      />
    )
  }

  return (
    <div className="clients-layout">
      {confirmDialog}
      <section className="clients-directory" data-tour="clients-directory">
        <div className="admin-card-heading">
          <div>
            <p>Directorio privado</p>
            <h2>{clients.length} clientas</h2>
          </div>
          <AdminButton
            data-tour="clients-create"
            variant="primary"
            icon={UserPlus}
            type="button"
            onClick={() => setClientDraft(emptyClient())}
          >
            Nueva clienta
          </AdminButton>
        </div>
        <label className="clients-search" data-tour="clients-search">
          <span>Buscar clienta</span>
          <span className="admin-search-control">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, teléfono, correo o comuna"
            />
          </span>
        </label>
        <div className="clients-filters" data-tour="clients-filters" aria-label="Filtros de clientas">
          {([
            ['all', 'Todas', UsersRound],
            ['vip', 'VIP', Star],
            ['recent', 'Más recientes', ArrowDownAZ],
            ['oldest', 'Menos recientes', ArrowUpAZ],
          ] as const).map(([value, label, FilterIcon]) => (
            <button
              className={filter === value ? 'is-active' : ''}
              type="button"
              onClick={() => setFilter(value)}
              key={value}
            >
              <FilterIcon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <div className="clients-list" data-tour="clients-list">
          {filteredClients.map((client) => (
            <button
              className={selectedClient?.id === client.id ? 'is-active' : ''}
              type="button"
              onClick={() => setSelectedId(client.id || null)}
              key={client.id}
            >
              <span>{client.firstName.slice(0, 1)}{client.paternalSurname.slice(0, 1)}</span>
              <div>
                <strong>{clientName(client)}</strong>
                <small>{client.phone || client.commune || 'Sin contacto registrado'}</small>
                {lastVisitByClient.get(client.id || '') ? (
                  <small className="client-last-visit">
                    Última atención:{' '}
                    {new Intl.DateTimeFormat('es-CL', {
                      dateStyle: 'medium',
                    }).format(
                      new Date(lastVisitByClient.get(client.id || '') || 0),
                    )}
                  </small>
                ) : null}
              </div>
              {client.vip ? <i>VIP</i> : null}
            </button>
          ))}
          {!filteredClients.length ? (
            <p className="admin-empty-copy">No hay coincidencias.</p>
          ) : null}
        </div>
      </section>

      <section className="client-profile" data-tour="client-profile">
        {selectedClient ? (
          <>
            <div className="client-profile-header">
              <div>
                <p>{selectedClient.vip ? 'Clienta VIP' : 'Ficha de clienta'}</p>
                <h2>{clientName(selectedClient)}</h2>
                <span>{selectedClient.active ? 'Ficha activa' : 'Ficha archivada'}</span>
              </div>
              <div className="client-profile-actions" data-tour="client-profile-actions">
                <AdminButton
                  icon={Pencil}
                  type="button"
                  onClick={() => setClientDraft(selectedClient)}
                >
                  Editar ficha
                </AdminButton>
                <AdminButton
                  variant="primary"
                  icon={CalendarPlus}
                  type="button"
                  onClick={() =>
                    selectedClient.id &&
                    setVisitDraft(emptyVisit(selectedClient.id))
                  }
                >
                  Nueva atención
                </AdminButton>
              </div>
            </div>
            <div className="client-contact-grid" data-tour="client-contact">
              <div><span><Phone size={16} aria-hidden="true" /> Teléfono</span><strong>{selectedClient.phone || 'Sin información'}</strong></div>
              <div><span><Cake size={16} aria-hidden="true" /> Cumpleaños</span><strong>{selectedClient.birthday ? formatBirthday(selectedClient.birthday) : 'Sin información'}</strong></div>
              <div><span><MapPin size={16} aria-hidden="true" /> Comuna</span><strong>{selectedClient.commune || 'Sin información'}</strong></div>
              <div><span><Mail size={16} aria-hidden="true" /> Correo</span><strong>{selectedClient.email || 'Sin información'}</strong></div>
              <div><span><AtSign size={16} aria-hidden="true" /> Instagram</span><strong>{selectedClient.instagram || 'Sin información'}</strong></div>
            </div>
            {selectedClient.notes ? (
              <div className="client-general-notes">
                <span>Observaciones generales</span>
                <p>{selectedClient.notes}</p>
              </div>
            ) : null}
            <div className="client-history-heading">
              <div>
                <p>Historial técnico</p>
                <h3>{visits.length} atenciones registradas</h3>
              </div>
            </div>
            <div className="client-visits" data-tour="client-history">
              {visits.map((visit) => (
                <article key={visit.id}>
                  <div className="client-visit-date">
                    <span>{visit.date || 'Sin fecha'}</span>
                    <small>{visit.stylist || 'Sin estilista'}</small>
                  </div>
                  <div className="client-visit-content">
                    <h4>{visit.service || 'Atención sin servicio indicado'}</h4>
                    {visit.colorFormula ? (
                      <p><strong>Fórmula:</strong> {visit.colorFormula}</p>
                    ) : null}
                    {visit.notes ? <p>{visit.notes}</p> : null}
                    {visit.amount ? <b>{visit.amount}</b> : null}
                  </div>
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => setVisitDraft(visit)}><Pencil size={17} aria-hidden="true" /> Editar</button>
                    <button
                      type="button"
                      onClick={async () => {
                        const accepted = await confirm({
                          title: 'Eliminar atención del historial',
                          description: `Se eliminará la atención de ${clientName(selectedClient)}${visit.date ? ` del ${visit.date}` : ''}.`,
                        })
                        if (accepted) void removeClientVisit(visit, clientName(selectedClient))
                      }}
                    >
                      <Trash2 size={17} aria-hidden="true" /> Eliminar
                    </button>
                  </div>
                </article>
              ))}
              {!visits.length ? (
                <div className="admin-empty-state">
                  <h3>Sin atenciones registradas</h3>
                  <p>Agrega la primera visita para comenzar el historial técnico.</p>
                </div>
              ) : null}
            </div>
            <button
              className="client-delete-button"
              type="button"
              onClick={async () => {
                const accepted = await confirm({
                  title: `Eliminar ficha de ${clientName(selectedClient)}`,
                  description: 'Se eliminarán la ficha y el acceso a su historial desde el directorio.',
                  confirmLabel: 'Eliminar ficha',
                })
                if (accepted) void removeClient(selectedClient)
              }}
            >
              <Trash2 size={18} aria-hidden="true" /> Eliminar ficha
            </button>
          </>
        ) : (
          <div className="admin-empty-state">
            <h3>Aún no hay clientas</h3>
            <p>Crea la primera ficha para comenzar.</p>
          </div>
        )}
      </section>
    </div>
  )
}
