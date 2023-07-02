{% js %}
const germanStates = {
  'bw': {
    isInEastGermany: false,
    englishName: 'Baden-Württemberg',
    germanName: 'Baden-Württemberg',
  },
  'by': {
    isInEastGermany: false,
    englishName: 'Bavaria',
    germanName: 'Bayern',
  },
  'be-east': {
    isInEastGermany: true,
    englishName: 'Berlin (East)',
    germanName: 'Berlin (Ost)',
  },
  'be-west': {
    isInEastGermany: false,
    englishName: 'Berlin (West)',
    germanName: 'Berlin (West)',
  },
  'bb': {
    isInEastGermany: true,
    englishName: 'Brandenburg',
    germanName: 'Brandenburg',
  },
  'hb': {
    isInEastGermany: false,
    englishName: 'Bremen',
    germanName: 'Bremen',
  },
  'hh': {
    isInEastGermany: false,
    englishName: 'Hamburg',
    germanName: 'Hamburg',
  },
  'hr': {
    isInEastGermany: false,
    englishName: 'Hesse',
    germanName: 'Hessen',
  },
  'ni': {
    isInEastGermany: false,
    englishName: 'Lower Saxony',
    germanName: 'Niedersachsen',
  },
  'mv': {
    isInEastGermany: false,
    englishName: 'Mecklenburg-Western Pomerania',
    germanName: 'Mecklenburg-Vorpommern',
  },
  'nw': {
    isInEastGermany: false,
    englishName: 'North Rhine-Westphalia',
    germanName: 'Nordrhein-Westfalen',
  },
  'rp': {
    isInEastGermany: false,
    englishName: 'Rhineland-Palatinate',
    germanName: 'Rheinland-Pfalz',
  },
  'sl': {
    isInEastGermany: false,
    englishName: 'Saarland',
    germanName: 'Saarland',
  },
  'sn': {
    isInEastGermany: false,
    englishName: 'Saxony',
    germanName: 'Sachsen',
  },
  'st': {
    isInEastGermany: false,
    englishName: 'Saxony-Anhalt',
    germanName: 'Sachsen-Anhalt',
  },
  'sh': {
    isInEastGermany: false,
    englishName: 'Schleswig-Holstein',
    germanName: 'Schleswig-Holstein',
  },
  'th': {
    isInEastGermany: false,
    englishName: 'Thuringia',
    germanName: 'Thüringen',
  },
};

const bafogBedarfssatz = {{ GKV_BAFOG_BEDARFSSATZ }};

const healthInsurance = {
  defaultTarif: {{ GKV_BASE_CONTRIBUTION }}/100,
  selfEmployedTarif: {{ GKV_SELF_EMPLOYED_BASE_CONTRIBUTION }}/100, // The 0.6% disability tarif is optional for freelancers
  studentTarif: 0.7 * {{ GKV_BASE_CONTRIBUTION }}/100, // https://www.krankenkassen.de/gesetzliche-krankenkassen/krankenkasse-beitrag/studenten/
  minMonthlyIncome: {{ GKV_MIN_INCOME }}, // If you earn less than that, you pay the min tarif
  maxMonthlyIncome: {{ GKV_HÖCHSTBEITRAG_MIN_INCOME }}/12, // If you earn more than that, you pay the max tarif
  minFreiwilligMonthlyIncome: {{ GKV_FREIWILLIG_VERSICHERT_MIN_INCOME }}/12, // You can get private above that amount
  maxFamilienvericherungIncome: {{ GKV_FAMILIENVERSICHERUNG_MAX_INCOME }},
  maxMidijobIncome: {{ MIDIJOB_MAX_INCOME }},
  avgZusatzbeitrag: {{ GKV_AVERAGE_ZUSATZBEITRAG }}/100,
  azubiFreibetrag: {{ GKV_AZUBI_MAX_FREE_INCOME }}, // Free health insurance below this amount
  maxNebenjobIncome: {{ BEZUGSGRÖSSE_WEST }}*0.75, // Not a nebenjob above this income
  factorF: {{ GKV_FACTOR_F }},
  kskMinimumIncome: {{ KSK_MIN_INCOME }},
  companies: {
    average: {
      name: 'Average health insurance',
      zusatzbeitrag: {{ GKV_AVERAGE_ZUSATZBEITRAG }}/100,
    },
    aok: {
      name: 'AOK Nordost',
      zusatzbeitrag: 1.9/100,
    },
    barmer: {
      name: 'Barmer',
      zusatzbeitrag: 1.5/100,
    },
    hkk: {
      name: 'hkk',
      zusatzbeitrag: 0.98/100,
    },
    tk: {
      name: 'Techniker Krankenkasse',
      zusatzbeitrag: 1.2/100,
    },
  },
}

