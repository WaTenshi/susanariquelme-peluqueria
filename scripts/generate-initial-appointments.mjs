import fs from 'node:fs'
import readExcelFile from 'read-excel-file/node'

const workbookPath = 'C:/Users/angel/Downloads/HORAS 2026.xlsx'
const outputPath = 'src/initialAppointments.ts'
const year = 2026

const monthNumbers = {
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

const clean = (value) => String(value ?? '').trim()

const normalizeText = (value) =>
  clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

const slug = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const amount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const numeric = clean(value).replace(/[^\d,-]/g, '').replace(',', '.')
  return numeric ? Number(numeric) || 0 : 0
}

const hasMeaningfulText = (value) => {
  const text = clean(value)
  return !!text && !/^\d+$/.test(text) && !/^(0|servicios|productos)$/i.test(text)
}

const findFrom = (row, start, predicate) => {
  for (let index = Math.max(0, start); index < row.length; index += 1) {
    if (predicate(normalizeText(row[index]))) return index
  }
  return -1
}

const detectHeader = (row) => {
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

  const stylistIndex = findFrom(row, 0, (value) => value === 'estilista')

  return {
    depositDate,
    depositAmount,
    survey,
    stylist: stylistIndex >= 0 ? stylistIndex : clientName - 1,
    clientName,
    service,
    serviceCash: findFrom(row, service + 1, (value) => value === 'efectivo'),
    serviceCard: findFrom(row, service + 1, (value) => value === 'tarjeta'),
    serviceTransfer: findFrom(row, service + 1, (value) =>
      value.includes('transferencia'),
    ),
    serviceReceipt: findFrom(row, service + 1, (value) => value.includes('boleta')),
    productStylist,
    productClientName: findFrom(row, productStylist + 1, (value) =>
      value === 'nombre',
    ),
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

const cell = (row, index) => (index >= 0 ? row[index] : '')

const toIsoDate = (month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const workbook = await readExcelFile(workbookPath)
const records = []
const skippedSheets = []

workbook.forEach(({ sheet: sheetName, data: rows }) => {
  if (/^copia\b/i.test(sheetName.trim())) {
    skippedSheets.push(sheetName)
    return
  }

  const month = monthNumbers[normalizeText(sheetName)]
  if (!month) return

  let currentDate = ''
  let header = null

  rows.forEach((row, rowIndex) => {
    const dayCell = row
      .slice(0, 4)
      .map(clean)
      .find((value) => dayPattern.test(value))

    if (dayCell) {
      const match = dayCell.match(dayPattern)
      currentDate = match ? toIsoDate(month, Number(match[2])) : ''
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

const source = `import type { AppointmentRecord } from './types'\n\nexport const initialAppointments: AppointmentRecord[] = ${JSON.stringify(records, null, 2)}\n`

fs.writeFileSync(outputPath, source)
console.log(
  JSON.stringify({ outputPath, records: records.length, skippedSheets }, null, 2),
)
