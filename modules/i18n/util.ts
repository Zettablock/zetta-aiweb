export const DR = {
  us: 'us',
  eu: 'eu'
}

export const REGION_CONFIG = {
  us: {
    id: 211,
    dr: DR.us,
    ldp: 'us'
  },
  ca: {
    id: 37,
    dr: DR.us,
    ldp: 'ca'
  },
  au: {
    id: 12,
    dr: DR.us,
    ldp: 'au'
  },
  nz: {
    id: 144,
    dr: DR.us,
    ldp: 'nz'
  },
  uk: {
    id: 210,
    dr: DR.eu
  },
  de: {
    id: 76,
    dr: DR.eu
  },
  fr: {
    id: 69,
    dr: DR.eu
  },
  it: {
    id: 98,
    dr: DR.eu
  },
  nl: {
    id: 141,
    dr: DR.eu
  },
  es: {
    id: 186,
    dr: DR.eu
  },
  mx: {
    id: 128,
    dr: DR.us
  },
  at: {
    id: 13,
    dr: DR.eu
  },
  be: {
    id: 20,
    dr: DR.eu
  },
  pt: {
    id: 163,
    dr: DR.eu
  },
  pl: {
    id: 162,
    dr: DR.eu
  },
  se: {
    id: 191,
    dr: DR.eu
  },
  ch: {
    id: 192,
    dr: DR.eu
  },
  ro: {
    id: 167,
    dr: DR.eu
  },
  gr: {
    id: 79,
    dr: DR.eu
  },
  cz: {
    id: 53,
    dr: DR.eu
  },
  hu: {
    id: 90,
    dr: DR.eu
  },
  ie: {
    id: 96,
    dr: DR.eu
  },
  dk: {
    id: 54,
    dr: DR.eu
  },
  fi: {
    id: 68,
    dr: DR.eu
  },
  sk: {
    id: 180,
    dr: DR.eu
  },
  si: {
    id: 181,
    dr: DR.eu
  },
  ee: {
    id: 64,
    dr: DR.eu
  },
  lv: {
    id: 108,
    dr: DR.eu
  },
  mt: {
    id: 122,
    dr: DR.eu
  },
  cy: {
    id: 52,
    dr: DR.eu
  },
  bg: {
    id: 32,
    dr: DR.eu
  },
  hr: {
    id: 50,
    dr: DR.eu
  },
  lt: {
    id: 113,
    dr: DR.eu
  },
  lu: {
    id: 114,
    dr: DR.eu
  },
  jp: {
    id: 100,
    dr: DR.us,
    ldp: 'jp'
  },
  kr: {
    id: 185,
    dr: DR.us,
    ldp: 'kr'
  },
  sa: {
    id: 174,
    dr: DR.eu,
    ldp: 'qa'
  },
  ae: {
    id: 209,
    dr: DR.eu,
    ldp: 'qa'
  },
  kw: {
    id: 105,
    dr: DR.eu,
    ldp: 'qa'
  },
  no: {
    id: 151,
    dr: DR.eu
  },
  sg: {
    id: 179,
    dr: DR.us,
    ldp: 'sg'
  },
  cl: {
    id: 42,
    dr: DR.us,
    ldp: 'br'
  },
  br: {
    id: 29,
    dr: DR.us,
    ldp: 'br'
  },
  ph: {
    id: 160,
    dr: DR.us,
    ldp: 'jp'
  },
  il: {
    id: 97,
    dr: DR.eu
  },
  my: {
    id: 119,
    dr: DR.us,
    ldp: 'sg'
  },
  qa: {
    id: 165,
    dr: DR.eu,
    ldp: 'qa'
  },
  bh: {
    id: 16,
    dr: DR.eu,
    ldp: 'qa'
  },
  om: {
    id: 152,
    dr: DR.eu,
    ldp: 'qa'
  },
  tw: {
    id: 194,
    dr: DR.us
  },
  th: {
    id: 197,
    dr: DR.us
  },
  jo: {
    id: 101,
    dr: DR.eu,
    ldp: 'qa'
  },
  za: {
    id: 184,
    dr: DR.eu
  },
  rs: {
    id: 175,
    dr: DR.eu
  },
  md: {
    id: 130,
    dr: DR.eu
  },
  me: {
    id: 134,
    dr: DR.eu
  },
  is: {
    id: 91,
    dr: DR.eu
  },
  ad: {
    id: 5,
    dr: DR.eu
  },
  ba: {
    id: 26,
    dr: DR.eu
  },
  al: {
    id: 3,
    dr: DR.eu
  },
  mk: {
    id: 116,
    dr: DR.eu
  },
  xk: {
    id: 235,
    dr: DR.eu
  }
}

type RegionType = keyof typeof REGION_CONFIG
export const REGION_ID_MAP = Object.keys(REGION_CONFIG).reduce(
  (idMap, name) => ({
    ...idMap,
    [name]: REGION_CONFIG[name as RegionType].id
  }),
  {} as Record<RegionType, number>
)

export const REGION_NAME_MAP = Object.keys(REGION_ID_MAP).reduce(
  (nameMap, name) => ({
    ...nameMap,
    [REGION_ID_MAP[name as RegionType]]: name
  }),
  {} as Record<string, RegionType>
)

export const RTL_LANG = ['ar', 'he']

export const getDR = (regionOrId: number | RegionType) => {
  if (typeof regionOrId === 'string') {
    return REGION_CONFIG[regionOrId]
  }

  return REGION_CONFIG[REGION_NAME_MAP[String(regionOrId)]]?.dr || ''
}

export const getReportDomainPrefix = (regionOrId: number | RegionType) => {
  const dr = getDR(regionOrId)
  const item = (REGION_CONFIG[REGION_NAME_MAP[regionOrId]] || {}) as any
  return item.ldp || dr || 'us'
}
