{% include '_js/constants.js' %}
{% js %}

function getBoundedMonthlyIncome(monthlyIncome){
	// The income limited by the min and max health insurance contributions
	return Math.min(
		healthInsurance.maxMonthlyIncome,
		Math.max(
			monthlyIncome,
			healthInsurance.minMonthlyIncome
		)
	);
}

function gkvTariff(age, occupation, monthlyIncome, hoursWorkedPerWeek){
	let tariff = null;

	if(occupations.isStudent(occupation)) {
		tariff = 'student';
		if(age >= 30) {
			if(occupations.isEmployed(occupation)) {
				tariff = 'employee';
			}
			else if(occupations.isSelfEmployed(occupation)) {
				tariff = 'selfEmployed';
			}
			else {
				tariff = 'selfPay';
			}
		}

		if(!isWorkingStudent(occupation, monthlyIncome, hoursWorkedPerWeek)){
			tariff = occupations.isSelfEmployed(occupation) ? 'selfEmployed' : 'employee';
		}
	}
	else if(occupations.isSelfEmployed(occupation)) {
		tariff = 'selfEmployed';
	}
	else if(occupations.isUnemployed(occupation)) {
		tariff = 'selfPay';
	}
	else if(occupation === 'employee') {
		tariff = 'employee';
	}
	else if(occupation === 'azubi') {
		tariff = 'azubi';
	}

	if(tariff === 'employee'){
		if(isMinijob(occupation, monthlyIncome)) {
			tariff = 'selfPay';
		}
		else if(isMidijob(occupation, monthlyIncome)) {
			tariff = 'midijob';
		}
	}

	return tariff;
}

function gkvBaseContribution(monthlyIncome, totalRate, personalRate){
	// Calculate the base contribution for the employee and the employer
	// This is the main cost of public health insurance - usually 14.6% of one's income
	const employerRate = totalRate - personalRate;
	return {
		totalRate,
		personalRate,
		employerRate,
		totalContribution: roundCurrency(totalRate * monthlyIncome),
		personalContribution: roundCurrency(personalRate * monthlyIncome),
		employerContribution: roundCurrency(employerRate * monthlyIncome),
	}
}

function gkvPflegeversicherungRate(age, childrenCount){
	if (age > pflegeversicherung.defaultRateMaxAge && childrenCount === 0) {
		return pflegeversicherung.surchargeRate;
	}
	else if(childrenCount < pflegeversicherung.minimumChildCountForDiscount){
		return pflegeversicherung.defaultRate;
	}
	else{
		return pflegeversicherung.defaultRate - (
			pflegeversicherung.discountPerChild
			* (
				Math.min(childrenCount, pflegeversicherung.maximumChildCountForDiscount)
				- pflegeversicherung.minimumChildCountForDiscount
				+ 1
			)
		);
	}
}

function gkvPflegeversicherung(age, childrenCount, monthlyIncome, employerContributes){
	const totalRate = gkvPflegeversicherungRate(age, childrenCount);
	const employerRate = employerContributes ? pflegeversicherung.employerRate : 0;
	const personalRate = totalRate - employerRate;
	return {
		totalRate,
		personalRate,
		employerRate,
		totalContribution: roundCurrency(totalRate * monthlyIncome),
		personalContribution: roundCurrency(personalRate * monthlyIncome),
		employerContribution: roundCurrency(employerRate * monthlyIncome),
	}
}

