import { useEffect, useMemo, useState } from 'react'
import { useAdminConfirm } from './admin-confirm'

export function useAdminFormGuard<T>(value: T, onDiscard: () => void) {
  const [initialValue] = useState(() => JSON.stringify(value))
  const currentValue = useMemo(() => JSON.stringify(value), [value])
  const isDirty = currentValue !== initialValue
  const { confirm, confirmDialog } = useAdminConfirm()

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isDirty])

  const requestClose = async () => {
    if (!isDirty) {
      onDiscard()
      return
    }
    const accepted = await confirm({
      title: 'Descartar cambios sin guardar',
      description: 'Los datos modificados en este formulario se perderán.',
      confirmLabel: 'Descartar cambios',
    })
    if (accepted) onDiscard()
  }

  return { requestClose, unsavedDialog: confirmDialog, isDirty }
}
