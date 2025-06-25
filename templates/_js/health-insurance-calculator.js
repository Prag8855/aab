{% include '_js/constants.js' %}
{% js %}

function getBoundedMonthlyIncome(monthlyIncome){
	return Math.min(
		healthInsurance.maxMonthlyIncome, // If you earn more, your contributions stop going up
		Math.max(
			monthlyIncome,
			healthInsurance.minMonthlyIncome // If you earn less, your contributions stop going down
		)
	);
}

function gkvTariff(age, occupation, monthlyIncome, hoursWorkedPerWeek){
	// Choose the tariff used to calculate the cost of public health insurance
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

function gkvBaseContribution(monthlyIncome, totalRate, isEmployerContributing){
	// Calculate the base contribution for the employee and the employer
	// This is the main cost of public health insurance - usually 14% or 14.6% of one's income
	const employerRate = isEmployerContributing ? totalRate / 2 : 0;
	return {
		totalRate,
		personalRate: totalRate - employerRate,
		employerRate,
		totalContribution: roundCurrency(totalRate * monthlyIncome),
		personalContribution: roundCurrency((totalRate - employerRate) * monthlyIncome),
		employerContribution: roundCurrency(employerRate * monthlyIncome),
	}
}

function gkvPflegeversicherungRate(age, childrenCount){
	// Calculate the cost of Pflegeversicherung as a percentage of income
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

function gkvPflegeversicherung(age, childrenCount, monthlyIncome, isEmployerContributing){
	// Calculate the rate and cost of Pflegeversicherung for the employee and the employer
	const totalRate = gkvPflegeversicherungRate(age, childrenCount);
	const employerRate = isEmployerContributing ? pflegeversicherung.employerRate : 0;
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

function gkvZusatzbeitrag(zusatzbeitragRate, monthlyIncome, isEmployerContributing){
	// Calculate the health insurance Zusatzbeitrag for the employee and the employer
	const employerRate = isEmployerContributing ? zusatzbeitragRate / 2 : 0;
	return {
		totalRate: zusatzbeitragRate,
		personalRate: zusatzbeitragRate - employerRate,
		employerRate,
		totalContribution: roundCurrency(monthlyIncome * zusatzbeitragRate),
		personalContribution: roundCurrency(monthlyIncome * (zusatzbeitragRate - employerRate)),
		employerContribution: roundCurrency(monthlyIncome * employerRate),
	};
}

function gkvTotal(baseContributionValues, pflegeversicherungValues, zusatzbeitragValues){
	// Adds the total/employer/personal contribution objects
	const total = field => baseContributionValues[field] + pflegeversicherungValues[field] + zusatzbeitragValues[field];
	return {
		totalRate: total('totalRate'),
		employerRate: total('employerRate'),
		personalRate: total('personalRate'),
		totalContribution: roundCurrency(total('totalContribution')),
		employerContribution: roundCurrency(total('employerContribution')),
		personalContribution: roundCurrency(total('personalContribution')),
	};
}

function gkvKrankenkassenList(customZusatzbeitrag){
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

function gkvKrankenkassenOptions(monthlyIncome, employerContributes, customZusatzbeitrag){
	return gkvKrankenkassenList(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: gkvZusatzbeitrag(krankenkasse.zusatzbeitrag, monthlyIncome, employerContributes),
		};
		return options;
	}, {});
}

function gkvCostForAzubi(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const boundedMonthlyIncome = Math.min(healthInsurance.maxMonthlyIncome, monthlyIncome);

	// When the Azubi's pay is too low, the employer pays for everything - §20 Abs. 3 SGB IV
	if(monthlyIncome > healthInsurance.azubiFreibetrag){
		return {
			tariff: 'azubi',
			baseContribution: gkvBaseContribution(boundedMonthlyIncome, healthInsurance.defaultRate, true),
			pflegeversicherung: gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, true),
			options: gkvKrankenkassenOptions(boundedMonthlyIncome, true, customZusatzbeitrag),
		};
	}
	else{
		const pflegeversicherungRate = gkvPflegeversicherungRate(age, childrenCount);
		return {
			tariff: 'azubi-free',
			baseContribution: {
				totalRate: healthInsurance.defaultRate,
				personalRate: 0,
				employerRate: healthInsurance.defaultRate,
				totalContribution: roundCurrency(boundedMonthlyIncome),
				personalContribution: 0,
				employerContribution: roundCurrency(boundedMonthlyIncome),
			},
			pflegeversicherung: {
				totalRate: pflegeversicherungRate,
				personalRate: 0,
				employerRate: pflegeversicherungRate,
				totalContribution: roundCurrency(pflegeversicherungRate * boundedMonthlyIncome),
				personalContribution: 0,
				employerContribution: roundCurrency(pflegeversicherungRate * boundedMonthlyIncome),
			},
			options: gkvKrankenkassenList(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
				options[krankenkasseKey] = {
					zusatzbeitrag: {
						totalRate: krankenkasse.zusatzbeitrag,
						personalRate: 0,
						employerRate: krankenkasse.zusatzbeitrag,
						totalContribution: roundCurrency(boundedMonthlyIncome * krankenkasse.zusatzbeitrag),
						personalContribution: 0,
						employerContribution: roundCurrency(boundedMonthlyIncome * krankenkasse.zusatzbeitrag),
					},
				};
				return options;
			}, {}),
		}
	}
}

