{% include '_js/constants.js' %}
{% js %}

function getBoundedMonthlyIncome(monthlyIncome){
	// The income limited by the min and max health insurance contributions
	return Math.min(healthInsurance.maxMonthlyIncome, Math.max(monthlyIncome, healthInsurance.minMonthlyIncome));
}

function getPflegeversicherungRate(age, childrenCount){
	if (age > pflegeversicherung.defaultRateMaxAge && childrenCount === 0) {
		return pflegeversicherung.surchargeTarif;
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

function getPublicHealthInsurerOptions(customZusatzbeitrag){
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

function calculateHealthInsuranceForAzubi(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(),
		tarif: 'azubi',
	};

	if(monthlyIncome <= healthInsurance.azubiFreibetrag) {
		out.tarif = 'azubi-free';
		out.flags.add('azubi-free');
	}

	const adjustedIncome = Math.min(healthInsurance.maxMonthlyIncome, monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.defaultRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * adjustedIncome);

	if(adjustedIncome <= healthInsurance.azubiFreibetrag) { // Below this, the employer pays everything
		out.baseContribution.employerRate = out.baseContribution.totalRate;
		out.baseContribution.employerContribution = out.baseContribution.totalContribution;
		out.baseContribution.personalRate = 0;
		out.baseContribution.personalContribution = 0;
	}
	else {
		out.baseContribution.employerRate = out.baseContribution.totalRate / 2;
		out.baseContribution.employerContribution = roundCurrency(adjustedIncome * out.baseContribution.employerRate);
		out.baseContribution.personalRate = out.baseContribution.totalRate - out.baseContribution.employerRate;
		out.baseContribution.personalContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.employerContribution);
	}


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = getPflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.totalRate);

	// Personal + employer contributions
	if(adjustedIncome <= healthInsurance.azubiFreibetrag) { // Below this, the employer pays everything
		out.pflegeversicherung.employerRate = out.pflegeversicherung.totalRate;
		out.pflegeversicherung.employerContribution = out.pflegeversicherung.totalContribution;
		out.pflegeversicherung.personalRate = 0;
		out.pflegeversicherung.personalContribution = 0;
	}
	else{
		out.pflegeversicherung.employerRate = pflegeversicherung.employerTarif;
		out.pflegeversicherung.employerContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.employerRate);
		out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate - out.pflegeversicherung.employerRate;
		out.pflegeversicherung.personalContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.employerContribution);
	}


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getPublicHealthInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(adjustedIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);

		if(monthlyIncome <= healthInsurance.azubiFreibetrag) {  // Below this amount, the employer pays everything
			options[krankenkasseKey].zusatzbeitrag.employerRate = options[krankenkasseKey].zusatzbeitrag.totalRate;
			options[krankenkasseKey].zusatzbeitrag.employerContribution = options[krankenkasseKey].zusatzbeitrag.totalContribution;
		}
		else {
			options[krankenkasseKey].zusatzbeitrag.employerRate = options[krankenkasseKey].zusatzbeitrag.totalRate / 2;
			options[krankenkasseKey].zusatzbeitrag.employerContribution = roundCurrency(adjustedIncome * options[krankenkasseKey].zusatzbeitrag.employerRate);
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

function calculateHealthInsuranceForEmployee(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(),
		tarif: 'employee',
	};

	if(canHavePrivateHealthInsurance('employee', monthlyIncome, 40)){
		out.flags.add('private');
	}

	const adjustedIncome = getBoundedMonthlyIncome(monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.defaultRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * adjustedIncome);
	out.baseContribution.employerRate = out.baseContribution.totalRate / 2;
	out.baseContribution.employerContribution = roundCurrency(adjustedIncome * out.baseContribution.employerRate);
	out.baseContribution.personalRate = out.baseContribution.totalRate - out.baseContribution.employerRate;
	out.baseContribution.personalContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.employerContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = getPflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.totalRate);
	out.pflegeversicherung.employerRate = pflegeversicherung.employerTarif;
	out.pflegeversicherung.employerContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.employerRate);
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate - out.pflegeversicherung.employerRate;
	out.pflegeversicherung.personalContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.employerContribution);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getPublicHealthInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: {}
		};

		options[krankenkasseKey].zusatzbeitrag.totalRate = krankenkasse.zusatzbeitrag;
		options[krankenkasseKey].zusatzbeitrag.totalContribution = roundCurrency(adjustedIncome * options[krankenkasseKey].zusatzbeitrag.totalRate);

		options[krankenkasseKey].zusatzbeitrag.employerRate = krankenkasse.zusatzbeitrag / 2;
		options[krankenkasseKey].zusatzbeitrag.employerContribution = adjustedIncome * options[krankenkasseKey].zusatzbeitrag.employerRate;
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
	out.baseContribution.totalRate = healthInsurance.defaultRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * adjustedIncomeEmployer);

	out.baseContribution.employerRate = healthInsurance.defaultRate / 2;
	out.baseContribution.personalRate = out.baseContribution.totalRate - out.baseContribution.employerRate;
	out.baseContribution.personalContribution = roundCurrency(adjustedIncomeEmployee * out.baseContribution.personalRate);
	out.baseContribution.employerContribution = roundCurrency(out.baseContribution.totalContribution - out.baseContribution.personalContribution);


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = getPflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncomeEmployer * out.pflegeversicherung.totalRate);

	out.pflegeversicherung.employerRate = pflegeversicherung.employerTarif;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate - out.pflegeversicherung.employerRate;
	out.pflegeversicherung.personalContribution = roundCurrency(
		(out.pflegeversicherung.totalRate - pflegeversicherung.defaultRate) * adjustedIncomeEmployer
		+ out.pflegeversicherung.personalRate * adjustedIncomeEmployee // The childless surcharge is not covered by the employer
	);
	out.pflegeversicherung.employerContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.personalContribution);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getPublicHealthInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
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
	out.baseContribution.totalRate = healthInsurance.selfPayRate;
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * adjustedIncome);
	out.baseContribution.employerRate = 0;
	out.baseContribution.employerContribution = 0;
	out.baseContribution.personalRate = out.baseContribution.totalRate;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;


	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = getPflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.totalRate);
	out.pflegeversicherung.employerRate = 0;
	out.pflegeversicherung.employerContribution = 0;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate;
	out.pflegeversicherung.personalContribution = out.pflegeversicherung.totalContribution;


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getPublicHealthInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
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

