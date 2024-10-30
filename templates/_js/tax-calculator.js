{% include '_js/constants.js' %}
{% include '_js/germanStates.js' %}
{% include '_js/health-insurance-calculator.js' %}
{% include '_js/pension-refund-calculator.js' %}
{% js %}
function isEmployed(occupation) {
	return ['employee', 'studentEmployee', 'azubi'].includes(occupation);
}

function hasSponsoredHealthInsurance(healthInsuranceType) {
	return ['ehic', 'familienversicherung-spouse', 'familienversicherung-parents'].includes(healthInsuranceType);
}

function calculateTax(yearlyIncome, opts) {
	const age = +opts.age;  // TODO: §24 EStG for 64+
	const childrenCount = +opts.childrenCount;
	const germanStateAbbr = opts.germanState; // State where you WORK, not live
	const isPayingChurchTax = !!opts.isPayingChurchTax;
	const occupation = opts.occupation;
	const taxClass = +opts.taxClass;
	const isMarried = !!opts.isMarried;
	const year = (new Date()).getFullYear();

	const zusatzbeitrag = Number.isNaN(+opts.zusatzbeitrag) ? healthInsurance.companies.average.zusatzbeitrag : +opts.zusatzbeitrag;
	const fixedHealthInsuranceCost = Number.isNaN(+opts.fixedHealthInsuranceCost) ? undefined : +opts.fixedHealthInsuranceCost; // Monthly value
	const healthInsuranceType = opts.healthInsuranceType;

	const isEmployed = occupations.isEmployed(occupation);
	const isInEastGermany = germanStates.isEastGerman(germanStateAbbr);
	const hasChildren = childrenCount > 0;

	yearlyIncome = +yearlyIncome;
	const monthlyIncome = yearlyIncome/12;

	const result = { flags: new Set() };

	/***************************************************
	* BEFORE INCOME TAX
	* Those expenses are deducted from taxable income
	***************************************************/

	/* Health insurance *******************************/

	const healthInsuranceResult = calculateHealthInsuranceContributions({ age, isMarried, childrenCount, monthlyIncome, occupation, customZusatzbeitrag: zusatzbeitrag });
	healthInsuranceResult.flags.forEach(f => result.flags.add(`kv-${f}`));

	if(hasSponsoredHealthInsurance(healthInsuranceType)) {
		result.healthInsurance = 0;
	}
	else if(fixedHealthInsuranceCost !== undefined) {
		// This is a gross oversimplification for private health insurance, but there's no way to calculate the real number.
		// TODO: mention that in the UI?
		const personalContributionRate = healthInsuranceResult.baseContribution.personalRate / healthInsuranceResult.baseContribution.totalRate;
		result.healthInsurance = fixedHealthInsuranceCost * 12 * personalContributionRate;
	}
	else {
		result.healthInsurance = healthInsuranceResult.options.custom.total.personalContribution * 12;
	}
	result.healthInsuranceDetails = healthInsuranceResult;

	const healthInsuranceVorsorgepauschaleTarif = (
		healthInsurance.selfEmployedTarif / 2
		+ result.healthInsuranceDetails.pflegeversicherung.personalRate
		+ zusatzbeitrag /2
	);

	// TODO: This breaks with a midijob income
	const healthInsuranceLohnsteuerDeduction = Math.min(yearlyIncome, healthInsurance.maxMonthlyIncome * 12) * healthInsuranceVorsorgepauschaleTarif;

	/* Unemployment insurance *************************/

	const unemploymentInsuranceResult = calculateUnemploymentInsurance(yearlyIncome, occupation, isInEastGermany);
	unemploymentInsuranceResult.flags.forEach(f => result.flags.add(`av-${f}`));
	result.unemploymentInsurance = unemploymentInsuranceResult.unemploymentInsurance;

	/* Pension insurance ******************************/

	if(isEmployed) {
		// TODO: Set rv-max-contribution flag
		result.publicPension = roundCurrency(estimateYearlyPensionContributions(year, yearlyIncome, isInEastGermany));
	}
	else {
		result.flags.add('rv-optional');
		result.publicPension = 0;
		result.publicPensionRate = 0;
	}

	/***************************************************
	* TAXABLE INCOME
	***************************************************/

	result.taxableIncome = yearlyIncome;

	if(taxClass < 6) {
		result.taxableIncome -= taxes.sonderausgabenPauschbetrag;
	}
	
	if(isEmployed) {
		/* Flat rate Lohnsteuer deductions ******************************/
		if(taxClass < 6) {
			result.taxableIncome -= taxes.arbeitnehmerpauschale;
		}

		// Simplified unemployment insurance - https://de.wikipedia.org/wiki/Vorsorgepauschale [UPEVP]
		const beitragsbemessungsgrenze = taxes.beitragsbemessungsgrenze.currentYear[isInEastGermany ? 'east' : 'west'];
		const pensionContribEmployerRate = pensions.contributionRates.currentYear / 2 / 100; // [RVSATZAN]
		const pensionLohnsteuerDeduction = Math.min(yearlyIncome, beitragsbemessungsgrenze) * pensionContribEmployerRate;

		// Minimum deduction for social contributions
		const mindestvorsorgepauschale = taxClass === 3 ? taxes.minVorsorgepauschalTaxClass3 : taxes.minVorsorgepauschal; // [VHB]
		const vorsorgepauschbetrag = Math.max(pensionLohnsteuerDeduction + healthInsuranceLohnsteuerDeduction, mindestvorsorgepauschale); // §39b Abs. 3 EStG
		result.taxableIncome -= vorsorgepauschbetrag; // [UPEVP]
	}
	else {
		/* Self-employed income tax deductions ******************************/
		result.taxableIncome -= result.healthInsurance;
	}

	/* Children tax deductions ******************************/

	// TODO: Consider Kindergeld if more beneficial
	if(false && hasChildren && taxClass !== 5 && taxClass !== 6) { // No Kinderfreitbetrag for tax class 6
		result.flags.add('kinderfreibetrag');
		result.taxableIncome = result.taxableIncome
			- childrenCount * taxes.kinderfreibetrag / 2
	}

	// TODO: Not part of lohnsteuer, only income tax
	if(false && hasChildren && taxClass === 2) {
		result.flags.add('entlastungsbetrag-alleinerziehende');
		result.taxableIncome = result.taxableIncome
			- taxes.entlastungsbetragAlleinerziehende
			- taxes.entlastungsbetragAlleinerziehendePerChild * (childrenCount - 1)
	}

	result.taxableIncome = Math.floor(result.taxableIncome);

	// TODO: Steuerklassen - Defined by § 38b
	// - sk1: single
	// - sk2: single parent
	//   - Entlastungsbetrag für Alleinerziehende of 4008€ (+240 per extra child) - Alleinerziehendenentlastungsbetrag
	// - sk3: married, earns more than spouse
	//   - Freibetrag für Betreuung, Erziehung und Ausbildung in Höhe von 2.928
	//   - Splittingverfahren all the time?
	// - sk4: married, income similar to spouse
	//   - sk4 with Faktor?
	// - sk5: married, earns less than spouse
	//   - No Kinderfreibetrag
	// - sk6: Students/retirees with a Nebenjob
	//   - No Freibetrag

	// Kinderfreibetrag: 8388€ limit? https://www.kinderinfo.de/kindergeld/kinderfreibetrag/#Dank-dem-Kinderfreibetrag-weniger-Steuern-zahlen

	// Class 3+5: the higher earner gets double the freibetrag, and the low earner no freibetrag

	// TODO: Altersentlastungsbetrag for 64+ people

	/***************************************************
	* AFTER INCOME TAX
	***************************************************/

	const isSplittingTarif = isEmployed && taxClass === 3;

	let incomeTaxResult = null;
	if (isEmployed && (taxClass === 5 || taxClass === 6)) {
		incomeTaxResult = calculateIncomeTaxClass56(result.taxableIncome)
	}
	else {
		incomeTaxResult = calculateIncomeTax(result.taxableIncome, isSplittingTarif);
	}
	incomeTaxResult.flags.forEach(f => result.flags.add(f));
	result.incomeTax = incomeTaxResult.incomeTax;

	const churchTaxResult = calculateChurchTax(result.incomeTax, germanStateAbbr);
	result.churchTaxRate = isPayingChurchTax ? churchTaxResult.churchTaxRate : 0;
	result.churchTax = isPayingChurchTax ? churchTaxResult.churchTax : 0;

	const solidarityTaxResult = calculateSolidarityTax(result.incomeTax, isSplittingTarif);
	solidarityTaxResult.flags.forEach(f => result.flags.add(f));
	result.solidarityTax = solidarityTaxResult.solidarityTax;

	// TODO: Gewerbesteuer for businesses

	result.totalDeductions = (
		result.healthInsurance
		+ result.publicPension
		+ result.unemploymentInsurance
		+ result.incomeTax
		+ result.solidarityTax
		+ result.churchTax
	);

	result.income = yearlyIncome;
	result.disposableIncome = yearlyIncome - result.totalDeductions;

	return result;
}

