import { useMemo, useState } from 'react'
import {
  Boxes,
  CirclePlus,
  FileClock,
  PackageCheck,
  Pencil,
  Search,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import type { AuditAction, AuditEntity, AuditLog } from './types'

const entityLabels: Record<AuditEntity, string> = {
  appointment: 'Hora',
  booking: 'Reserva',
  client: 'Clienta',
  visit: 'Atención',
  product: 'Producto',
  service: 'Servicio',
  news: 'Novedad',
  inventory: 'Inventario',
}

const actionLabels: Record<AuditAction, string> = {
  create: 'Creación',
  update: 'Edición',
  delete: 'Eliminación',
  stock: 'Movimiento',
}

const actionIcons: Record<AuditAction, LucideIcon> = {
  create: CirclePlus,
  update: Pencil,
  delete: Trash2,
  stock: PackageCheck,
}

const formatDate = (log: AuditLog) => {
  const date = log.createdAt?.toDate?.()
  return date
    ? new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Fecha no disponible'
}

export default function AuditPanel({ logs }: { logs: AuditLog[] }) {
  const [entity, setEntity] = useState<'all' | AuditEntity>('all')
  const [query, setQuery] = useState('')
  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchesEntity = entity === 'all' || log.entityType === entity
        const matchesQuery = `${log.entityName} ${log.actorEmail} ${log.changes.join(' ')}`
          .toLocaleLowerCase('es')
          .includes(query.trim().toLocaleLowerCase('es'))
        return matchesEntity && matchesQuery
      }),
    [entity, logs, query],
  )

  return (
    <section className="admin-content-card audit-view">
      <div className="admin-card-heading">
        <div><p>Registro inmutable</p><h2>Historial de cambios</h2></div>
        <span>{filteredLogs.length} registros</span>
      </div>
      <div className="audit-toolbar">
        <span className="admin-search-control">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar persona, producto o cambio"
          />
        </span>
        <select
          value={entity}
          onChange={(event) =>
            setEntity(event.target.value as 'all' | AuditEntity)
          }
        >
          <option value="all">Todos los módulos</option>
          {Object.entries(entityLabels).map(([value, label]) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="audit-list">
        {filteredLogs.map((log) => {
          const ActionIcon = actionIcons[log.action]
          return (
          <article key={log.id}>
            <div className={`audit-action is-${log.action}`}>
              <ActionIcon size={19} aria-hidden="true" />
              <span>{actionLabels[log.action]}</span>
              <small>{entityLabels[log.entityType]}</small>
            </div>
            <div className="audit-detail">
              <h3>{log.entityName}</h3>
              <ul>
                {log.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </div>
            <div className="audit-meta">
              <strong>{log.actorEmail}</strong>
              <time>{formatDate(log)}</time>
            </div>
          </article>
          )
        })}
        {!filteredLogs.length ? (
          <div className="admin-empty-state">
            <FileClock size={32} aria-hidden="true" />
            <h3>No hay cambios con estos filtros</h3>
            <p><Boxes size={16} aria-hidden="true" /> Prueba con otro módulo o término de búsqueda.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