const pflegeversicherung = {
  defaultTarif: {{ PFLEGEVERSICHERUNG_NO_SURCHARGE }}/100,
  surchargeTarif: {{ PFLEGEVERSICHERUNG_WITH_SURCHARGE }}/100,
  employerTarif: {{ PFLEGEVERSICHERUNG_NO_SURCHARGE }}/100/2, // Employer doesn't contribute to surcharge
  defaultTarifMaxAge: 22, // Above this age, if you don't have kids, you pay the surchargeTarif
};

const taxes = {
  church: {
    default: {{ CHURCH_TAX_RATE }} / 100,
    bw: {{ CHURCH_TAX_RATE_BW_BY }} / 100,
    by: {{ CHURCH_TAX_RATE_BW_BY }} / 100,
  },
  arbeitslosenversicherungRate: {{ ARBEITSLOSENVERSICHERUNG_EMPLOYEE_RATE }}/100,
  beitragsbemessungsgrenze: {
    2000: { west: 4500 * 12, east: 3750 * 12 },
    2001: { west: 4500 * 12, east: 3750 * 12 },
    2002: { west: 4500 * 12, east: 3750 * 12 },
    2003: { west: 5100 * 12, east: 4250 * 12 },
    2004: { west: 5150 * 12, east: 4350 * 12 },
    2005: { west: 5200 * 12, east: 4400 * 12 },
    2006: { west: 5250 * 12, east: 4400 * 12 },
    2007: { west: 5250 * 12, east: 4550 * 12 },
    2008: { west: 5300 * 12, east: 4500 * 12 },
    2009: { west: 5400 * 12, east: 4550 * 12 },
    2010: { west: 5500 * 12, east: 4650 * 12 },
    2011: { west: 5500 * 12, east: 4800 * 12 },
    2012: { west: 5600 * 12, east: 4800 * 12 },
    2013: { west: 5800 * 12, east: 4900 * 12 },
    2014: { west: 5950 * 12, east: 5000 * 12 },
    2015: { west: 6050 * 12, east: 5200 * 12 },
    2016: { west: 6200 * 12, east: 5400 * 12 },
    2017: { west: 6350 * 12, east: 5700 * 12 },
    2018: { west: 6500 * 12, east: 5800 * 12 },
    2019: { west: 6700 * 12, east: 6150 * 12 },
    2020: { west: 6900 * 12, east: 6450 * 12 },
    2021: { west: 7100 * 12, east: 6700 * 12 },
    2022: { west: 7050 * 12, east: 6750 * 12 },
    currentYear: { west: {{ BEITRAGSBEMESSUNGSGRENZE_WEST }}, east: {{ BEITRAGSBEMESSUNGSGRENZE_EAST }} },
    2023: { west: {{ BEITRAGSBEMESSUNGSGRENZE_WEST }}, east: {{ BEITRAGSBEMESSUNGSGRENZE_EAST }} },
    2024: { west: {{ BEITRAGSBEMESSUNGSGRENZE_WEST }}, east: {{ BEITRAGSBEMESSUNGSGRENZE_EAST }} }, // ESTIMATED (2023)
    2025: { west: {{ BEITRAGSBEMESSUNGSGRENZE_WEST }}, east: {{ BEITRAGSBEMESSUNGSGRENZE_EAST }} }, // ESTIMATED (2023)
    2026: { west: {{ BEITRAGSBEMESSUNGSGRENZE_WEST }}, east: {{ BEITRAGSBEMESSUNGSGRENZE_EAST }} }, // ESTIMATED (2023)
    2027: { west: {{ BEITRAGSBEMESSUNGSGRENZE_WEST }}, east: {{ BEITRAGSBEMESSUNGSGRENZE_EAST }} }, // ESTIMATED (2023)
  },
  grundfreibetrag: {{ GRUNDFREIBETRAG }},
  kinderfreibetrag: {{ KINDERFREIBETRAG }},
  entlastungsbetragAlleinerziehende: {{ ENTLASTUNGSBETRAG_ALLEINERZIEHENDE }},
  entlastungsbetragAlleinerziehendePerChild: {{ ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_EXTRA_CHILD }},
  kindergeldPerChild: {{ KINDERGELD }},
  solidarity: { // https://www.finanztip.de/solidaritaetszuschlag/
    minIncomeTax: {{ SOLIDARITY_TAX_MILDERUNGSZONE_MIN_INCOME_TAX }},  // Above this, you pay solidarity tax
    milderungszoneRate: 0.119, // percent of incomeTax - minIncomeTax
    maxRate: 0.055,
  },
  minVorsorgepauschal: {{ VORSORGEPAUSCHAL_MIN }},
  minVorsorgepauschalTaxClass3: {{ VORSORGEPAUSCHAL_MIN_TAX_CLASS_3 }},
  incomeTaxTarifZones: {  // §32a EStG
    1: {
      formula: (x, y, z) => 0,
      minIncome: -Infinity,
      maxIncome: {{ GRUNDFREIBETRAG }},
    },
    2: {
      formula: (x, y, z) => (979.18 * y + 1400) * y,
      minIncome: {{ GRUNDFREIBETRAG }},
      maxIncome: {{ INCOME_TAX_TARIF_2_MAX_INCOME }},
    },
    3: {
      formula: (x, y, z) => (192.59 * z + 2397) * z + 966.53,
      minIncome: {{ INCOME_TAX_TARIF_2_MAX_INCOME }},
      maxIncome: {{ INCOME_TAX_TARIF_3_MAX_INCOME }},
    },
    4: {
      formula: (x, y, z) => 0.42 * x - 9972.98,
      minIncome: {{ INCOME_TAX_TARIF_3_MAX_INCOME }},
      maxIncome: {{ INCOME_TAX_TARIF_4_MAX_INCOME }},
    },
    5: {
      formula: (x, y, z) => {{ INCOME_TAX_MAX_RATE }} / 100 * x - 18307.73,
      minIncome: {{ INCOME_TAX_TARIF_4_MAX_INCOME }},
      maxIncome: Infinity,
    },
  },
  incomeTaxClass56: {
    maxIncome1: {{ INCOME_TAX_CLASS_56_LIMIT_1 }},
    maxIncome2: {{ INCOME_TAX_CLASS_56_LIMIT_2 }},
    maxIncome3: {{ INCOME_TAX_CLASS_56_LIMIT_3 }},
  },
  maxMinijobIncome: {{ MINIJOB_MAX_INCOME }}, // Max monthly income to be considered a minijobber
  arbeitnehmerpauschale: {{ ARBEITNEHMERPAUSCHALE }}, // Fixed yearly income tax deduction for employees
  sonderausgabenPauschbetrag: {{ SONDERAUSGABEN_PAUSCHBETRAG }}, // Fixed yearly income tax deduction
};

