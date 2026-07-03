param(
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
$projectId = 'susanariquelme-peluqueria'
$sourcePath = 'C:\Users\angel\Downloads\ficha clientas.xlsx'
$configPath = Join-Path $env:USERPROFILE '.config\configstore\firebase-tools.json'

function Get-TextValue {
  param(
    $Sheet,
    [int]$Row,
    [int]$Column
  )

  $text = [string]$Sheet.Cells.Item($Row, $Column).Text
  return $text.Trim()
}

function Limit-Text {
  param(
    [string]$Value,
    [int]$Length
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ''
  }

  $clean = ($Value -replace '\s+', ' ').Trim()
  if ($clean.Length -le $Length) {
    return $clean
  }

  return $clean.Substring(0, $Length)
}

function Normalize-SearchText {
  param([string]$Value)

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = [Text.StringBuilder]::new()
  foreach ($character in $normalized.ToCharArray()) {
    if (
      [Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne
      [Globalization.UnicodeCategory]::NonSpacingMark
    ) {
      [void]$builder.Append($character)
    }
  }

  return ($builder.ToString().ToLowerInvariant() -replace '\s+', ' ').Trim()
}

function Convert-ToFirestoreValue {
  param($Value)

  if ($Value -is [bool]) {
    return @{ booleanValue = $Value }
  }

  if ($Value -is [int] -or $Value -is [long]) {
    return @{ integerValue = [string]$Value }
  }

  if ($Value -is [datetime]) {
    return @{ timestampValue = $Value.ToUniversalTime().ToString('o') }
  }

  return @{ stringValue = [string]$Value }
}

function Convert-ToFirestoreFields {
  param([hashtable]$Values)

  $fields = @{}
  foreach ($entry in $Values.GetEnumerator()) {
    $fields[$entry.Key] = Convert-ToFirestoreValue $entry.Value
  }
  return $fields
}

function Invoke-BatchWrites {
  param(
    [array]$Writes,
    [string]$AccessToken
  )

  $headers = @{
    Authorization = "Bearer $AccessToken"
    'Content-Type' = 'application/json'
  }
  $endpoint =
    "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents:batchWrite"

  for ($index = 0; $index -lt $Writes.Count; $index += 400) {
    $last = [Math]::Min($index + 399, $Writes.Count - 1)
    $chunk = @($Writes[$index..$last])
    $payload = @{ writes = $chunk } | ConvertTo-Json -Depth 20 -Compress
    $result = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $payload

    if ($result.status | Where-Object { $_.code -and $_.code -ne 0 }) {
      throw 'Uno o más registros fueron rechazados durante la importación.'
    }
  }
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$workbook = $null

try {
  $workbook = $excel.Workbooks.Open($sourcePath, 0, $true)
  $databaseSheet = $workbook.Worksheets.Item('BASE DE DATOS ')
  $recordsSheet = $workbook.Worksheets.Item('Ficha Clienta')
  $clientsByLegacyId = @{}

  for ($row = 3; $row -le 151; $row++) {
    $legacyId = Get-TextValue $databaseSheet $row 1
    $firstName = Get-TextValue $databaseSheet $row 2
    if (-not $legacyId -or -not $firstName) {
      continue
    }

    $clientsByLegacyId[$legacyId] = @{
      legacyId = $legacyId
      firstName = Limit-Text $firstName 100
      paternalSurname = Limit-Text (Get-TextValue $databaseSheet $row 3) 100
      maternalSurname = Limit-Text (Get-TextValue $databaseSheet $row 4) 100
      phone = Limit-Text (Get-TextValue $databaseSheet $row 5) 40
      birthday = Limit-Text (Get-TextValue $databaseSheet $row 6) 60
      commune = Limit-Text (Get-TextValue $databaseSheet $row 7) 100
      email = Limit-Text (Get-TextValue $databaseSheet $row 8) 160
      instagram = ''
      vip = $false
      notes = ''
      active = $true
      visits = [Collections.Generic.List[hashtable]]::new()
    }
  }

  $usedRange = $recordsSheet.UsedRange
  $rawValues = $usedRange.Value2
  $lastRow = $usedRange.Rows.Count
  $lastColumn = $usedRange.Columns.Count

  for ($row = 1; $row -le $lastRow - 7; $row++) {
    $phoneLabel = [string]$rawValues.GetValue($row, 7)
    $displayName = [string]$rawValues.GetValue($row, 4)
    if ($phoneLabel.Trim().ToUpperInvariant() -ne 'TELEFONO' -or -not $displayName.Trim()) {
      continue
    }

    $legacyId = ([string]$rawValues.GetValue($row + 2, 4)).Trim()
    if (-not $legacyId) {
      continue
    }

    if (-not $clientsByLegacyId.ContainsKey($legacyId)) {
      $nameParts = @($displayName.Trim() -split '\s+' | Where-Object { $_ })
      $clientsByLegacyId[$legacyId] = @{
        legacyId = $legacyId
        firstName = Limit-Text ($nameParts | Select-Object -First 1) 100
        paternalSurname = Limit-Text ($nameParts | Select-Object -Skip 1 -First 1) 100
        maternalSurname = Limit-Text (($nameParts | Select-Object -Skip 2) -join ' ') 100
        phone = ''
        birthday = ''
        commune = ''
        email = ''
        instagram = ''
        vip = $false
        notes = ''
        active = $true
        visits = [Collections.Generic.List[hashtable]]::new()
      }
    }

    $client = $clientsByLegacyId[$legacyId]
    $client.vip = $client.vip -or ([string]$rawValues.GetValue($row, 2) -match 'VIP')
    if (-not $client.commune) {
      $client.commune = Limit-Text (Get-TextValue $recordsSheet $row 3) 100
    }
    if (-not $client.birthday) {
      $client.birthday = Limit-Text (Get-TextValue $recordsSheet ($row + 1) 6) 60
    }
    if (-not $client.phone) {
      $client.phone = Limit-Text (Get-TextValue $recordsSheet ($row + 1) 7) 40
    }
    $client.instagram = Limit-Text (Get-TextValue $recordsSheet ($row + 1) 8) 100
    if (-not $client.email) {
      $client.email = Limit-Text (Get-TextValue $recordsSheet ($row + 1) 9) 160
    }

    for ($column = 5; $column -lt $lastColumn; $column += 2) {
      $date = Limit-Text (Get-TextValue $recordsSheet ($row + 2) ($column + 1)) 100
      $service = Limit-Text (Get-TextValue $recordsSheet ($row + 3) ($column + 1)) 300
      $colorFormula = Limit-Text (Get-TextValue $recordsSheet ($row + 4) ($column + 1)) 2000
      $stylist = Limit-Text (Get-TextValue $recordsSheet ($row + 5) ($column + 1)) 100
      $notes = Limit-Text (Get-TextValue $recordsSheet ($row + 6) ($column + 1)) 2000
      $amount = Limit-Text (Get-TextValue $recordsSheet ($row + 7) ($column + 1)) 100

      if (-not ($date -or $service -or $colorFormula -or $stylist -or $notes -or $amount)) {
        continue
      }

      $client.visits.Add(@{
        date = $date
        service = $service
        colorFormula = $colorFormula
        stylist = $stylist
        notes = $notes
        amount = $amount
      })
    }
  }

  $writes = [Collections.Generic.List[hashtable]]::new()
  $clientCount = 0
  $visitCount = 0
  $importBaseTime = [datetime]'2020-01-01T00:00:00Z'

  foreach ($legacyId in ($clientsByLegacyId.Keys | Sort-Object { [int]$_ })) {
    $client = $clientsByLegacyId[$legacyId]
    $clientId = 'client-{0:D4}' -f [int]$legacyId
    $fullName = @(
      $client.firstName,
      $client.paternalSurname,
      $client.maternalSurname
    ) | Where-Object { $_ }
    $searchText = Normalize-SearchText (
      @(
        $fullName -join ' ',
        $client.phone,
        $client.email,
        $client.commune
      ) -join ' '
    )
    $clientFields = Convert-ToFirestoreFields @{
      legacyId = [string]$legacyId
      firstName = $client.firstName
      paternalSurname = $client.paternalSurname
      maternalSurname = $client.maternalSurname
      phone = $client.phone
      birthday = $client.birthday
      commune = $client.commune
      email = $client.email
      instagram = $client.instagram
      vip = [bool]$client.vip
      notes = $client.notes
      active = $true
      searchText = Limit-Text $searchText 600
      createdAt = $importBaseTime.AddMinutes($clientCount)
      updatedAt = [datetime]::UtcNow
    }
    $writes.Add(@{
      update = @{
        name = "projects/$projectId/databases/(default)/documents/clients/$clientId"
        fields = $clientFields
      }
    })
    $clientCount++

    $visitIndex = 0
    foreach ($visit in $client.visits) {
      $visitId = 'visit-{0:D4}' -f ($visitIndex + 1)
      $visitFields = Convert-ToFirestoreFields @{
        clientId = $clientId
        date = $visit.date
        service = $visit.service
        colorFormula = $visit.colorFormula
        stylist = $visit.stylist
        notes = $visit.notes
        amount = $visit.amount
        createdAt = $importBaseTime.AddDays($clientCount).AddMinutes($visitIndex)
        updatedAt = [datetime]::UtcNow
      }
      $writes.Add(@{
        update = @{
          name = "projects/$projectId/databases/(default)/documents/clients/$clientId/visits/$visitId"
          fields = $visitFields
        }
      })
      $visitIndex++
      $visitCount++
    }
  }

  Write-Output "Clientas detectadas: $clientCount"
  Write-Output "Atenciones detectadas: $visitCount"
  Write-Output "Escrituras preparadas: $($writes.Count)"

  if (-not $Apply) {
    Write-Output 'Diagnóstico completado. No se enviaron datos.'
    exit 0
  }

  $config = Get-Content $configPath -Raw | ConvertFrom-Json
  $accessToken = $config.tokens.access_token
  if (-not $accessToken) {
    throw 'No hay una sesión de consola activa.'
  }

  Invoke-BatchWrites -Writes $writes.ToArray() -AccessToken $accessToken

  $auditId = 'initial-client-import'
  $auditFields = Convert-ToFirestoreFields @{
    entityType = 'client'
    entityId = 'initial-import'
    entityName = 'Migración inicial de fichas'
    action = 'create'
    changes = "$clientCount clientas y $visitCount atenciones importadas desde el archivo histórico"
    actorUid = 'migration'
    actorEmail = 'Importación autorizada'
    createdAt = [datetime]::UtcNow
  }
  $auditFields.changes = @{
    arrayValue = @{
      values = @(
        @{
          stringValue =
            "$clientCount clientas y $visitCount atenciones importadas desde el archivo histórico"
        }
      )
    }
  }
  Invoke-BatchWrites -Writes @(
    @{
      update = @{
        name = "projects/$projectId/databases/(default)/documents/auditLogs/$auditId"
        fields = $auditFields
      }
    }
  ) -AccessToken $accessToken

  Write-Output 'Importación completada correctamente.'
}
finally {
  if ($workbook) {
    $workbook.Close($false)
  }
  $excel.Quit()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
