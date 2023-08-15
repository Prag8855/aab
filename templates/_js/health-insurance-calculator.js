{% include '_js/constants.js' %}
{% js %}

function getBoundedMonthlyIncome(monthlyIncome){
	// The income limited by the min and max health insurance contributions
	return Math.min(healthInsurance.maxMonthlyIncome, Math.max(monthlyIncome, healthInsurance.minMonthlyIncome));
}

function getInsurerOptions(customZusatzbeitrag){
	const allInsurers = Object.entries(healthInsurance.companies);
	if(customZusatzbeitrag !== undefined) {
		// Add an extra option with the user-specified Zusatzbeitrag
		allInsurers.push([
			'custom',
			{
				name: 'Other health insurer',
				zusatzbeitrag: customZusatzbeitrag,
			}
		]);
	}
	return allInsurers;
}

function calculatePflegeversicherungRate(age, childrenCount){
	if (age > pflegeversicherung.defaultTarifMaxAge && childrenCount === 0) {
		return pflegeversicherung.surchargeTarif;
	}
	return pflegeversicherung.defaultTarif;
}

function calculateHealthInsuranceForMidijob(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['midijob']),
		tarif: 'midijob',
	};

	/***************************************************
	* Monthly income
	* According to Gleitzone formula: §20 Abs. 2a SGB VI
	***************************************************/

	const adjustedIncomeEmployer = (
		healthInsurance.factorF * taxes.maxMinijobIncome
		+ (
			(healthInsurance.maxMidijobIncome / (healthInsurance.maxMidijobIncome-taxes.maxMinijobIncome))
			- (
				(
					taxes.maxMinijobIncome
					/ (healthInsurance.maxMidijobIncome - taxes.maxMinijobIncome)
				)
				* healthInsurance.factorF
			)
		) * (monthlyIncome - taxes.maxMinijobIncome)
	);

	const adjustedIncomeEmployee = (
		(healthInsurance.maxMidijobIncome / (healthInsurance.maxMidijobIncome-taxes.maxMinijobIncome))
		* (monthlyIncome - taxes.maxMinijobIncome)
	);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.defaultTarif;
	out.baseContribution.totalContribution = roundCurrency(adjustedIncomeEmployer * out.baseContribution.totalRate);

	out.baseContribution.employerRate = healthInsurance.defaultTarif / 2;
	out.baseContribution.personalRate = out.baseContribution.totalRate - out.baseContribution.employerRate;
	out.baseContribution.personalContribution = roundCurrency(adjustedIncomeEmployee * out.baseContribution.personalRate);
	out.baseContribution.employerContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.personalContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = calculatePflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncomeEmployer * out.pflegeversicherung.totalRate);

	out.pflegeversicherung.employerRate = pflegeversicherung.employerTarif;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate - out.pflegeversicherung.employerRate;
	out.pflegeversicherung.personalContribution = roundCurrency(
		(out.pflegeversicherung.totalRate - pflegeversicherung.defaultTarif) * adjustedIncomeEmployer
		+ out.pflegeversicherung.personalRate * adjustedIncomeEmployee // The childless surcharge is not covered by the employer
	);
	out.pflegeversicherung.employerContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.personalContribution);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(krankenkasse.zusatzbeitrag * adjustedIncomeEmployer);
		options[krankenkasseKey].zusatzbeitrag.employerRate = krankenkasse.zusatzbeitrag / 2;
		options[krankenkasseKey].zusatzbeitrag.personalRate = krankenkasse.zusatzbeitrag / 2;
		options[krankenkasseKey].zusatzbeitrag.personalContribution = roundCurrency(adjustedIncomeEmployee * options[krankenkasseKey].zusatzbeitrag.personalRate);
		options[krankenkasseKey].zusatzbeitrag.employerContribution = roundCurrency(options[krankenkasseKey].zusatzbeitrag.totalContribution - options[krankenkasseKey].zusatzbeitrag.personalContribution);


		const finalTotal = field => out.baseContribution[field] + out.pflegeversicherung[field] + options[krankenkasseKey].zusatzbeitrag[field];
		options[krankenkasseKey].total = {
			totalRate: finalTotal('totalRate'),
			employerRate: finalTotal('employerRate'),
			personalRate: finalTotal('personalRate'),
			totalContribution: roundCurrency(finalTotal('totalContribution')),
			employerContribution: roundCurrency(finalTotal('employerContribution')),
			personalContribution: roundCurrency(finalTotal('personalContribution')),
		}

		return options;
	}, {});

	return out;
}

