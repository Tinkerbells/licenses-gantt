function getRandomDate(): string {
  const start = new Date(2022, 0, 1)
  const end = new Date(2026, 11, 31)
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return randomDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
}

// Helper function to generate random quantity (1 for subscriptions, 1-200 for licenses)
function getRandomQuantity(articleCode: string): number {
  if (articleCode === 'Подписка Directum') {
    return 1
  }
  else {
    return Math.floor(Math.random() * 200) + 1
  }
}
const vendors = [
  'Microsoft',
  'Oracle',
  'SAP',
  'IBM',
  'Adobe',
  'Salesforce',
  'VMware',
  'Cisco',
  'Red Hat',
  'Kaspersky',
  'Symantec',
  'Autodesk',
]

// List of possible customer names based on the sample data
const customerNames = [
  'ООО "ГАЗПРОМ ТРАНСГАЗ ЕКАТЕРИНБУРГ"',
  'ООО "Газпром добыча Оренбург"',
  'ООО "ГАЗПРОМ ДОБЫЧА ШЕЛЬФ ЮЖНО-САХАЛИНСК"',
  'ООО "ГАЗПРОМ ДОБЫЧА ЯМБУРГ"',
  'ООО "ГАЗПРОМ ИНВЕСТ"',
  'ООО "ГАЗПРОМ КОМПЛЕКТАЦИЯ"',
  'ООО "ГАЗПРОМ ПХГ"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ КРАСНОДАР"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ МАХАЧКАЛА"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ САНКТ-ПЕТЕРБУРГ"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ САРАТОВ"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ СТАВРОПОЛЬ"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ СУРГУТ"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ ТОМСК"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ УХТА"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ ЧАЙКОВСКИЙ"',
  'ООО "ГАЗПРОМ ЭЭС"',
  'ООО "ГАЗПРОМ ДОБЫЧА НАДЫМ"',
  'ООО "ГАЗПРОМ ТРАНСГАЗ ЮГОРСК"',
  'ООО "АКИМ ДЕВЕЛОПМЕНТ"',
  'ООО "ГАЗПРОМ МЕЖРЕГИОНГАЗ ИНЖИНИРИНГ"',
  'ООО "ГАЗПРОМ МЕЖРЕГИОНГАЗ КИРОВ"',
]

// Generate additional fictitious company names for more variety
for (let i = 0; i < 30; i++) {
  const regions = [
    'МОСКВА',
    'КАЗАНЬ',
    'НОВОСИБИРСК',
    'ВЛАДИВОСТОК',
    'КАЛИНИНГРАД',
    'ВОЛГОГРАД',
    'АСТРАХАНЬ',
    'ТЮМЕНЬ',
    'ОМСК',
    'БАРНАУЛ',
  ]
  const types = [
    'ТРАНСГАЗ',
    'ДОБЫЧА',
    'ИНВЕСТ',
    'СТРОЙ',
    'МОНТАЖ',
    'КОМПЛЕКТ',
    'СНАБ',
    'ЭНЕРГО',
    'СТРОЙ',
    'ТЕХ',
  ]
  const randomRegion = regions[Math.floor(Math.random() * regions.length)]
  const randomType = types[Math.floor(Math.random() * types.length)]
  customerNames.push(`ООО "ГАЗПРОМ ${randomType} ${randomRegion}"`)
}

// List of possible article codes
const articleCodes = [
  'Подписка Directum',
  'АПКШ Континент СД 3.М 01425',
  'Система защиты информации ViPNet',
  'Корпоративный портал',
  'Система электронного документооборота',
  'Антивирусное ПО "Касперский"',
  'Система мониторинга Zabbix',
  '1С:Предприятие',
  'Microsoft Exchange Server',
  'SAP ERP',
]

// List of possible license names
const licenseNames = [
  '',
  'Промышленная лицензия',
  'Комплексная поставка',
  'Базовая лицензия',
  'Расширенная лицензия',
  'Корпоративная лицензия',
  'Серверная лицензия',
  'Клиентская лицензия',
  'Тестовая лицензия',
  'Образовательная лицензия',
]

// List of possible terms
const terms = [
  '1 год',
  'Бессрочный',
  '3 года',
  '6 месяцев',
  '2 года',
  '5 лет',
]

// Generate 1000 mock license entries
export function generateMockData(count: number) {
  const licenses = []

  for (let i = 1; i <= count; i++) {
    // Randomly select values for each field
    const articleCode = articleCodes[Math.floor(Math.random() * articleCodes.length)]
    const quantity = getRandomQuantity(articleCode)

    // Set appropriate price range based on article code
    let unitPrice: number
    if (articleCode === 'Подписка Directum') {
      unitPrice = Math.round(Math.random() * 50000000 + 500000)
    }
    else if (articleCode === 'АПКШ Континент СД 3.М 01425') {
      unitPrice = Math.round(Math.random() * 190000 + 10000)
    }
    else {
      unitPrice = Math.round(Math.random() * 1000000 + 50000)
    }

    // Add the new license entry
    licenses.push({
      id: i,
      expirationDate: getRandomDate(),
      customer: customerNames[Math.floor(Math.random() * customerNames.length)],
      articleCode,
      licenseName: articleCode === 'Подписка Directum' ? '' : licenseNames[Math.floor(Math.random() * licenseNames.length)],
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      term: articleCode === 'Подписка Directum' ? '1 год' : terms[Math.floor(Math.random() * terms.length)],
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
    })
  }

  return licenses
}
