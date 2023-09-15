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

function stateName(stateObj) {
	if(stateObj.englishName.startsWith('Berlin') || stateObj.englishName === stateObj.germanName) {
		return stateObj.englishName;
	}
	return `${stateObj.englishName} (${stateObj.germanName})`;
}
{% endjs %}