function calculateIncomeTax(taxableIncome, isSplittingTarif=false) {  // Einkommensteuer
	// The Splittingtarif for married couple combines the couple's income, and taxes each half equally.
	// A couple that earns 75k + 25k pays 2x income tax on 50k.
	if(isSplittingTarif) {
		const output = calculateIncomeTax(taxableIncome / 2, false);
		output.incomeTax *= 2;
		output.flags.add('splittingtarif');
		return output;
	}
	else{
		const incomeTaxFlags = new Set();

		// These values are defined by §32a EStG - https://www.gesetze-im-internet.de/estg/__32a.html
		const x = taxableIncome;
		const y = (taxableIncome - taxes.grundfreibetrag)/10000;
		const z = (taxableIncome - taxes.incomeTaxTarifZones[2].maxIncome)/10000;

		const [tarifZoneNumber, tarifZone] = Object.entries(taxes.incomeTaxTarifZones).find(
			([key, tarifZone]) => taxableIncome > tarifZone.minIncome && taxableIncome <= tarifZone.maxIncome
		);

		incomeTaxFlags.add(`income-tax-tarif-zone-${tarifZoneNumber}`);
		incomeTax = tarifZone.formula(x, y, z);
		incomeTax = Math.floor(incomeTax);

		return {
			flags: incomeTaxFlags,
			incomeTax: isSplittingTarif ? incomeTax * 2 : incomeTax,
		};
	}
}

