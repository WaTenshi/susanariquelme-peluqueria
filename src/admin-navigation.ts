import {
  CalendarDays,
  ChartNoAxesCombined,
  History,
  Home,
  Newspaper,
  PackageSearch,
  Scissors,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export type AdminTab =
  | 'overview'
  | 'hours'
  | 'clients'
  | 'appointments'
  | 'inventory'
  | 'services'
  | 'news'
  | 'audit'

export type AdminNavigationItem = {
  id: AdminTab
  label: string
  title: string
  description: string
  icon: LucideIcon
}

export const adminNavigation: AdminNavigationItem[] = [
  {
    id: 'overview',
    label: 'Inicio',
    title: 'Resumen del salón',
    description: 'Actividad reciente y accesos a las tareas más frecuentes.',
    icon: Home,
  },
  {
    id: 'hours',
    label: 'Agenda',
    title: 'Agenda de horas',
    description: 'Crea, revisa y actualiza las horas de atención.',
    icon: CalendarDays,
  },
  {
    id: 'clients',
    label: 'Clientas',
    title: 'Directorio de clientas',
    description: 'Busca fichas, datos de contacto e historial de atenciones.',
    icon: UsersRound,
  },
  {
    id: 'appointments',
    label: 'Finanzas',
    title: 'Finanzas del salón',
    description: 'Consulta ingresos, movimientos y resultados por estilista.',
    icon: ChartNoAxesCombined,
  },
  {
    id: 'inventory',
    label: 'Inventario',
    title: 'Inventario y catálogo',
    description: 'Controla productos, stock, facturas y proveedores.',
    icon: PackageSearch,
  },
  {
    id: 'services',
    label: 'Servicios',
    title: 'Servicios publicados',
    description: 'Administra categorías, valores y visibilidad en la web.',
    icon: Scissors,
  },
  {
    id: 'news',
    label: 'Novedades',
    title: 'Novedades del salón',
    description: 'Crea y actualiza contenidos para la página pública.',
    icon: Newspaper,
  },
  {
    id: 'audit',
    label: 'Historial',
    title: 'Historial de actividad',
    description: 'Revisa cambios importantes realizados en el panel.',
    icon: History,
  },
]

export const getAdminNavigationItem = (tab: AdminTab) =>
  adminNavigation.find((item) => item.id === tab) ?? adminNavigation[0]