// https://github.com/mledoze/countries/blob/master/dist/countries.json
const brexitDate = new Date(2021, 0, 1);
const countries = {"BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria", "BA": "Bosnia and Herzegovina", "BB": "Barbados", "WF": "Wallis and Futuna", "BL": "Saint Barthelemy", "BM": "Bermuda", "BN": "Brunei", "BO": "Bolivia", "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BT": "Bhutan", "JM": "Jamaica", "BV": "Bouvet Island", "BW": "Botswana", "WS": "Samoa", "BQ": "Bonaire, Saint Eustatius and Saba ", "BR": "Brazil", "BS": "Bahamas", "JE": "Jersey", "BY": "Belarus", "BZ": "Belize", "RU": "Russia", "RW": "Rwanda", "RS": "Serbia", "TL": "East Timor", "RE": "Reunion", "TM": "Turkmenistan", "TJ": "Tajikistan", "RO": "Romania", "TK": "Tokelau", "GW": "Guinea-Bissau", "GU": "Guam", "GT": "Guatemala", "GS": "South Georgia and the South Sandwich Islands", "GR": "Greece", "GQ": "Equatorial Guinea", "GP": "Guadeloupe", "JP": "Japan", "GY": "Guyana", "GG": "Guernsey", "GF": "French Guiana", "GE": "Georgia", "GD": "Grenada", "GB": "United Kingdom", "GA": "Gabon", "SV": "El Salvador", "GN": "Guinea", "GM": "Gambia", "GL": "Greenland", "GI": "Gibraltar", "GH": "Ghana", "OM": "Oman", "TN": "Tunisia", "JO": "Jordan", "HR": "Croatia", "HT": "Haiti", "HU": "Hungary", "HK": "Hong Kong", "HN": "Honduras", "HM": "Heard Island and McDonald Islands", "VE": "Venezuela", "PR": "Puerto Rico", "PS": "Palestinian Territory", "PW": "Palau", "PT": "Portugal", "SJ": "Svalbard and Jan Mayen", "PY": "Paraguay", "IQ": "Iraq", "PA": "Panama", "PF": "French Polynesia", "PG": "Papua New Guinea", "PE": "Peru", "PK": "Pakistan", "PH": "Philippines", "PN": "Pitcairn", "PL": "Poland", "PM": "Saint Pierre and Miquelon", "ZM": "Zambia", "EH": "Western Sahara", "EE": "Estonia", "EG": "Egypt", "ZA": "South Africa", "EC": "Ecuador", "IT": "Italy", "VN": "Vietnam", "SB": "Solomon Islands", "ET": "Ethiopia", "SO": "Somalia", "ZW": "Zimbabwe", "SA": "Saudi Arabia", "ES": "Spain", "ER": "Eritrea", "ME": "Montenegro", "MD": "Moldova", "MG": "Madagascar", "MF": "Saint Martin", "MA": "Morocco", "MC": "Monaco", "UZ": "Uzbekistan", "MM": "Myanmar", "ML": "Mali", "MO": "Macao", "MN": "Mongolia", "MH": "Marshall Islands", "MK": "North Macedonia", "MU": "Mauritius", "MT": "Malta", "MW": "Malawi", "MV": "Maldives", "MQ": "Martinique", "MP": "Northern Mariana Islands", "MS": "Montserrat", "MR": "Mauritania", "IM": "Isle of Man", "UG": "Uganda", "TZ": "Tanzania", "MY": "Malaysia", "MX": "Mexico", "IL": "Israel", "FR": "France", "IO": "British Indian Ocean Territory", "SH": "Saint Helena", "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands", "FM": "Micronesia", "FO": "Faroe Islands", "NI": "Nicaragua", "NL": "Netherlands", "NO": "Norway", "NA": "Namibia", "VU": "Vanuatu", "NC": "New Caledonia", "NE": "Niger", "NF": "Norfolk Island", "NG": "Nigeria", "NZ": "New Zealand", "NP": "Nepal", "NR": "Nauru", "NU": "Niue", "CK": "Cook Islands", "XK": "Kosovo", "CI": "Ivory Coast", "CH": "Switzerland", "CO": "Colombia", "CN": "China", "CM": "Cameroon", "CL": "Chile", "CC": "Cocos Islands", "CA": "Canada", "CG": "Republic of the Congo", "CF": "Central African Republic", "CD": "Democratic Republic of the Congo", "CZ": "Czech Republic", "CY": "Cyprus", "CX": "Christmas Island", "CR": "Costa Rica", "CW": "Curacao", "CV": "Cape Verde", "CU": "Cuba", "SZ": "Swaziland", "SY": "Syria", "SX": "Sint Maarten", "KG": "Kyrgyzstan", "KE": "Kenya", "SS": "South Sudan", "SR": "Suriname", "KI": "Kiribati", "KH": "Cambodia", "KN": "Saint Kitts and Nevis", "KM": "Comoros", "ST": "Sao Tome and Principe", "SK": "Slovakia", "KR": "South Korea", "SI": "Slovenia", "KP": "North Korea", "KW": "Kuwait", "SN": "Senegal", "SM": "San Marino", "SL": "Sierra Leone", "SC": "Seychelles", "KZ": "Kazakhstan", "KY": "Cayman Islands", "SG": "Singapore", "SE": "Sweden", "SD": "Sudan", "DO": "Dominican Republic", "DM": "Dominica", "DJ": "Djibouti", "DK": "Denmark", "VG": "British Virgin Islands", "DE": "Germany", "YE": "Yemen", "DZ": "Algeria", "US": "United States", "UY": "Uruguay", "YT": "Mayotte", "UM": "United States Minor Outlying Islands", "LB": "Lebanon", "LC": "Saint Lucia", "LA": "Laos", "TV": "Tuvalu", "TW": "Taiwan", "TT": "Trinidad and Tobago", "TR": "Turkey", "LK": "Sri Lanka", "LI": "Liechtenstein", "LV": "Latvia", "TO": "Tonga", "LT": "Lithuania", "LU": "Luxembourg", "LR": "Liberia", "LS": "Lesotho", "TH": "Thailand", "TF": "French Southern Territories", "TG": "Togo", "TD": "Chad", "TC": "Turks and Caicos Islands", "LY": "Libya", "VA": "Vatican", "VC": "Saint Vincent and the Grenadines", "AE": "United Arab Emirates", "AD": "Andorra", "AG": "Antigua and Barbuda", "AF": "Afghanistan", "AI": "Anguilla", "VI": "U.S. Virgin Islands", "IS": "Iceland", "IR": "Iran", "AM": "Armenia", "AL": "Albania", "AO": "Angola", "AQ": "Antarctica", "AS": "American Samoa", "AR": "Argentina", "AU": "Australia", "AT": "Austria", "AW": "Aruba", "IN": "India", "AX": "Aland Islands", "AZ": "Azerbaijan", "IE": "Ireland", "ID": "Indonesia", "UA": "Ukraine", "QA": "Qatar", "MZ": "Mozambique"};
const euCountries = new Set(['BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'GR', 'ES', 'FR', 'HR', 'IT', 'CY', 'LV', 'LT', 'LU', 'HU', 'MT', 'NL', 'AT', 'PL', 'PT', 'RO', 'SI', 'SK', 'FI', 'SE']);
const eeaCountries = new Set([...euCountries].concat(['IS', 'LI', 'NO', 'CH']));

const pensions = {
  contractingCountries: new Set(['AL', 'AU', 'BR', 'CA', 'CL', 'IN', 'IL', 'JP', 'KR', 'MA', 'ME', 'PH', 'TN', 'TR', 'UY', 'US']),
  balkanBlockCountries: new Set(['BA', 'MK', 'RS', 'XK', 'ME']),
  disqualifyingCountries: new Set(['BA', 'MK', 'RS', 'XK', 'ME', 'TR']),
  contributionRates: {
    2000: 19.3,
    2001: 19.1,
    2002: 19.1,
    2003: 19.5,
    2004: 19.5,
    2005: 19.5,
    2006: 19.5,
    2007: 19.9,
    2008: 19.9,
    2009: 19.9,
    2010: 19.9,
    2011: 19.9,
    2012: 19.6,
    2013: 18.9,
    2014: 18.9,
    2015: 18.7,
    2016: 18.7,
    2017: 18.7,
    2018: 18.6,
    2019: 18.6,
    2020: 18.6,
    2021: 18.6,
    2022: 18.6,
    currentYear: {{ RENTENVERSICHERUNG_TOTAL_CONTRIBUTION }},
    2023: 18.6,
    2024: 18.6, // ESTIMATED (2022)
    2025: 18.6, // ESTIMATED (2022)
    2026: 18.6, // ESTIMATED (2022)
  },
}

const defaults = {  // Percentages are stored as full amounts, unlike elsewhere
  age: 25,
  childrenCount: 0,
  church: 'other',
  isMarried: false,
  occupation: 'employee',
  state: 'be-east',
  useMonthlyIncome: false,
  yearlyIncome: Math.round({{ MEDIAN_INCOME_GERMANY }}/100) * 100,
  healthInsuranceType: 'unknown',
  privateHealthInsuranceCost: 500, // € per month
  publicHealthInsuranceZusatzbeitrag: healthInsurance.companies.average.zusatzbeitrag * 100, // %
};
{% endjs %}