function calculateIncomeTaxClass56(taxableIncome) { // [MST5-6] - § 39b Abs. 2 Satz 7 EstG
	const cappedTaxableIncome = Math.min(taxableIncome, taxes.incomeTaxClass56.maxIncome2); // [ZX]

	// [UP5-6]
	const incomeTaxUpperBound = calculateIncomeTax(cappedTaxableIncome * 1.25).incomeTax; // [ST1]
	const incomeTaxLowerBound = calculateIncomeTax(cappedTaxableIncome * 0.75).incomeTax; // [ST2]
	let incomeTax = Math.max(
		(incomeTaxUpperBound - incomeTaxLowerBound) * 2, // [DIFF]
		Math.floor(cappedTaxableIncome * 0.14), // [MIST]
	);

	if(taxableIncome > taxes.incomeTaxClass56.maxIncome3) {
		incomeTax += Math.floor((taxes.incomeTaxClass56.maxIncome3 - taxes.incomeTaxClass56.maxIncome2) * 0.42);
		incomeTax += Math.floor((taxableIncome - taxes.incomeTaxClass56.maxIncome3) * 0.45);
	}
	else if(taxableIncome > taxes.incomeTaxClass56.maxIncome2) {
		incomeTax += Math.floor((taxableIncome - taxes.incomeTaxClass56.maxIncome2) * 0.42);
	}
	else if (taxableIncome > taxes.incomeTaxClass56.maxIncome1){
		// [HOCH]
		const altIncomeTaxUpperBound = calculateIncomeTax(taxes.incomeTaxClass56.maxIncome1 * 1.25).incomeTax; // [ST1]
		const altIncomeTaxLowerBound = calculateIncomeTax(taxes.incomeTaxClass56.maxIncome1 * 0.75).incomeTax; // [ST2]
		let altIncomeTax = Math.max(
			(altIncomeTaxUpperBound - altIncomeTaxLowerBound) * 2, // [DIFF]
			Math.floor(taxes.incomeTaxClass56.maxIncome1 * 0.14),
		);
		altIncomeTax += Math.floor((taxableIncome - taxes.incomeTaxClass56.maxIncome1) * 0.42);
		incomeTax = Math.min(incomeTax, altIncomeTax); // [HOCH] vs [VERGL]
	}

	return {
		flags: new Set(['income-tax-class-5-6']),
		incomeTax: incomeTax,
	}
}

