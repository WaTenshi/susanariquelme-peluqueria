import { describe, expect, it } from 'vitest'
import { adminNavigation } from '../src/admin-navigation'
import { adminTourBehavior, getAdminTourSteps } from '../src/admin-tours'

describe('recorridos de ayuda administrativa', () => {
  it('incluye un recorrido detallado para cada módulo del panel', () => {
    expect(adminNavigation).toHaveLength(8)

    adminNavigation.forEach((item) => {
      const steps = getAdminTourSteps(item.id)
      const descriptions = steps.map((step) => step.popover?.description || '')

      expect(steps.length, item.label).toBeGreaterThanOrEqual(8)
      expect(steps[0].element, item.label).toBeUndefined()
      expect(descriptions[0], item.label).toContain('Puedes salir en cualquier momento')
      expect(
        steps.some((step) => step.element === '[data-tour="view-header"]'),
        item.label,
      ).toBe(true)
      expect(
        steps.some((step) => step.element === '[data-tour="help-button"]'),
        item.label,
      ).toBe(true)
      expect(steps.at(-1)?.element, item.label).toBeUndefined()
      descriptions.forEach((description) => {
        expect(description.length, `${item.label}: descripción vacía`).toBeGreaterThan(40)
      })
    })
  })

  it('permite cancelar sin activar controles de la vista', () => {
    expect(adminTourBehavior.allowClose).toBe(true)
    expect(adminTourBehavior.allowKeyboardControl).toBe(true)
    expect(adminTourBehavior.overlayClickBehavior).toBe('close')
    expect(adminTourBehavior.disableActiveInteraction).toBe(true)
    expect(adminTourBehavior.skipMissingElement).toBe(true)
  })

  it('usa pasos propios para cada módulo', () => {
    const moduleSelectors = adminNavigation.map((item) => {
      const selectors = getAdminTourSteps(item.id)
        .map((step) => step.element)
        .filter((element): element is string => typeof element === 'string')
        .filter(
          (element) =>
            element !== '[data-tour="view-header"]' &&
            element !== '[data-tour="help-button"]',
        )

      expect(selectors.length, item.label).toBeGreaterThanOrEqual(4)
      return selectors.join('|')
    })

    expect(new Set(moduleSelectors).size).toBe(adminNavigation.length)
  })
})