function calculateHealthInsuranceForSelfEmployment(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['private']),
		tarif: 'selfEmployed',
	};

	const adjustedIncome = getBoundedMonthlyIncome(monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.selfEmployedTarif;
	out.baseContribution.totalContribution = roundCurrency(healthInsurance.selfEmployedTarif * adjustedIncome);
	out.baseContribution.employerRate = 0;
	out.baseContribution.employerContribution = 0;
	out.baseContribution.personalRate = out.baseContribution.totalRate;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = calculatePflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.totalRate);
	out.pflegeversicherung.employerRate = 0;
	out.pflegeversicherung.employerContribution = 0;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate;
	out.pflegeversicherung.personalContribution = out.pflegeversicherung.totalContribution;


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(adjustedIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);
		options[krankenkasseKey].zusatzbeitrag.employerRate = 0;
		options[krankenkasseKey].zusatzbeitrag.employerContribution = 0;
		options[krankenkasseKey].zusatzbeitrag.personalRate = options[krankenkasseKey].zusatzbeitrag.totalRate;
		options[krankenkasseKey].zusatzbeitrag.personalContribution = options[krankenkasseKey].zusatzbeitrag.totalContribution;

		const finalTotal = field => out.baseContribution[field] + out.pflegeversicherung[field] + options[krankenkasseKey].zusatzbeitrag[field];
		options[krankenkasseKey].total = {
			totalRate: finalTotal('totalRate'),
			employerRate: finalTotal('employerRate'),
			personalRate: finalTotal('personalRate'),
			totalContribution: roundCurrency(finalTotal('totalContribution')),
			employerContribution: roundCurrency(finalTotal('employerContribution')),
			personalContribution: roundCurrency(finalTotal('personalContribution')),
		}

		return options;
	}, {});

	return out;
}

function calculateHealthInsuranceForStudent(age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['student', 'private']),
		tarif: 'student',
	};

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};

	// Students pay a fixed amount: 70% of the normal rate * the bafogBedarfssatz
	out.baseContribution.totalRate = healthInsurance.studentTarif;
	out.baseContribution.totalContribution = roundCurrency(healthInsurance.studentTarif * bafogBedarfssatz);

	// TODO: How do employers contribute to student health insurance?
	out.baseContribution.employerRate = 0;
	out.baseContribution.personalRate = undefined;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;
	out.baseContribution.employerContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.personalContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};

	// TODO: How does an employer contribute to a student's Pflegeversicherung?
	out.pflegeversicherung.totalRate = calculatePflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(out.pflegeversicherung.totalRate * bafogBedarfssatz);
	out.pflegeversicherung.employerRate = 0;
	out.pflegeversicherung.employerContribution = 0;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate - out.pflegeversicherung.employerRate;
	out.pflegeversicherung.personalContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.employerContribution);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(bafogBedarfssatz * options[krankenkasseKey].zusatzbeitrag.totalRate);
		options[krankenkasseKey].zusatzbeitrag.employerRate = 0;
		options[krankenkasseKey].zusatzbeitrag.employerContribution = 0;
		options[krankenkasseKey].zusatzbeitrag.personalRate = options[krankenkasseKey].zusatzbeitrag.totalRate - options[krankenkasseKey].zusatzbeitrag.employerRate;
		options[krankenkasseKey].zusatzbeitrag.personalContribution = roundCurrency(options[krankenkasseKey].zusatzbeitrag.totalContribution - options[krankenkasseKey].zusatzbeitrag.employerContribution);

		const finalTotal = field => out.baseContribution[field] + out.pflegeversicherung[field] + options[krankenkasseKey].zusatzbeitrag[field];
		options[krankenkasseKey].total = {
			totalRate: finalTotal('totalRate'),
			employerRate: finalTotal('employerRate'),
			personalRate: finalTotal('personalRate'),
			totalContribution: roundCurrency(finalTotal('totalContribution')),
			employerContribution: roundCurrency(finalTotal('employerContribution')),
			personalContribution: roundCurrency(finalTotal('personalContribution')),
		}

		return options;
	}, {});

	return out;
}