// Arbeitslosenversicherung, yearly
function calculateUnemploymentInsurance(yearlyIncome, occupation='employee', isInEastGermany=false) {
	const flags = new Set();
	let unemploymentInsurance = 0;

	if(occupations.isSelfEmployed(occupation)) {
		flags.add('optional');
	}
	else if(occupations.isMinijob(occupation, yearlyIncome/12)) {
		flags.add('minijob');
		flags.add('none');
	}
	else if(occupations.isUnemployed(occupation)) {
		flags.add('unemployed');
		flags.add('none');
	}
	else {
		const yearlyBeitragsbemessungsgrenze = taxes.beitragsbemessungsgrenze.currentYear[isInEastGermany ? 'east' : 'west'];
		if(yearlyIncome >= yearlyBeitragsbemessungsgrenze) {
			flags.add('max-contribution');
			unemploymentInsurance = yearlyBeitragsbemessungsgrenze * taxes.arbeitslosenversicherungRate;
		}
		else{
			// TODO: Minijob and unemployed
			unemploymentInsurance = yearlyIncome * taxes.arbeitslosenversicherungRate;
		}

		if(occupation === 'azubi'){
			flags.add('azubi'); // Same calculation but no exemption for low incomes
		}
	}
	return { flags, unemploymentInsurance }
}

// TODO: Test for tax class 3 [MSOLZSTS]
function calculateSolidarityTax(incomeTax, isSplittingTarif=false) {
	let flags = new Set();

	if(isSplittingTarif) {
		const result = calculateSolidarityTax(incomeTax / 2, false);
		result.solidarityTax *= 2;
		return result;
	}
	else {
		let solidarityTax;
		if(incomeTax > taxes.solidarity.minIncomeTax) {
			let midRateSolidarityTax = (incomeTax - taxes.solidarity.minIncomeTax) * taxes.solidarity.milderungszoneRate;
			let maxRateSolidarityTax = incomeTax * taxes.solidarity.maxRate;

			if(midRateSolidarityTax < maxRateSolidarityTax) {
				flags.add('soli-mid-rate');
				solidarityTax = midRateSolidarityTax;
			}
			else {
				flags.add('soli-max-rate');
				solidarityTax = maxRateSolidarityTax;
			}
		} else {
			flags.add('soli-zero');
			solidarityTax = 0;
		}

		return {
			flags,
			solidarityTax: roundCurrency(solidarityTax, true),
		}
	}
}

function calculateChurchTax(incomeTax, germanStateAbbr) {
	const churchTaxRate = taxes.church[germanStateAbbr] || taxes.church.default;
	return {
		churchTax: incomeTax * churchTaxRate,
		churchTaxRate,
	}
}

// TODO: unused
function calculateCapitalGainsTax(income, germanStateAbbr) {
	const churchTaxRate = taxes.church[germanStateAbbr] || taxes.church.default;
	return income / (4 + churchTaxRate);
}

// TODO: unused
function calculateMonthlyKindergeld(childrenCount) {
	return taxes.kindergeldPerChild * childrenCount;
}

// Tax classes tl;dr:
// 1 - Single
// 2 - Single parent
// 3 - Married (Besserverdiener)
// 4 - Married
// 5 - Married (Geringverdiener)
// 6 - Nebenjob

// TODO: Kindergeld

/*

MARRIED COUPLES nach §26, §26b - https://www.gesetze-im-internet.de/estg/__32a.html

- Combine income, divide by two, calculate income tax, double it (Splitting-Verfahren)

CHILDREN - https://www.gesetze-im-internet.de/estg/__32.html

If [18-21[ and unemployed and registered as jobseeker with the Bundesagentur für Arbeit

If [21-25[ and in training or a few other related exceptions

If they can't support themselves due to a disability they had before the age of 25

CHILDREN DIFFERENCES

Deducted from the income:
- 2730 child allowance for subsistence
- 1464 for upbringing and education

OTHER

- Altersentlastungsfreibetrag

*/
{% endjs %}