function gkvCostForEmployee(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const boundedMonthlyIncome = getBoundedMonthlyIncome(monthlyIncome);
	return {
		tariff: 'employee',
		baseContribution: gkvBaseContribution(boundedMonthlyIncome, healthInsurance.defaultRate, true),
		pflegeversicherung: gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, true),
		options: gkvKrankenkassenOptions(boundedMonthlyIncome, true, customZusatzbeitrag),
	};
}

function gkvCostForMidijob(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const out = {
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

	out.baseContribution = {
		totalRate: healthInsurance.defaultRate,
		employerRate: healthInsurance.defaultRate / 2,
		personalRate: healthInsurance.defaultRate / 2,
		totalContribution: roundCurrency(healthInsurance.defaultRate * boundedMonthlyIncomeEmployer),
		personalContribution: roundCurrency(boundedMonthlyIncomeEmployee * healthInsurance.defaultRate / 2),
	};
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

	out.options = gkvKrankenkassenList(customZusatzbeitrag).reduce((options, [krankenkasseKey, krankenkasse]) => {
		options[krankenkasseKey] = {
			zusatzbeitrag: gkvZusatzbeitrag(krankenkasse.zusatzbeitrag, boundedMonthlyIncomeEmployer, true)
		};
		options[krankenkasseKey].zusatzbeitrag.personalContribution = roundCurrency(boundedMonthlyIncomeEmployee * options[krankenkasseKey].zusatzbeitrag.personalRate);
		options[krankenkasseKey].zusatzbeitrag.employerContribution = roundCurrency(options[krankenkasseKey].zusatzbeitrag.totalContribution - options[krankenkasseKey].zusatzbeitrag.personalContribution);
		return options;
	}, {});

	return out;
}

function gkvCostForSelfEmployment(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const boundedMonthlyIncome = getBoundedMonthlyIncome(monthlyIncome);
	return {
		tariff: 'selfEmployed',
		baseContribution: gkvBaseContribution(boundedMonthlyIncome, healthInsurance.selfPayRate, false),
		pflegeversicherung: gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, false),
		options: gkvKrankenkassenOptions(boundedMonthlyIncome, false, customZusatzbeitrag),
	};
}

function gkvCostForSelfPay(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	const boundedMonthlyIncome = getBoundedMonthlyIncome(monthlyIncome);
	return {
		tariff: 'selfPay',
		baseContribution: gkvBaseContribution(boundedMonthlyIncome, healthInsurance.selfPayRate, false),
		pflegeversicherung: gkvPflegeversicherung(age, childrenCount, boundedMonthlyIncome, false),
		options: gkvKrankenkassenOptions(boundedMonthlyIncome, false, customZusatzbeitrag),
	};
}

function gkvCostForStudent(monthlyIncome, age, childrenCount, customZusatzbeitrag){
	return {
		tariff: 'student',

		// Students pay a fixed amount: 70% of the normal rate * the bafogBedarfssatz
		baseContribution: gkvBaseContribution(bafogBedarfssatz, healthInsurance.studentRate, false),

		// Employers do not contribute to a student's Pflegeversicherung
		// The cost is based on the bafogBedarfssatz instead of the student's income		
		pflegeversicherung: gkvPflegeversicherung(age, childrenCount, bafogBedarfssatz, false),

		options: gkvKrankenkassenOptions(bafogBedarfssatz, false, customZusatzbeitrag),
	};
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

	if(tariff === 'azubi-free'){
		flags.add('azubi-free')
	}

	if(monthlyIncome >= healthInsurance.maxMonthlyIncome) {
		flags.add('max-contribution');
	}

	if((tariff === 'selfPay' || tariff === 'selfEmployed') && monthlyIncome <= healthInsurance.minMonthlyIncome) {
		flags.add('min-contribution');
	}

	if(tariff !== 'student' && isMinijob(occupation, monthlyIncome)) {
		flags.add('minijob');
	}
	if(tariff === 'midijob') {
		flags.add('midijob');
	}
	if(tariff === 'student') {
		flags.add('student');
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

	output.flags = flags;

	// Add .total cost to each health insurance option
	Object.values(output.options).forEach(option => {
		option.total = gkvTotal(output.baseContribution, output.pflegeversicherung, option.zusatzbeitrag);
	});

	// Add .cheapest and .mostExpensive options	
	const insurerOptionsSortedByPrice = Object.values(output.options).sort((a, b) => a.total.personalContribution - b.total.personalContribution);
	output.options.cheapest = insurerOptionsSortedByPrice[0];
	output.options.mostExpensive = insurerOptionsSortedByPrice[insurerOptionsSortedByPrice.length - 1];

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
	 	(occupations.isEmployed(occupation) && monthlyIncome >= healthInsurance.minFreiwilligMonthlyIncome)
		|| (occupations.isStudent(occupation) && isWorkingStudent(occupation, monthlyIncome, hoursWorkedPerWeek))
		|| occupations.isSelfEmployed(occupation)
		|| occupations.isUnemployed(occupation)
		|| isMinijob(occupation, monthlyIncome)
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