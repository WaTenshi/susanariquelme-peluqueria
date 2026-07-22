import { useState } from 'react'
import axe from 'axe-core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  AdminButton,
  AdminModal,
  CatalogPriceInput,
  CurrencyInput,
} from '../src/admin-ui'

function CurrencyExample() {
  const [value, setValue] = useState<string | number>('')
  return (
    <CurrencyInput
      aria-label="Precio"
      value={value}
      onValueChange={(_number, formatted) => setValue(formatted)}
    />
  )
}

function CatalogPriceExample() {
  const [value, setValue] = useState('Desde $60.000')
  return <CatalogPriceInput value={value} onChange={setValue} />
}

describe('componentes administrativos', () => {
  it('muestra el signo peso y separadores mientras se escribe', async () => {
    const user = userEvent.setup()
    render(<CurrencyExample />)
    const input = screen.getByLabelText('Precio')
    await user.type(input, '123123')
    expect(input).toHaveValue('123.123')
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('permite cambiar un precio Desde a Rango', async () => {
    const user = userEvent.setup()
    render(<CatalogPriceExample />)
    await user.selectOptions(screen.getByLabelText('Tipo de precio'), 'range')
    expect(screen.getByLabelText('Precio mínimo')).toHaveValue('60.000')
    expect(screen.getByLabelText('Precio máximo')).toBeInTheDocument()
  })

  it('controla foco y Escape en el modal', async () => {
    const close = vi.fn()
    render(
      <AdminModal open title="Buscar clienta" onClose={close}>
        <input autoFocus aria-label="Buscar" />
      </AdminModal>,
    )
    await waitFor(() => expect(screen.getByLabelText('Buscar')).toHaveFocus())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(close).toHaveBeenCalledOnce()
  })

  it('no presenta infracciones automáticas de accesibilidad en sus controles base', async () => {
    render(
      <main>
        <h1>Panel administrativo</h1>
        <AdminButton>Guardar cambios</AdminButton>
        <CurrencyInput aria-label="Monto" value={10000} onValueChange={() => undefined} />
      </main>,
    )
    const results = await axe.run(document.body)
    expect(results.violations).toEqual([])
  })
})