function calculateHealthInsuranceForSelfPay(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['private']),
		tarif: 'selfPay',
	};

	const adjustedIncome = getBoundedMonthlyIncome(monthlyIncome);

	/***************************************************
	* Base contribution
	***************************************************/

	out.baseContribution = {};
	out.baseContribution.totalRate = healthInsurance.selfPayRate;  // Rate without Krankengeld
	out.baseContribution.totalContribution = roundCurrency(out.baseContribution.totalRate * adjustedIncome);
	out.baseContribution.employerRate = 0;
	out.baseContribution.employerContribution = 0;
	out.baseContribution.personalRate = out.baseContribution.totalRate;
	out.baseContribution.personalContribution = out.baseContribution.totalContribution;

	/***************************************************
	* Pflegeversicherung
	***************************************************/

	out.pflegeversicherung = {};
	out.pflegeversicherung.totalRate = getPflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(adjustedIncome * out.pflegeversicherung.totalRate);
	out.pflegeversicherung.employerRate = 0;
	out.pflegeversicherung.employerContribution = 0;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate;
	out.pflegeversicherung.personalContribution = out.pflegeversicherung.totalContribution;


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getPublicHealthInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
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

function calculateHealthInsuranceForStudent(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
		flags: new Set(['student', 'private']),
		tarif: 'student',
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

	out.pflegeversicherung = {};

	// Employers do not contribute to a student's Pflegeversicherung
	out.pflegeversicherung.totalRate = getPflegeversicherungRate(age, childrenCount);
	out.pflegeversicherung.totalContribution = roundCurrency(out.pflegeversicherung.totalRate * bafogBedarfssatz);
	out.pflegeversicherung.employerRate = 0;
	out.pflegeversicherung.employerContribution = 0;
	out.pflegeversicherung.personalRate = out.pflegeversicherung.totalRate - out.pflegeversicherung.employerRate;
	out.pflegeversicherung.personalContribution = roundCurrency(out.pflegeversicherung.totalContribution - out.pflegeversicherung.employerContribution);


	/***************************************************
	* Zusatzbeitrag
	***************************************************/

	out.options = getPublicHealthInsurerOptions(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
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

function getPublicHealthInsuranceTarif(age, occupation, monthlyIncome, hoursWorkedPerWeek){
	let tarif = null;

	if(occupations.isStudent(occupation)) {
		tarif = 'student';
		if(age >= 30) {
			if(occupations.isEmployed(occupation)) {
				tarif = 'employee';
			}
			else if(occupations.isSelfEmployed(occupation)) {
				tarif = 'selfEmployed';
			}
			else {
				tarif = 'selfPay';
			}
		}

		if(!isWorkingStudent(occupation, monthlyIncome, hoursWorkedPerWeek)){
			tarif = occupations.isSelfEmployed(occupation) ? 'selfEmployed' : 'employee';
		}
	}
	else if(occupations.isSelfEmployed(occupation)) {
		tarif = 'selfEmployed';
	}
	else if(occupations.isUnemployed(occupation)) {
		tarif = 'selfPay';
	}
	else if(occupation === 'employee') {
		tarif = 'employee';
	}
	else if(occupation === 'azubi') {
		tarif = 'azubi';
	}

	if(tarif === 'employee'){
		if(isMinijob(occupation, monthlyIncome)) {
			tarif = 'selfPay';
		}
		else if(isMidijob(occupation, monthlyIncome)) {
			tarif = 'midijob';
		}
	}

	return tarif;
}

function calculateHealthInsuranceContributions({age, monthlyIncome, occupation, isMarried, childrenCount, customZusatzbeitrag, hoursWorked}) {
	const hoursWorkedPerWeek = hoursWorked === undefined ? 20 : +hoursWorked;

	/***************************************************
	* Tarif selection
	***************************************************/

	const tarif = getPublicHealthInsuranceTarif(age, occupation, monthlyIncome, hoursWorkedPerWeek);

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

	if(monthlyIncome <= healthInsurance.minMonthlyIncome && (tarif === 'selfPay' || tarif === 'selfEmployed')) {
		flags.add('min-contribution');
	}

	if(tarif !== 'student' && isMinijob(occupation, monthlyIncome)) {
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
		'azubi': calculateHealthInsuranceForAzubi,
		'employee': calculateHealthInsuranceForEmployee,
		'midijob': calculateHealthInsuranceForMidijob,
		'selfEmployed': calculateHealthInsuranceForSelfEmployment,
		'selfPay': calculateHealthInsuranceForSelfPay,
		'student': calculateHealthInsuranceForStudent,
	}[tarif];
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
		&& occupation !== 'azubi' // No minijob tarif for an Ausbildung
		&& monthlyIncome <= taxes.maxMinijobIncome
	);
}

function isMidijob(occupation, monthlyIncome){
	// No midijob tarif for Azubis
	// https://www.haufe.de/sozialwesen/versicherungen-beitraege/auszubildende-besonderheiten-bei-den-neuen/besonderheiten-bei-der-beitragsberechnung_240_94670.html
	return (
		occupation === 'employee'
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