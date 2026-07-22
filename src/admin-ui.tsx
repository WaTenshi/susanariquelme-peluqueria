import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  formatCLPNumber,
  parseCatalogPrice,
  parseCLPNumber,
  serializeCatalogPrice,
  type CatalogPriceMode,
} from './admin-money'

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  isLoading?: boolean
}

export function AdminButton({
  children,
  icon: Icon,
  variant = 'secondary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: AdminButtonProps) {
  return (
    <button
      className={`admin-ui-button is-${variant} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className="admin-ui-spinner" size={19} aria-hidden="true" />
      ) : Icon ? (
        <Icon size={19} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  )
}

type AdminFieldProps = {
  label: string
  children: ReactNode
  hint?: string
  error?: string
  icon?: LucideIcon
  className?: string
  required?: boolean
}

export function AdminField({
  label,
  children,
  hint,
  error,
  icon: Icon,
  className = '',
  required = false,
}: AdminFieldProps) {
  return (
    <label className={`admin-ui-field ${error ? 'has-error' : ''} ${className}`.trim()}>
      <span className="admin-ui-field-label">
        {Icon ? <Icon size={17} aria-hidden="true" /> : null}
        {label}
        {required ? <b aria-hidden="true">*</b> : null}
      </span>
      {children}
      {error ? <small className="admin-ui-field-error">{error}</small> : null}
      {!error && hint ? <small className="admin-ui-field-hint">{hint}</small> : null}
    </label>
  )
}

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: string | number
  onValueChange: (value: number, formatted: string) => void
}

export function CurrencyInput({
  value,
  onValueChange,
  className = '',
  ...props
}: CurrencyInputProps) {
  const numericValue = value === '' ? '' : parseCLPNumber(value)
  const displayValue = numericValue === '' ? '' : formatCLPNumber(numericValue)

  return (
    <span className="admin-currency-input">
      <span aria-hidden="true">$</span>
      <input
        {...props}
        className={className}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(event) => {
          const raw = event.target.value
          if (!raw.trim()) {
            onValueChange(0, '')
            return
          }
          const next = parseCLPNumber(raw)
          onValueChange(next, `$${formatCLPNumber(next)}`)
        }}
      />
    </span>
  )
}

type CatalogPriceInputProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function CatalogPriceInput({
  value,
  onChange,
  required = false,
}: CatalogPriceInputProps) {
  const parsed = parseCatalogPrice(value)
  const setMode = (mode: CatalogPriceMode) => {
    if (mode === 'custom') {
      onChange(parsed.custom || value)
      return
    }
    onChange(serializeCatalogPrice(mode, parsed.amounts))
  }

  return (
    <div className="admin-catalog-price">
      <select
        value={parsed.mode}
        onChange={(event) => setMode(event.target.value as CatalogPriceMode)}
        aria-label="Tipo de precio"
      >
        <option value="fixed">Precio fijo</option>
        <option value="from">Desde</option>
        <option value="range">Rango</option>
        <option value="custom">Texto especial</option>
      </select>
      {parsed.mode === 'custom' ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ejemplo: A consultar"
          maxLength={60}
          required={required}
        />
      ) : (
        <div className="admin-catalog-price-values">
          <CurrencyInput
            value={parsed.amounts[0] || ''}
            onValueChange={(amount) =>
              onChange(
                serializeCatalogPrice(parsed.mode, [amount, parsed.amounts[1] || 0]),
              )
            }
            aria-label={parsed.mode === 'range' ? 'Precio mínimo' : 'Precio en pesos chilenos'}
            required={required}
          />
          {parsed.mode === 'range' ? (
            <CurrencyInput
              value={parsed.amounts[1] || ''}
              onValueChange={(amount) =>
                onChange(
                  serializeCatalogPrice('range', [parsed.amounts[0] || 0, amount]),
                )
              }
              aria-label="Precio máximo"
              required={required}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

type AdminModalProps = {
  open: boolean
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: 'small' | 'medium' | 'large'
  closeLabel?: string
  className?: string
  preventBackdropClose?: boolean
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function AdminModal({
  open,
  eyebrow,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'medium',
  closeLabel = 'Cerrar',
  className = '',
  preventBackdropClose = false,
}: AdminModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFirst = window.setTimeout(() => {
      const first =
        dialogRef.current?.querySelector<HTMLElement>('[autofocus]') ??
        dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
      first?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusFirst)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus.current?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div
      className="admin-theme admin-modal-backdrop"
      onMouseDown={(event) => {
        if (!preventBackdropClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`admin-modal is-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={dialogRef}
      >
        <header className="admin-modal-header">
          <div>
            {eyebrow ? <p>{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
            {description ? <span id={descriptionId}>{description}</span> : null}
          </div>
          <AdminButton variant="ghost" icon={X} type="button" onClick={onClose}>
            {closeLabel}
          </AdminButton>
        </header>
        <div className="admin-modal-body">{children}</div>
        {footer ? <footer className="admin-modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  onClose,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AdminModal
      open={open}
      eyebrow="Confirmación necesaria"
      title={title}
      description={description}
      onClose={onClose}
      size="small"
      preventBackdropClose={isLoading}
      footer={
        <>
          <AdminButton type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </AdminButton>
          <AdminButton
            type="button"
            variant="danger"
            icon={AlertTriangle}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <div className="admin-confirm-message">
        <AlertTriangle size={28} aria-hidden="true" />
        <p>Esta acción no se puede deshacer.</p>
      </div>
    </AdminModal>
  )
}

type StatusBadgeProps = {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  icon?: LucideIcon
}

export function StatusBadge({
  children,
  tone = 'neutral',
  icon: Icon = tone === 'success' ? CheckCircle2 : undefined,
}: StatusBadgeProps) {
  return (
    <span className={`admin-status-badge is-${tone}`}>
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