function gkvOptions(customZusatzbeitrag){
	// Get a list of Krankenkassen with their price
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

function gkvCostForAzubi(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(),
		tariff: 'azubi',
	};

	if(monthlyIncome <= healthInsurance.azubiFreibetrag) {
		out.tariff = 'azubi-free';
		out.flags.add('azubi-free');
	}

	const boundedMonthlyIncome = Math.min(healthInsurance.maxMonthlyIncome, monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	if(boundedMonthlyIncome <= healthInsurance.azubiFreibetrag) { // Below this, the employer pays everything
		out.baseContribution = gkvBaseContribution(boundedMonthlyIncome, healthInsurance.defaultRate, 0);
	}
	else {
		out.baseContribution = gkvBaseContribution(
			boundedMonthlyIncome, healthInsurance.defaultRate, healthInsurance.defaultRate / 2
		);
	}


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, true);

	// When the Azubi's pay is too low, the employer pays for everything - §20 Abs. 3 SGB IV
	if(boundedMonthlyIncome <= healthInsurance.azubiFreibetrag) {
		out.pflegeversicherung.employerRate = out.pflegeversicherung.totalRate;
		out.pflegeversicherung.employerContribution = out.pflegeversicherung.totalContribution;
		out.pflegeversicherung.personalRate = 0;
		out.pflegeversicherung.personalContribution = 0;
	}

	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = gkvOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(boundedMonthlyIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);

		if(monthlyIncome <= healthInsurance.azubiFreibetrag) {  // Below this amount, the employer pays everything
			options[krankenkasseKey].zusatzbeitrag.employerRate = options[krankenkasseKey].zusatzbeitrag.totalRate;
			options[krankenkasseKey].zusatzbeitrag.employerContribution = options[krankenkasseKey].zusatzbeitrag.totalContribution;
		}
		else {
			options[krankenkasseKey].zusatzbeitrag.employerRate = options[krankenkasseKey].zusatzbeitrag.totalRate / 2;
			options[krankenkasseKey].zusatzbeitrag.employerContribution = roundCurrency(boundedMonthlyIncome * options[krankenkasseKey].zusatzbeitrag.employerRate);
		}

		options[krankenkasseKey].zusatzbeitrag.personalRate = options[krankenkasseKey].zusatzbeitrag.totalRate - options[krankenkasseKey].zusatzbeitrag.employerRate;
		options[krankenkasseKey].zusatzbeitrag.personalContribution = options[krankenkasseKey].zusatzbeitrag.totalContribution - options[krankenkasseKey].zusatzbeitrag.employerContribution;

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

function gkvCostForEmployee(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(),
		tariff: 'employee',
	};

	if(canHavePrivateHealthInsurance('employee', monthlyIncome, 40)){
		out.flags.add('private');
	}

	const boundedMonthlyIncome = getBoundedMonthlyIncome(monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.defaultRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * boundedMonthlyIncome);
	out.baseContribution.employerRate = out.baseContribution.totalRate / 2;
	out.baseContribution.employerContribution = roundCurrency(boundedMonthlyIncome * out.baseContribution.employerRate);
	out.baseContribution.personalRate = out.baseContribution.totalRate - out.baseContribution.employerRate;
	out.baseContribution.personalContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.employerContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, true);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = gkvOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(boundedMonthlyIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);

		options[krankenkasseKey].zusatzbeitrag.employerRate = krankenkasse.zusatzbeitrag / 2;
		options[krankenkasseKey].zusatzbeitrag.employerContribution = boundedMonthlyIncome * options[krankenkasseKey].zusatzbeitrag.employerRate;
		options[krankenkasseKey].zusatzbeitrag.personalRate = options[krankenkasseKey].zusatzbeitrag.totalRate - options[krankenkasseKey].zusatzbeitrag.employerRate;
		options[krankenkasseKey].zusatzbeitrag.personalContribution = options[krankenkasseKey].zusatzbeitrag.totalContribution - options[krankenkasseKey].zusatzbeitrag.employerContribution;

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

function gkvCostForMidijob(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['midijob']),
		tariff: 'midijob',
	};

	/***************************************************
	* Monthly income
	* According to Gleitzone formula: §20 Abs. 2a SGB VI
	***************************************************/

	const boundedMonthlyIncomeEmployer = (
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

	const boundedMonthlyIncomeEmployee = (
		(healthInsurance.maxMidijobIncome / (healthInsurance.maxMidijobIncome-taxes.maxMinijobIncome))
		* (monthlyIncome - taxes.maxMinijobIncome)
	);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.defaultRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * boundedMonthlyIncomeEmployer);

	out.baseContribution.employerRate = healthInsurance.defaultRate / 2;
	out.baseContribution.personalRate = out.baseContribution.totalRate - out.baseContribution.employerRate;
	out.baseContribution.personalContribution = roundCurrency(boundedMonthlyIncomeEmployee * out.baseContribution.personalRate);
	out.baseContribution.employerContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.personalContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncomeEmployer, true);
	out.pflegeversicherung.personalContribution = roundCurrency(
		(out.pflegeversicherung.totalRate - pflegeversicherung.defaultRate) * boundedMonthlyIncomeEmployer
		+ out.pflegeversicherung.personalRate * boundedMonthlyIncomeEmployee // The childless surcharge is not covered by the employer
	);
	out.pflegeversicherung.employerContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.personalContribution);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = gkvOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(krankenkasse.zusatzbeitrag * boundedMonthlyIncomeEmployer);
		options[krankenkasseKey].zusatzbeitrag.employerRate = krankenkasse.zusatzbeitrag / 2;
		options[krankenkasseKey].zusatzbeitrag.personalRate = krankenkasse.zusatzbeitrag / 2;
		options[krankenkasseKey].zusatzbeitrag.personalContribution = roundCurrency(boundedMonthlyIncomeEmployee * options[krankenkasseKey].zusatzbeitrag.personalRate);
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

