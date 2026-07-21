import readExcelFile from 'read-excel-file/browser'
import type { AppointmentRecord } from './types'

const monthNumbers: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

const dayPattern =
  /^(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\s+(\d{1,2})/i

type HeaderMap = {
  depositDate: number
  depositAmount: number
  survey: number
  stylist: number
  clientName: number
  service: number
  serviceCash: number
  serviceCard: number
  serviceTransfer: number
  serviceReceipt: number
  productStylist: number
  productClientName: number
  productName: number
  productCash: number
  productCard: number
  productTransfer: number
  productReceipt: number
}

const clean = (value: unknown) => String(value ?? '').trim()

const normalizeText = (value: unknown) =>
  clean(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')

const slug = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const amount = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const numeric = clean(value).replace(/[^\d,-]/g, '').replace(',', '.')
  return numeric ? Number(numeric) || 0 : 0
}

const hasMeaningfulText = (value: unknown) => {
  const text = clean(value)
  return !!text && !/^\d+$/.test(text) && !/^(0|servicios|productos)$/i.test(text)
}

const findFrom = (
  row: unknown[],
  start: number,
  predicate: (value: string) => boolean,
) => {
  for (let index = Math.max(0, start); index < row.length; index += 1) {
    if (predicate(normalizeText(row[index]))) return index
  }
  return -1
}

const detectHeader = (row: unknown[]): HeaderMap | null => {
  const depositDate = findFrom(row, 0, (value) => value === 'fecha abono')
  const depositAmount = findFrom(row, 0, (value) => value === 'abono')
  const survey = findFrom(row, 0, (value) => value === 'encuesta')
  const clientName = findFrom(row, 0, (value) => value.includes('clienta'))
  const service = findFrom(row, 0, (value) => value.includes('servicio'))
  const productStylist = findFrom(row, 0, (value) =>
    value.includes('venta estilista'),
  )
  const productName = findFrom(row, productStylist + 1, (value) =>
    value.includes('producto'),
  )

  if (depositAmount < 0 || clientName < 0 || service < 0 || productName < 0) {
    return null
  }

  const stylist =
    findFrom(row, 0, (value) => value === 'estilista') >= 0
      ? findFrom(row, 0, (value) => value === 'estilista')
      : clientName - 1
  const productClientName = findFrom(row, productStylist + 1, (value) =>
    value === 'nombre',
  )

  return {
    depositDate,
    depositAmount,
    survey,
    stylist,
    clientName,
    service,
    serviceCash: findFrom(row, service + 1, (value) => value === 'efectivo'),
    serviceCard: findFrom(row, service + 1, (value) => value === 'tarjeta'),
    serviceTransfer: findFrom(row, service + 1, (value) =>
      value.includes('transferencia'),
    ),
    serviceReceipt: findFrom(row, service + 1, (value) => value.includes('boleta')),
    productStylist,
    productClientName,
    productName,
    productCash: findFrom(row, productName + 1, (value) => value === 'efectivo'),
    productCard: findFrom(row, productName + 1, (value) => value === 'tarjeta'),
    productTransfer: findFrom(row, productName + 1, (value) =>
      value.includes('transferencia'),
    ),
    productReceipt: findFrom(row, productName + 1, (value) =>
      value.includes('boleta'),
    ),
  }
}

const cell = (row: unknown[], index: number) => (index >= 0 ? row[index] : '')

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const parseHoursWorkbook = async (file: File, year = 2026) => {
  const workbook = await readExcelFile(file)
  const records: AppointmentRecord[] = []
  const skippedSheets: string[] = []

  workbook.forEach(({ sheet: sheetName, data: rows }) => {
    if (/^copia\b/i.test(sheetName.trim())) {
      skippedSheets.push(sheetName)
      return
    }

    const month = monthNumbers[normalizeText(sheetName)]
    if (!month) return

    let currentDate = ''
    let header: HeaderMap | null = null

    rows.forEach((row, rowIndex) => {
      const dayCell = row
        .slice(0, 4)
        .map(clean)
        .find((value) => dayPattern.test(value))

      if (dayCell) {
        const match = dayCell.match(dayPattern)
        currentDate = match ? toIsoDate(year, month, Number(match[2])) : ''
        header = null
        return
      }

      const nextHeader = detectHeader(row)
      if (nextHeader) {
        header = nextHeader
        return
      }

      if (!currentDate || !header) return

      const hasService =
        hasMeaningfulText(cell(row, header.stylist)) ||
        hasMeaningfulText(cell(row, header.clientName)) ||
        hasMeaningfulText(cell(row, header.service)) ||
        hasMeaningfulText(cell(row, header.serviceReceipt)) ||
        amount(cell(row, header.depositAmount)) > 0 ||
        hasMeaningfulText(cell(row, header.survey))
      const hasProduct =
        hasMeaningfulText(cell(row, header.productStylist)) ||
        hasMeaningfulText(cell(row, header.productClientName)) ||
        hasMeaningfulText(cell(row, header.productName)) ||
        hasMeaningfulText(cell(row, header.productReceipt))

      if (!hasService && !hasProduct) return

      records.push({
        date: currentDate,
        depositDate: clean(cell(row, header.depositDate)),
        depositAmount: amount(cell(row, header.depositAmount)),
        survey: clean(cell(row, header.survey)),
        stylist: clean(cell(row, header.stylist)),
        clientName: clean(cell(row, header.clientName)),
        service: clean(cell(row, header.service)),
        serviceCash: amount(cell(row, header.serviceCash)),
        serviceCard: amount(cell(row, header.serviceCard)),
        serviceTransfer: amount(cell(row, header.serviceTransfer)),
        serviceReceipt: clean(cell(row, header.serviceReceipt)),
        productStylist: clean(cell(row, header.productStylist)),
        productClientName: clean(cell(row, header.productClientName)),
        productName: clean(cell(row, header.productName)),
        productCash: amount(cell(row, header.productCash)),
        productCard: amount(cell(row, header.productCard)),
        productTransfer: amount(cell(row, header.productTransfer)),
        productReceipt: clean(cell(row, header.productReceipt)),
        notes: '',
        sourceSheet: sheetName,
        sourceRow: rowIndex + 1,
        sourceId: `horas-${year}-${slug(sheetName)}-${rowIndex + 1}`,
      })
    })
  })

  return { records, skippedSheets }
}
