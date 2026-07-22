import { useCallback, useState } from 'react'
import { ConfirmDialog } from './admin-ui'

type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
}

type PendingConfirmation = ConfirmOptions & {
  resolve: (accepted: boolean) => void
}

export function useAdminConfirm() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  const finish = (accepted: boolean) => {
    pending?.resolve(accepted)
    setPending(null)
  }

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      title={pending?.title || 'Confirmar acción'}
      description={pending?.description || ''}
      confirmLabel={pending?.confirmLabel}
      onClose={() => finish(false)}
      onConfirm={() => finish(true)}
    />
  )

  return { confirm, confirmDialog }
}