function calculatePflegeversicherung(monthlyIncome, adjustedMonthlyIncome, adjustedMonthlyIncomeEmployee, age, hasChildren, healthInsuranceTarif){
	/***************************************************
	* Pflegeversicherung
	***************************************************/

	// TODO: Different employer contribution in Sachsen. See [PVS] and [PVSATZAN]
	// TODO: Different employee contribution in tax class 3. See [PVZ]

	const output = {
		flags: new Set(),
	};

	// Total rate
	if (age > pflegeversicherung.defaultTarifMaxAge && !hasChildren) {
		output.totalRate = pflegeversicherung.surchargeTarif
		output.flags.add('pflegeversicherung-surcharge');
	}
	else {
		output.totalRate = pflegeversicherung.defaultTarif
	}

	// Total contribution
	if(healthInsuranceTarif === 'student') {
		output.totalContribution = output.totalRate * bafogBedarfssatz;
	}
	else {
		output.totalContribution = output.totalRate * adjustedMonthlyIncome;
	}

	// Personal + employer contributions
	if(healthInsuranceTarif === 'azubi' && adjustedMonthlyIncome <= healthInsurance.azubiFreibetrag) { // Below this, the employer pays everything
		output.employerRate = output.totalRate;
		output.employerContribution = output.totalContribution;
		output.personalRate = 0;
		output.personalContribution = 0;
	}
	else if(healthInsuranceTarif === 'selfPay' || healthInsuranceTarif === 'selfEmployed') {
		output.employerRate = 0;
		output.employerContribution = 0;
		output.personalRate = output.totalRate;
		output.personalContribution = output.totalContribution;
	}
	else {
		output.employerRate = pflegeversicherung.employerTarif;
		output.employerContribution = adjustedMonthlyIncome * output.employerRate;
		output.personalRate = output.totalRate - output.employerRate;
		output.personalContribution = output.totalContribution - output.employerContribution;
	}

	output.totalContribution = roundCurrency(output.totalContribution);
	output.personalContribution = roundCurrency(output.personalContribution);
	output.employerContribution = roundCurrency(output.employerContribution);

	return output;
}

