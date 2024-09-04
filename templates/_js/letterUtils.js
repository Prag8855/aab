{% js %}
function formatName(gender, firstName, lastName, language='en'){
	let displayGender = {
		man: { en: 'Mr', de: 'Herr' },
		woman: { en: 'Mrs', de: 'Frau' },
		other: { en: '', de: '' },
	}[gender][language];

	if(!lastName){ // No "Dear Mr Firstname"
		displayGender = '';
	}

	if(displayGender && lastName){
		return [displayGender, lastName].join(' '); 
	}

	return [displayGender, firstName, lastName].filter(Boolean).join(' ');
}

function formatSalutations(gender, firstName, lastName, language='en'){
	if(!lastName || (gender === 'other' && !firstName)) {
		return {
			en: 'Dear Sir or Madam',
			de: 'Sehr geehrte Damen und Herren'
		}[language];
	}
	return {
		'man': {
			en: `Dear Mr ${lastName}`,
			de: `Sehr geehrter Herr ${lastName}`,
		},
		'woman': {
			en: `Dear Mrs ${lastName}`,
			de: `Sehr geehrte Frau ${lastName}`,
		},
		'other': {
			en: `Dear ${firstName} ${lastName}`,
			de: `Sehr geehrte*r ${firstName} ${lastName}`,
		},
	}[gender][language];
}

function dateFromString(str) {
	if(str.match(/\d\d\d\d-\d\d-\d\d/)){
		const [year, month, day] = str.split('-').map(n => parseInt(n, 10));
		return new Date(year, month - 1, day);
	}
	return null;
}

function formatDate(date, locale){
	if(date) {
		const dateObj = (date instanceof Date) ? date : dateFromString(date);
		return dateObj.toLocaleDateString(locale, {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
		});
	}
	return '';
}
{% endjs %}