function gkvCostForSelfEmployment(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['private']),
		tariff: 'selfEmployed',
	};

	const boundedMonthlyIncome = getBoundedMonthlyIncome(monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.selfPayRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * boundedMonthlyIncome);
	out.baseContribution.employerRate = 0;
	out.baseContribution.employerContribution = 0;
	out.baseContribution.personalRate = out.baseContribution.totalRate;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, false);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = gkvOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(boundedMonthlyIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);
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

function gkvCostForSelfPay(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['private']),
		tariff: 'selfPay',
	};

	const boundedMonthlyIncome = getBoundedMonthlyIncome(monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.selfPayRate;  // Rate without Krankengeld
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * boundedMonthlyIncome);
	out.baseContribution.employerRate = 0;
	out.baseContribution.employerContribution = 0;
	out.baseContribution.personalRate = out.baseContribution.totalRate;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;

	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, false);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = gkvOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(boundedMonthlyIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);
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

function gkvCostForStudent(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['student', 'private']),
		tariff: 'student',
	};

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};

	// Students pay a fixed amount: 70% of the normal rate * the bafogBedarfssatz
	out.baseContribution.totalRate = healthInsurance.studentRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * bafogBedarfssatz);

	// Employers do not contribute to student health insurance
	out.baseContribution.employerRate = 0;
	out.baseContribution.personalRate = undefined;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;
	out.baseContribution.employerContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.personalContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	// Employers do not contribute to a student's Pflegeversicherung
	// The cost is based on the bafogBedarfssatz instead of the student's income
	out.pflegeversicherung = gkvPflegeversicherung(age, childrenCount, bafogBedarfssatz, false);

	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = gkvOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
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

function calculateHealthInsuranceContributions({age, monthlyIncome, occupation, isMarried, childrenCount, customZusatzbeitrag, hoursWorked}) {
	const hoursWorkedPerWeek = hoursWorked === undefined ? 20 : +hoursWorked;

	const tariff = gkvTariff(age, occupation, monthlyIncome, hoursWorkedPerWeek);

	/***************************************************
	* Flags
	***************************************************/

	const flags = new Set();
	if(isPaidBySocialBenefits(occupation)){
		flags.add('alg-i-buergergeld');
	}
	if(canHaveEHIC(true, false, monthlyIncome)) {
		flags.add('ehic');
	}

	if(canHaveFamilienversicherungFromSpouse(occupation, monthlyIncome, isMarried)){
		flags.add('familienversicherung-spouse');
	}
	if(canHaveFamilienversicherungFromParents(occupation, monthlyIncome, age)){
		flags.add('familienversicherung-parents');
	}
	if(canHaveKSK(occupation, monthlyIncome, hoursWorked)) {
		flags.add('ksk');
	}
	if(occupations.isStudent(occupation)){
		if(age >= 30) {
			flags.add('student-30plus');
		}
		if(!isWorkingStudent(occupation, monthlyIncome, hoursWorkedPerWeek)){
			flags.add('not-werkstudent');
		}
	}

	if(monthlyIncome >= healthInsurance.maxMonthlyIncome) {
		flags.add('max-contribution');
	}

	if(monthlyIncome <= healthInsurance.minMonthlyIncome && (tariff === 'selfPay' || tariff === 'selfEmployed')) {
		flags.add('min-contribution');
	}

	if(tariff !== 'student' && isMinijob(occupation, monthlyIncome)) {
		flags.add('minijob');
	}

	if(age > pflegeversicherung.defaultRateMaxAge && childrenCount === 0) {
		flags.add('pflegeversicherung-surcharge');
	}

	if(canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek)) {
		flags.add('private');
	}


	/***************************************************
	* Contributions calculation
	***************************************************/

	const calcFunction = {
		'azubi': gkvCostForAzubi,
		'employee': gkvCostForEmployee,
		'midijob': gkvCostForMidijob,
		'selfEmployed': gkvCostForSelfEmployment,
		'selfPay': gkvCostForSelfPay,
		'student': gkvCostForStudent,
	}[tariff];
	const output = calcFunction(monthlyIncome, age, childrenCount, customZusatzbeitrag);

	const insurerOptionsSortedByPrice = Object.values(output.options).sort((a, b) => a.total.personalContribution - b.total.personalContribution);
	output.options.cheapest = insurerOptionsSortedByPrice[0];
	output.options.mostExpensive = insurerOptionsSortedByPrice[insurerOptionsSortedByPrice.length - 1];

	flags.forEach(f => output.flags.add(f));

	return output;
}

function canHaveEHIC(isEUResident, hasGermanInsurance, monthlyIncome){
	// EHIC is available if you are insured in another EU country
	// It's invalidated as soon as you have an income, even if it's below the minijob threshold
	return isEUResident && !hasGermanInsurance && monthlyIncome === 0;
}

