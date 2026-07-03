import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { saveClient } from './firebase'
import type { Client, ClientVisit } from './types'

type ClientFilter = 'all' | 'vip' | 'recent' | 'oldest'

type ClientPickerModalProps = {
  clients: Client[]
  allVisits: ClientVisit[]
  selectedClientId?: string
  selectedClientName?: string
  eyebrow?: string
  title?: string
  onSelect: (client: Client, name: string) => void
  onClose: () => void
  onClear?: () => void
}

const emptyClient = (firstName = ''): Client => ({
  firstName,
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

const clientName = (client: Client) =>
  [client.firstName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ')
    .trim()

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

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

const visitLabel = (timestamp: number) =>
  timestamp
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(
        new Date(timestamp),
      )
    : ''

export default function ClientPickerModal({
  clients,
  allVisits,
  selectedClientId = '',
  selectedClientName = '',
  eyebrow = 'Directorio privado',
  title = 'Buscar clienta',
  onSelect,
  onClose,
  onClear,
}: ClientPickerModalProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [draft, setDraft] = useState<Client | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

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
    const matches = clients.filter((client) => {
      const haystack = normalizeText(
        [
          client.searchText,
          clientName(client),
          client.phone,
          client.email,
          client.commune,
        ].join(' '),
      )
      return (
        client.active &&
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (filter !== 'vip' || client.vip)
      )
    })

    if (filter === 'recent' || filter === 'oldest') {
      return [...matches].sort((first, second) => {
        const firstDate = lastVisitByClient.get(first.id || '') || 0
        const secondDate = lastVisitByClient.get(second.id || '') || 0
        return filter === 'recent'
          ? secondDate - firstDate
          : firstDate - secondDate
      })
    }

    return matches.sort((first, second) =>
      clientName(first).localeCompare(clientName(second), 'es'),
    )
  }, [clients, filter, lastVisitByClient, query])

  const updateDraft = <K extends keyof Client>(key: K, value: Client[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current))

  const handleCreate = async () => {
    if (!draft?.firstName.trim()) return
    setError('')
    setIsSaving(true)
    try {
      const nextClient = {
        ...draft,
        firstName: draft.firstName.trim(),
        paternalSurname: draft.paternalSurname.trim(),
        maternalSurname: draft.maternalSurname.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        commune: draft.commune.trim(),
        instagram: draft.instagram.trim(),
        notes: draft.notes.trim(),
      }
      const searchText = normalizeText(
        [
          nextClient.firstName,
          nextClient.paternalSurname,
          nextClient.maternalSurname,
          nextClient.phone,
          nextClient.email,
          nextClient.commune,
        ].join(' '),
      )
      const id = await saveClient({ ...nextClient, searchText })
      const savedClient = { ...nextClient, id, searchText }
      onSelect(savedClient, clientName(savedClient))
      onClose()
    } catch {
      setError('No fue posible crear la ficha de la clienta.')
    } finally {
      setIsSaving(false)
    }
  }

  const startDraft = () => {
    setDraft(emptyClient(query.trim()))
    setError('')
  }

  const modal = (
    <div className="inventory-modal-backdrop">
      <div
        className="inventory-modal client-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="admin-editor-head">
          <div>
            <p>{eyebrow}</p>
            <h2>{draft ? 'Nueva clienta' : title}</h2>
          </div>
          <button className="admin-text-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="client-picker-layout">
          <aside className="client-picker-sidebar">
            <div>
              <p>Clientas registradas</p>
              <strong>{clients.length}</strong>
            </div>
            <label className="clients-search">
              <span>Buscar clienta</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, teléfono, correo o comuna"
              />
            </label>
            <div className="clients-filters" aria-label="Filtros de clientas">
              {([
                ['all', 'Todas'],
                ['vip', 'VIP'],
                ['recent', 'Más recientes'],
                ['oldest', 'Menos recientes'],
              ] as const).map(([value, label]) => (
                <button
                  className={filter === value ? 'is-active' : ''}
                  type="button"
                  onClick={() => {
                    setFilter(value)
                    setDraft(null)
                  }}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="client-picker-sidebar-actions">
              <button
                className="admin-primary-button"
                type="button"
                onClick={startDraft}
              >
                Nueva clienta
              </button>
              {onClear ? (
                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={() => {
                    onClear()
                    onClose()
                  }}
                >
                  Limpiar selección
                </button>
              ) : null}
            </div>
          </aside>

          <section className="client-picker-content">
            {draft ? (
              <div className="client-picker-create">
                <div className="client-picker-content-head">
                  <div>
                    <p>Ficha rápida</p>
                    <strong>{draft.firstName || 'Nueva clienta'}</strong>
                  </div>
                  <button
                    className="admin-text-button"
                    type="button"
                    onClick={() => setDraft(null)}
                  >
                    Volver al listado
                  </button>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Nombre
                    <input
                      value={draft.firstName}
                      onChange={(event) =>
                        updateDraft('firstName', event.target.value)
                      }
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Apellido paterno
                    <input
                      value={draft.paternalSurname}
                      onChange={(event) =>
                        updateDraft('paternalSurname', event.target.value)
                      }
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Apellido materno
                    <input
                      value={draft.maternalSurname}
                      onChange={(event) =>
                        updateDraft('maternalSurname', event.target.value)
                      }
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      value={draft.phone}
                      onChange={(event) => updateDraft('phone', event.target.value)}
                      inputMode="tel"
                      maxLength={40}
                    />
                  </label>
                  <label>
                    Correo
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(event) => updateDraft('email', event.target.value)}
                      maxLength={160}
                    />
                  </label>
                  <label>
                    Comuna
                    <input
                      value={draft.commune}
                      onChange={(event) =>
                        updateDraft('commune', event.target.value)
                      }
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Cumpleaños
                    <input
                      type="date"
                      value={draft.birthday}
                      onChange={(event) =>
                        updateDraft('birthday', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Instagram
                    <input
                      value={draft.instagram}
                      onChange={(event) =>
                        updateDraft('instagram', event.target.value)
                      }
                      placeholder="@usuario"
                      maxLength={100}
                    />
                  </label>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={draft.vip}
                      onChange={(event) => updateDraft('vip', event.target.checked)}
                    />
                    Clienta VIP
                  </label>
                  <label className="is-wide">
                    Observaciones
                    <textarea
                      value={draft.notes}
                      onChange={(event) => updateDraft('notes', event.target.value)}
                      maxLength={1000}
                    />
                  </label>
                </div>
                {error ? <p className="admin-error">{error}</p> : null}
                <div className="admin-form-actions">
                  <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={() => setDraft(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="admin-primary-button"
                    type="button"
                    disabled={isSaving || !draft.firstName.trim()}
                    onClick={() => void handleCreate()}
                  >
                    {isSaving ? 'Guardando...' : 'Crear y seleccionar'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="client-picker-content-head">
                  <div>
                    <p>Resultados</p>
                    <strong>{filteredClients.length} clientas</strong>
                  </div>
                </div>
                <div className="client-picker-list">
                  {filteredClients.map((client) => {
                    const name = clientName(client)
                    const lastVisit = lastVisitByClient.get(client.id || '') || 0
                    const isSelected =
                      (!!selectedClientId && selectedClientId === client.id) ||
                      (!!selectedClientName &&
                        normalizeText(selectedClientName) === normalizeText(name))
                    return (
                      <button
                        className={isSelected ? 'is-active' : ''}
                        type="button"
                        key={client.id || name}
                        onClick={() => {
                          onSelect(client, name)
                          onClose()
                        }}
                      >
                        <span>{client.firstName.slice(0, 1)}{client.paternalSurname.slice(0, 1)}</span>
                        <div>
                          <strong>{name || 'Clienta sin nombre'}</strong>
                          <small>
                            {client.phone ||
                              client.email ||
                              client.commune ||
                              'Sin contacto registrado'}
                          </small>
                          {lastVisit ? (
                            <small className="client-last-visit">
                              Última atención: {visitLabel(lastVisit)}
                            </small>
                          ) : null}
                        </div>
                        {client.vip ? <i>VIP</i> : null}
                      </button>
                    )
                  })}
                  {!filteredClients.length ? (
                    <div className="client-picker-empty">
                      <p className="admin-empty-copy">No hay coincidencias.</p>
                      <button
                        className="admin-primary-button"
                        type="button"
                        onClick={startDraft}
                      >
                        Crear clienta
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
