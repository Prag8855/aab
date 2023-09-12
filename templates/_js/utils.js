{% js %}
function scrollIntoViewIfNeeded(element){
	if(element.getBoundingClientRect().bottom > window.innerHeight) {
		element.scrollIntoView(false);
	}
	if (element.getBoundingClientRect().top < 0) {
		element.scrollIntoView();
	}
}

function formatPercent(num, addSymbol=true) {
	const formattedNum = num.toLocaleString('en-GB', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 3,
	});
	return addSymbol ? `${formattedNum}%` : formattedNum;
}

function formatPersonName(gender, firstName, lastName){
	let displayGender = {
		man: { en: 'Mr', de: 'Herr' },
		woman: { en: 'Mrs', de: 'Frau' },
		other: { en: '', de: '' },
	}[gender];

	if(!lastName){ // No "Dear Mr Firstname"
		displayGender = '';
	}
	return {
		en: [
			displayGender.en, firstName, lastName
		].filter(Boolean).join(' '),
		de: [
			displayGender.de, firstName, lastName
		].filter(Boolean).join(' '),
	};
}

function formatSalutations(gender, firstName, lastName){
	if(!lastName || (gender === 'other' && !firstName)) {
		return {
			en: 'Dear Sir or Madam',
			de: 'Sehr geehrte Damen und Herren'
		};
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
	}[gender];
}

function stateName(stateObj) {
	if(stateObj.englishName.startsWith('Berlin') || stateObj.englishName === stateObj.germanName) {
		return stateObj.englishName;
	}
	return `${stateObj.englishName} (${stateObj.germanName})`;
}

function getDefault(key, fallback) {
	if (typeof sessionStorage === 'object') {
		try {
			const value = localStorage.getItem(key)
			return value === null ? defaults[key] : value;
		} catch (e) {}
		return fallback;
	}
}
function getDefaultNumber(key, fallback) { return +getDefault(key, fallback) }
function getDefaultBoolean(key, fallback) {
	const storedValue = getDefault(key); // localStorage stores strings, so "true" or "false"
	return storedValue ? storedValue === 'true' : !!fallback;
}

function setDefault(key, value) {
	if(value === null || value === undefined){
		return;
	}
	if (typeof sessionStorage === 'object') {
		try {
			localStorage.setItem(key, value);
			defaults[key] = value;
			return true;
		} catch (e) {}
		return false;
	}
}
function setDefaultString(key, value) { setDefault(key, value ? '1' : '')}
function setDefaultNumber(key, value) { setDefault(key, +value)}
function setDefaultBoolean(key, value) { setDefault(key, !!value)}

async function fillAndSavePDF(pdfDoc, textFields, checkboxFields, outputFileName) {
	const pdfForm = pdfDoc.getForm();

	Object.entries(textFields || {}).forEach(([fieldName, value]) => {
		pdfForm.getTextField(fieldName).setText(value);
	});
	Object.entries(checkboxFields || {}).forEach(([fieldName, value]) => {
		if(value){
			pdfForm.getCheckBox(fieldName).check(value);
		}
		else {
			pdfForm.getCheckBox(fieldName).uncheck(value);
		}
	});

	const blob = new Blob(
		[new Uint8Array(await pdfDoc.save())],
		{type: "application/pdf"}
	);
	const link = document.createElement('a');
	link.href=window.URL.createObjectURL(blob);
	link.download=outputFileName;
	link.click();

	plausible('PDF generator', { props: { stage: 'download' }});
}

function loadScript(src) {
	return new Promise(function(resolve, reject) {
		const script = document.createElement('script');
		let resolved = false;
		script.type = 'text/javascript';
		script.src = src;
		script.async = true;
		script.onerror = function(err) {
			reject(err, s);
		};
		script.onload = script.onreadystatechange = function() {
			if (!resolved && (!this.readyState || this.readyState == 'complete')) {
				resolved = true;
				resolve();
			}
		};
		const t = document.getElementsByTagName('script')[0];
		t.parentElement.insertBefore(script, t);
	});
}

const occupations = {
	isEmployed: (occupation) => ['employee', 'azubi', 'studentEmployee'].includes(occupation),
	isSelfEmployed: (occupation) => ['selfEmployed', 'studentSelfEmployed'].includes(occupation),
	isUnemployed: (occupation) => ['unemployed', 'student'].includes(occupation),
	isMinijob: (occupation, monthlyIncome) => ['employee', 'studentEmployee'].includes(occupation) && monthlyIncome <= taxes.maxMinijobIncome,
	isLowIncome: (monthlyIncome) => monthlyIncome <= taxes.maxMinijobIncome,
};


{% endjs %}