function isMinijob(occupation, monthlyIncome){
	return (
		occupations.isEmployed(occupation)
		&& occupation !== 'azubi' // No minijob tariff for an Ausbildung
		&& monthlyIncome <= taxes.maxMinijobIncome
	);
}

function isMidijob(occupation, monthlyIncome){
	// No midijob tariff for Azubis
	// https://www.haufe.de/sozialwesen/versicherungen-beitraege/auszubildende-besonderheiten-bei-den-neuen/besonderheiten-bei-der-beitragsberechnung_240_94670.html
	return (
		occupations.isEmployed(occupation)
		&& occupation !== 'azubi'
		&& !isMinijob(occupation, monthlyIncome)
		&& monthlyIncome <= healthInsurance.maxMidijobIncome
	);
}

function _canHaveFamilienversicherung(occupation, monthlyIncome){
	// The max income you can have before you're disqualified from Familienversicherung
	// The threshold is different for minijobs - §8 SGB V
	const maxIncome = occupations.isEmployed(occupation) ? taxes.maxMinijobIncome : healthInsurance.maxFamilienversicherungIncome;

	// Azubis can't use Familienversicherung - krankenkasse-vergleich-direkt.de/ratgeber/krankenversicherung-fuer-auszubildende.html
	return occupation !== 'azubi' && monthlyIncome <= maxIncome;
}

function canHaveFamilienversicherungFromSpouse(occupation, monthlyIncome, isMarried){
	// There is no age limit if getting FV from your spouse
	return isMarried && _canHaveFamilienversicherung(occupation, monthlyIncome);
}

function canHaveFamilienversicherungFromParents(occupation, monthlyIncome, age){
	return _canHaveFamilienversicherung(occupation, monthlyIncome) && (
		age < 23
		|| (
			age < 25
			&& occupations.isStudent(occupation)
		)
	);
}

function isPaidBySocialBenefits(occupation){
	// If income below limit, and receiving social benefits
	return occupations.isUnemployed(occupation);
}

function canHavePublicHealthInsurance(occupation, age, isEUResident, hasGermanInsurance){
	if(hasGermanInsurance){  // If it's public health insurance
		return true;
	}

	// If uninsured, non-EU student over 30
	if(occupations.isStudent(occupation) && age >= 30){
		if(!isEUCitizen && !hasGermanInsurance){
			return false;
		}
	}
	else if(!isEUResident && occupations.isSelfEmployed(occupation) && !hasGermanInsurance){
		return false;
	}

	// If uninsured, non-EU freelancer over 30

	return (
		isEUCitizen
		|| currentHealthInsurance === 'public'
	);
}

function canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek){
	return (
		!isWorkingStudent(occupation, monthlyIncome, hoursWorkedPerWeek)
		&&(
		 	(occupations.isEmployed(occupation) && monthlyIncome >= healthInsurance.minFreiwilligMonthlyIncome)
			|| occupations.isSelfEmployed(occupation)
			|| occupations.isUnemployed(occupation)
			|| isMinijob(occupation, monthlyIncome)
		)
	);
}

function canHaveExpatHealthInsurance(occupation, hasGermanInsurance){
	return !hasGermanInsurance && occupation !== 'employee';
}

function canHaveKSK(occupation, monthlyIncome, hoursWorkedPerWeek){
	// Künstlersozialkasse
	// The KSK only covers a student's health insurance if they work under 20 hours per week
	return (
		occupations.isSelfEmployed(occupation)
		&& (monthlyIncome * 12) >= healthInsurance.kskMinimumIncome
		&& (
			!occupations.isStudent(occupation)
			|| hoursWorkedPerWeek <= 20
		)
	);
}

function isWorkingStudent(occupation, monthlyIncome, hoursWorkedPerWeek){
	// A Werkstudent keeps their student insurance even if their income is above the Familienversicherung threshold

	return (
		occupations.isStudent(occupation)

		// TODO: Unless it's an internship during studies
		&& hoursWorkedPerWeek <= 20

		// You can earn too much to be considered a student
		// https://www.haufe.de/personal/haufe-personal-office-platin/student-versicherungsrechtliche-bewertung-einer-selbsts-5-student-oder-selbststaendiger_idesk_PI42323_HI9693887.html
		&& monthlyIncome <= 0.75 * healthInsurance.maxNebenjobIncome
	)
}

function needsGapInsurance(occupation, isEUResident){
	// Immigrants might need expat insurance to cover them from the moment they arrive in Germany
	// to the moment they get covered by public health insurance.
	// - Students before the start of their semester
	// - Employees before they start working
}
{% endjs %}