function calculateHealthInsuranceContributions({age, monthlyIncome, occupation, isMarried, hasChildren, customZusatzbeitrag}) {
	const isEmployee = occupation == 'employee';
	const isSelfEmployed = occupation == 'selfEmployed';
	const isWorkingStudent = occupation == 'studentEmployee';
	const isSelfEmployedStudent = occupation == 'studentSelfEmployed';
	const isStudent = isWorkingStudent || isSelfEmployedStudent || occupation == 'student';
	const isUnemployed = occupations.isUnemployed(occupation);
	const isAzubi = occupation == 'azubi';

	const hoursWorked = 20; // TODO: Accept different values

	const childrenCount = hasChildren ? 1 : 0;

	/***************************************************
	* Tarif and flags
	***************************************************/
	let tarif = null;
	const flags = new Set();

	let output;

	if(isStudent) {
		if(age >= 30) {
			flags.add('student-30plus');
			if(isWorkingStudent) { tarif = 'employee' }
			else if(isSelfEmployedStudent) { tarif = 'selfEmployed' }
			else { tarif = 'selfPay' }
		}
		else{
			tarif = 'student';
			output = calculateHealthInsuranceForStudent(age, childrenCount, customZusatzbeitrag);
		}

		// You're earning too much to be considered a student
		// https://www.haufe.de/personal/haufe-personal-office-platin/student-versicherungsrechtliche-bewertung-einer-selbsts-5-student-oder-selbststaendiger_idesk_PI42323_HI9693887.html
		if(hoursWorked <= 20 && monthlyIncome > 0.75*healthInsurance.maxNebenjobIncome) {
			tarif = isSelfEmployedStudent ? 'selfEmployed' : 'employee';
			flags.add('not-nebenjob');
			output = null;
		}
		else if(hoursWorked > 20 && hoursWorked <= 30 && monthlyIncome > 0.5*healthInsurance.maxNebenjobIncome) {
			tarif = isSelfEmployedStudent ? 'selfEmployed' : 'employee';
			flags.add('not-nebenjob');
			output = null;
		}
		else if(hoursWorked > 30 && monthlyIncome > 0.25*healthInsurance.maxNebenjobIncome) {
			tarif = isSelfEmployedStudent ? 'selfEmployed' : 'employee';
			flags.add('not-nebenjob');
			output = null;
		}
	}

	if(isSelfEmployed) { tarif = 'selfEmployed' }
	if(isUnemployed) { tarif = 'selfPay' }
	if(isEmployee) { tarif = 'employee' }

	if(isAzubi) {
		tarif = 'azubi';
		if(monthlyIncome <= healthInsurance.azubiFreibetrag) {
			flags.add('azubi-free');
		}
	}

	if(monthlyIncome <= Math.max(taxes.maxMinijobIncome, healthInsurance.maxFamilienvericherungIncome) && !isAzubi) {
		// If the minijob income > familienversicherung income, minijobbers still keep
		// their familienversicherung. It's an exception set by §8 SGB V.

		// Azubis can't use Familienversicherung
		// https://www.krankenkasse-vergleich-direkt.de/ratgeber/krankenversicherung-fuer-auszubildende.html
		if(isMarried){
			flags.add('familienversicherung-spouse'); // No age limit
		}
		if(age < 23 || (isStudent && age < 25)) {
			flags.add('familienversicherung-parents');
		}
	}

	if(tarif == 'employee' && !isAzubi) {
		// Azubis don't get the midijob tarif
		// https://www.haufe.de/sozialwesen/versicherungen-beitraege/auszubildende-besonderheiten-bei-den-neuen/besonderheiten-bei-der-beitragsberechnung_240_94670.html
		if(monthlyIncome <= taxes.maxMinijobIncome) {
			tarif = 'selfPay';
			flags.add('minijob');
		}
		else if(monthlyIncome <= healthInsurance.maxMidijobIncome) {
			return calculateHealthInsuranceForMidijob(monthlyIncome, age, childrenCount, customZusatzbeitrag);
		}
	}

	if (monthlyIncome >= healthInsurance.maxMonthlyIncome) {
		flags.add('max-contribution');
	}

	if (monthlyIncome >= healthInsurance.minFreiwilligMonthlyIncome || isUnemployed || tarif === 'selfPay' || tarif === 'selfEmployed' || tarif === 'minijob' || tarif === 'student') {
		flags.add('private');
	}

	if (monthlyIncome <= healthInsurance.minMonthlyIncome && (tarif === 'selfPay' || tarif === 'selfEmployed')) {
		flags.add('min-contribution');
	}

	if (monthlyIncome <= taxes.maxMinijobIncome && !isSelfEmployed && !isAzubi) {
		flags.add('ehic');
	}

	if (isSelfEmployed && (monthlyIncome * 12) >= healthInsurance.kskMinimumIncome) {
		flags.add('ksk');
	}

	if (isUnemployed){
		flags.add('alg-i-buergergeld');
	}

	// Total rate
	if (age > pflegeversicherung.defaultTarifMaxAge && !hasChildren) {
		flags.add('pflegeversicherung-surcharge');
	}


	if(tarif === 'selfEmployed'){
		output = calculateHealthInsuranceForSelfEmployment(monthlyIncome, age, childrenCount, customZusatzbeitrag);
	}

	if(output){
		flags.forEach(f => output.flags.add(f));
		return output;
	}

	/***************************************************
	* Monthly income
	***************************************************/

	// The contribution rate isn't always applied to your full income
	let adjustedMonthlyIncome;
	let adjustedMonthlyIncomeEmployee; // Midijob only
	if(tarif === 'azubi') {
		adjustedMonthlyIncome = Math.min(healthInsurance.maxMonthlyIncome, monthlyIncome);
	}
	else if(tarif === 'employee' || tarif === 'selfPay' || tarif === 'selfEmployed') {
		adjustedMonthlyIncome = Math.min(healthInsurance.maxMonthlyIncome, Math.max(monthlyIncome, healthInsurance.minMonthlyIncome));
	}

	/***************************************************
	* Base contribution
	***************************************************/
	const baseContributionValues = {};

	// Total base contribution
	if (tarif === 'selfEmployed') {
		baseContributionValues.totalRate = healthInsurance.selfEmployedTarif;
		baseContributionValues.totalContribution = adjustedMonthlyIncome * baseContributionValues.totalRate;
	}
	else if (tarif === 'selfPay') {
		baseContributionValues.totalRate = healthInsurance.defaultTarif;
		baseContributionValues.totalContribution = adjustedMonthlyIncome * baseContributionValues.totalRate;
	}
	else {
		baseContributionValues.totalRate = healthInsurance.defaultTarif;
		baseContributionValues.totalContribution = adjustedMonthlyIncome * baseContributionValues.totalRate;
	}

	// Employer and employee contributions
	if (tarif === 'azubi' && monthlyIncome <= healthInsurance.azubiFreibetrag) {  // Below this amount, the employer pays everything
		baseContributionValues.employerRate = baseContributionValues.totalRate;
		baseContributionValues.employerContribution = baseContributionValues.totalContribution;
		baseContributionValues.personalRate = baseContributionValues.totalRate - baseContributionValues.employerRate;
		baseContributionValues.personalContribution = baseContributionValues.totalContribution - baseContributionValues.employerContribution;
	}
	else if(tarif === 'selfPay' || tarif === 'selfEmployed') {
		baseContributionValues.employerRate = 0;
		baseContributionValues.employerContribution = 0;
		baseContributionValues.personalRate = baseContributionValues.totalRate - baseContributionValues.employerRate;
		baseContributionValues.personalContribution = baseContributionValues.totalContribution - baseContributionValues.employerContribution;
	}
	else {
		baseContributionValues.employerRate = baseContributionValues.totalRate / 2;
		baseContributionValues.employerContribution = adjustedMonthlyIncome * baseContributionValues.employerRate;
		baseContributionValues.personalRate = baseContributionValues.totalRate - baseContributionValues.employerRate;
		baseContributionValues.personalContribution = baseContributionValues.totalContribution - baseContributionValues.employerContribution;
	}

	baseContributionValues.totalContribution = roundCurrency(baseContributionValues.totalContribution);
	baseContributionValues.personalContribution = roundCurrency(baseContributionValues.personalContribution);
	baseContributionValues.employerContribution = roundCurrency(baseContributionValues.employerContribution);

	const pflegeversicherungValues = calculatePflegeversicherung(monthlyIncome, adjustedMonthlyIncome, adjustedMonthlyIncomeEmployee, age, hasChildren, tarif);
	pflegeversicherungValues.flags.forEach(f => flags.add(f));

	/***************************************************
	* Public health insurance options + Zusatzbeitrag
	***************************************************/
	const allInsurers = Object.entries(healthInsurance.companies);
	if(customZusatzbeitrag !== undefined) {
		// Create an extra option with the user-specified Zusatzbeitrag
		allInsurers.push([
			'custom',
			{ name: 'Other health insurer', zusatzbeitrag: customZusatzbeitrag, }
		]);
	}
	const insurerOptions = allInsurers.reduce((output, [krankenkasseKey, krankenkasse]) => {

		/***************************************************
		* Zusatzbeitrag
		***************************************************/
		const zusatzbeitragValues = {}

		zusatzbeitragValues.totalRate = krankenkasse.zusatzbeitrag;
		zusatzbeitragValues.totalContribution = adjustedMonthlyIncome * zusatzbeitragValues.totalRate;
		zusatzbeitragValues.personalRate = zusatzbeitragValues.totalRate - zusatzbeitragValues.employerRate;
		zusatzbeitragValues.personalContribution = zusatzbeitragValues.totalContribution - zusatzbeitragValues.employerContribution;

		if(tarif === 'azubi') {
			if(monthlyIncome <= healthInsurance.azubiFreibetrag) {  // Below this amount, the employer pays everything
				zusatzbeitragValues.employerRate = zusatzbeitragValues.totalRate;
				zusatzbeitragValues.employerContribution = zusatzbeitragValues.totalContribution;
			}
			else {
				zusatzbeitragValues.employerRate = zusatzbeitragValues.totalRate / 2;
				zusatzbeitragValues.employerContribution = adjustedMonthlyIncome * zusatzbeitragValues.employerRate;
			}
			zusatzbeitragValues.personalRate = zusatzbeitragValues.totalRate - zusatzbeitragValues.employerRate;
			zusatzbeitragValues.personalContribution = zusatzbeitragValues.totalContribution - zusatzbeitragValues.employerContribution;
		}
		else if(tarif === 'employee') {
			zusatzbeitragValues.employerRate = krankenkasse.zusatzbeitrag / 2;
			zusatzbeitragValues.employerContribution = adjustedMonthlyIncome * zusatzbeitragValues.employerRate;
			zusatzbeitragValues.personalRate = zusatzbeitragValues.totalRate - zusatzbeitragValues.employerRate;
			zusatzbeitragValues.personalContribution = zusatzbeitragValues.totalContribution - zusatzbeitragValues.employerContribution;
		}
		else {
			zusatzbeitragValues.employerRate = 0;
			zusatzbeitragValues.employerContribution = 0;
			zusatzbeitragValues.personalRate = zusatzbeitragValues.totalRate - zusatzbeitragValues.employerRate;
			zusatzbeitragValues.personalContribution = zusatzbeitragValues.totalContribution - zusatzbeitragValues.employerContribution;
		}

		zusatzbeitragValues.totalContribution = roundCurrency(zusatzbeitragValues.totalContribution);
		zusatzbeitragValues.personalContribution = roundCurrency(zusatzbeitragValues.personalContribution);
		zusatzbeitragValues.employerContribution = roundCurrency(zusatzbeitragValues.employerContribution);

		/***************************************************
		* Total
		***************************************************/
		const finalTotal = field => baseContributionValues[field] + pflegeversicherungValues[field] + zusatzbeitragValues[field];
		output[krankenkasseKey] = {
			zusatzbeitrag: zusatzbeitragValues,
			total: {
				totalRate: finalTotal('totalRate'),
				employerRate: finalTotal('employerRate'),
				personalRate: finalTotal('personalRate'),
				totalContribution: roundCurrency(finalTotal('totalContribution')),
				employerContribution: roundCurrency(finalTotal('employerContribution')),
				personalContribution: roundCurrency(finalTotal('personalContribution')),
			}
		}
		return output;
	}, {});

	const insurerOptionsSortedByPrice = Object.values(insurerOptions).sort((a, b) => a.total.personalContribution - b.total.personalContribution);
	insurerOptions.cheapest = insurerOptionsSortedByPrice[0];
	insurerOptions.mostExpensive = insurerOptionsSortedByPrice[insurerOptionsSortedByPrice.length - 1];

	return {
		flags: flags,
		tarif,
		baseContribution: baseContributionValues,
		pflegeversicherung: pflegeversicherungValues,
		options: insurerOptions,
	}
}
{% endjs %}