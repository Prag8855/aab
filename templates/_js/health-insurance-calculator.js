{% include '_js/constants.js' %}
{% include '_js/currency.js' %}
{% js %}

function getAdjustedMonthlyIncome(tariff, monthlyIncome){
	// Returns the income used to calculate the cost of public health insurance contributions.
	// This is used to enforce a minimum/maximum cost.
	// In some cases, different incomes can be used to measure the employee and employer's contributions.

	if(tariff === 'azubiFree'){
		// There is no minimum income for the Azubi calculation, but the Beitragsbemessungsgrenze applies
		const adjustedIncome = Math.min(healthInsurance.maxMonthlyIncome, monthlyIncome);
		return {
			personal: adjustedIncome,
			employer: adjustedIncome,
			total: adjustedIncome,
		}
	}
	else if(tariff === 'midijob'){
		// With a midijob, the cost is based on a fictional income, calculated according to § 20 Abs. 2a SGB IV
		const totalAdjustedIncome = (
			healthInsurance.factorF * taxes.maxMinijobIncome
			+ (
				(healthInsurance.maxMidijobIncome / (healthInsurance.maxMidijobIncome - taxes.maxMinijobIncome))
				- (
					(taxes.maxMinijobIncome / (healthInsurance.maxMidijobIncome - taxes.maxMinijobIncome))
					* healthInsurance.factorF
				)
			) * (monthlyIncome - taxes.maxMinijobIncome)
		);
		const employeeAdjustedIncome = (
			(
				healthInsurance.maxMidijobIncome
				/ (healthInsurance.maxMidijobIncome - taxes.maxMinijobIncome)
			)
			* (monthlyIncome - taxes.maxMinijobIncome)
		);
		return {
			personal: employeeAdjustedIncome,
			employer: totalAdjustedIncome - employeeAdjustedIncome,
			total: totalAdjustedIncome,
		}

	}
	else if(tariff === 'student'){
		// Students pay a fixed amount based on the bafogBedarfssatz
		return {
			personal: bafogBedarfssatz,
			employer: bafogBedarfssatz,
			total: bafogBedarfssatz,
		}
	}

	const adjustedIncome = Math.min(
		healthInsurance.maxMonthlyIncome, // Beitragsbemessungsgrenze - If you earn more, your contributions stop going up
		Math.max(monthlyIncome, healthInsurance.minMonthlyIncome) // If you earn less, your contributions stop going down
	);
	return {
		personal: adjustedIncome,
		employer: adjustedIncome,
		total: adjustedIncome,
	}
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

		if(!isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek)){
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
		// When the Azubi's pay is too low, the employer pays for everything - §20 Abs. 3 SGB IV
		tariff = monthlyIncome <= healthInsurance.azubiFreibetrag ? 'azubiFree' : 'azubi';
	}

	if(tariff === 'employee'){
		if(occupations.isMinijob(occupation, monthlyIncome)) {
			tariff = 'selfPay';
		}
		else if(isMidijob(occupation, monthlyIncome)) {
			tariff = 'midijob';
		}
	}

	return tariff;
}

function gkvBaseContribution(tariff, monthlyIncome){
	// Calculate the base contribution for the employee and the employer
	// This is the main cost of public health insurance - usually 14% or 14.6% of one's income
	const adjustedMonthlyIncome = getAdjustedMonthlyIncome(tariff, monthlyIncome);

	const totalRate = {
		student: healthInsurance.studentRate,
		selfPay: healthInsurance.selfPayRate,
		selfEmployed: healthInsurance.selfPayRate,
		midijob: healthInsurance.defaultRate,
		employee: healthInsurance.defaultRate,
		azubi: healthInsurance.defaultRate,
		azubiFree: healthInsurance.defaultRate,
	}[tariff];

	const employerRate = {
		student: 0,
		selfPay: 0,
		selfEmployed: 0,
		midijob: totalRate / 2,
		employee: totalRate / 2,
		azubi: totalRate / 2,
		azubiFree: totalRate,
	}[tariff];

	const personalRate = totalRate - employerRate;

	return {
		totalRate,
		personalRate,
		employerRate,
		totalContribution: roundCurrency(totalRate * adjustedMonthlyIncome.total),
		personalContribution: roundCurrency(personalRate * adjustedMonthlyIncome.personal),
		employerContribution: roundCurrency(employerRate * adjustedMonthlyIncome.employer),
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

function gkvPflegeversicherung(tariff, monthlyIncome, age, childrenCount){
	// Calculate the rate and cost of Pflegeversicherung for the employee and the employer
	const adjustedMonthlyIncome = getAdjustedMonthlyIncome(tariff, monthlyIncome);

	const totalRate = gkvPflegeversicherungRate(age, childrenCount);
	const employerRate = {
		student: 0,
		selfPay: 0,
		selfEmployed: 0,
		midijob: pflegeversicherung.employerRate,
		employee: pflegeversicherung.employerRate,
		azubi: pflegeversicherung.employerRate,
		azubiFree: totalRate,
	}[tariff];

	const personalRate = totalRate - employerRate;

	return {
		totalRate,
		personalRate,
		employerRate,
		totalContribution: roundCurrency(totalRate * adjustedMonthlyIncome.total),
		personalContribution: roundCurrency(personalRate * adjustedMonthlyIncome.personal),
		employerContribution: roundCurrency(employerRate * adjustedMonthlyIncome.employer),
	}
}

function gkvZusatzbeitrag(zusatzbeitragRate, tariff, monthlyIncome){
	// Calculate the health insurance Zusatzbeitrag for the employee and the employer
	const adjustedMonthlyIncome = getAdjustedMonthlyIncome(tariff, monthlyIncome);

	const employerRate = {
		student: 0,
		selfPay: 0,
		selfEmployed: 0,
		midijob: zusatzbeitragRate / 2,
		employee: zusatzbeitragRate / 2,
		azubi: zusatzbeitragRate / 2,
		azubiFree: zusatzbeitragRate,
	}[tariff];

	const personalRate = zusatzbeitragRate - employerRate;

	return {
		totalRate: zusatzbeitragRate,
		personalRate,
		employerRate,
		totalContribution: roundCurrency(zusatzbeitragRate * adjustedMonthlyIncome.total),
		personalContribution: roundCurrency(personalRate * adjustedMonthlyIncome.personal),
		employerContribution: roundCurrency(employerRate * adjustedMonthlyIncome.employer),
	};
}

function kskOption(monthlyIncome, age, childrenCount){
	const baseContribution = gkvBaseContribution('employee', monthlyIncome);
	const pflegeversicherung = gkvPflegeversicherung('employee', monthlyIncome, age, childrenCount);
	const zusatzbeitrag = gkvZusatzbeitrag(healthInsurance.averageZusatzbeitrag, 'employee', monthlyIncome);
	return {
		id: 'ksk', 
		name: 'Künstlersozialkasse',
		tariff: 'employee',
		baseContribution,
		pflegeversicherung,
		zusatzbeitrag,
		total: {
			totalRate: baseContribution.totalRate + pflegeversicherung.totalRate + zusatzbeitrag.totalRate,
			employerRate: baseContribution.employerRate + pflegeversicherung.employerRate + zusatzbeitrag.employerRate,
			personalRate: baseContribution.personalRate + pflegeversicherung.personalRate + zusatzbeitrag.personalRate,
			totalContribution: roundCurrency(baseContribution.totalContribution + pflegeversicherung.totalContribution + zusatzbeitrag.totalContribution),
			employerContribution: roundCurrency(baseContribution.employerContribution + pflegeversicherung.employerContribution + zusatzbeitrag.employerContribution),
			personalContribution: roundCurrency(baseContribution.personalContribution + pflegeversicherung.personalContribution + zusatzbeitrag.personalContribution),
		}
	};
}

function gkvOptions({occupation, monthlyIncome, hoursWorkedPerWeek, age, childrenCount, customZusatzbeitrag}){
	const tariff = gkvTariff(age, occupation, monthlyIncome, hoursWorkedPerWeek);

	const baseContribution = gkvBaseContribution(tariff, monthlyIncome);
	const pflegeversicherung = gkvPflegeversicherung(tariff, monthlyIncome, age, childrenCount);

	const krankenkassen = Object.entries(healthInsurance.companies);

	// Add a custom health insurer with a user-defined Zusatzbeitrag
	if(customZusatzbeitrag){
		krankenkassen.push(['custom', {
			name: 'Other health insurer',
			zusatzbeitrag: customZusatzbeitrag,
		}]);
	}

	return krankenkassen.map(([krankenkasseKey, krankenkasse]) => {
		const zusatzbeitrag = gkvZusatzbeitrag(krankenkasse.zusatzbeitrag, tariff, monthlyIncome);

		return {
			id: krankenkasseKey, 
			name: krankenkasse.name,
			tariff,
			baseContribution,
			pflegeversicherung,
			zusatzbeitrag,
			total: {
				totalRate: baseContribution.totalRate + pflegeversicherung.totalRate + zusatzbeitrag.totalRate,
				employerRate: baseContribution.employerRate + pflegeversicherung.employerRate + zusatzbeitrag.employerRate,
				personalRate: baseContribution.personalRate + pflegeversicherung.personalRate + zusatzbeitrag.personalRate,
				totalContribution: roundCurrency(baseContribution.totalContribution + pflegeversicherung.totalContribution + zusatzbeitrag.totalContribution),
				employerContribution: roundCurrency(baseContribution.employerContribution + pflegeversicherung.employerContribution + zusatzbeitrag.employerContribution),
				personalContribution: roundCurrency(baseContribution.personalContribution + pflegeversicherung.personalContribution + zusatzbeitrag.personalContribution),
			}
		};
	});
}

function canHaveEHIC(isEUCitizen, monthlyIncome){
	// EHIC is available if you are insured in another EU country
	// It's invalidated as soon as you have an income, even if it's below the minijob threshold
	return (
		isEUCitizen
		&& monthlyIncome === 0
	);
}

function isMidijob(occupation, monthlyIncome){
	// No midijob tariff for Azubis
	// https://www.haufe.de/sozialwesen/versicherungen-beitraege/auszubildende-besonderheiten-bei-den-neuen/besonderheiten-bei-der-beitragsberechnung_240_94670.html
	return (
		occupations.isEmployed(occupation)
		&& occupation !== 'azubi'
		&& !occupations.isMinijob(occupation, monthlyIncome)
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

function isPaidBySocialBenefits(occupation, monthlyIncome){
	// If income below limit, and receiving social benefits
	return (
		occupations.isUnemployed(occupation)
		&& monthlyIncome <= healthInsurance.maxFamilienversicherungIncome
	);
}

function canHavePublicHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age, isEUCitizen, currentInsurance){
	return (
		// If you had public health insurance in 2 of the last 5 years in the EU
		currentInsurance === 'public'
		|| (
			// Students under 30
			occupations.isStudent(occupation)
			&& age < 30
			&& !isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek)
		)
		|| (
			// Employees, except minijobs and high incomes
			occupations.isEmployed(occupation)
			&& !occupations.isMinijob(occupation, monthlyIncome)
			&& monthlyIncome < healthInsurance.minFreiwilligMonthlyIncome
			&& age <= 55  // TODO: Only if they didn't have public in the last 5 years
		)
	);
}

function canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek){
	return (
	 	(occupations.isEmployed(occupation) && monthlyIncome >= healthInsurance.minFreiwilligMonthlyIncome)
		|| (occupations.isStudent(occupation) && isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek))
		|| occupations.isSelfEmployed(occupation)
		|| occupations.isUnemployed(occupation)
		|| occupations.isMinijob(occupation, monthlyIncome)
	);
}

function canHaveExpatHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, currentInsurance){
	// These people CAN have expat health insurance
	return (
		canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek)
		&& currentInsurance !== 'public'
		&& currentInsurance !== 'private'

		// You can keep your expat insurance if you have a minijob
		// Or if you are a Werkstudent
		// Or if you are a student over 30
		&& (occupation !== 'employee' || occupations.isMinijob(occupation, monthlyIncome))
		&& occupation !== 'azubi'
	);
}

function needsGapInsurance(isEUCitizen, currentInsurance){
	// These people need travel/expat insurance to cover them from the day they arrive in Germany to the day their
	// public health insurance kicks in.

	// EU citizens don't need this because of EHIC, but EU residents do
	return !isEUCitizen && !currentInsurance;
}

function canHaveKSK(occupation, monthlyIncome, hoursWorkedPerWeek){
	// Künstlersozialkasse
	return (
		occupations.isSelfEmployed(occupation)
		&& (monthlyIncome * 12) >= healthInsurance.kskMinimumIncome

		// The KSK only covers a student's health insurance if they work under 20 hours per week
		&& !(
			occupations.isStudent(occupation)
			&& hoursWorkedPerWeek > 20
		)
	);
}

function isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek){
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

function needsGapInsurance(occupation, currentInsurance){
	// Immigrants might need expat insurance to cover them from the moment they arrive in Germany
	// to the moment they get covered by public health insurance.
	// - Students before the start of their semester
	// - Employees before they start working

	return !currentInsurance
}

function getHealthInsuranceOptions({
	age,
	childrenCount,
	currentInsurance,
	hoursWorkedPerWeek,
	isEUCitizen,
	isMarried,
	monthlyIncome,
	occupation,
	sortByPrice,
	customZusatzbeitrag,
}){
	const output = {
		flags: new Set(),
		asList: [],  // The order here matters
	};


	/***************************************************
	* Free options
	***************************************************/

	output.free = {
		id: 'free',
		name: 'Free health insurance',
		eligible: false,
		description: '',
		options: [],
	};

	if(canHaveFamilienversicherungFromSpouse(occupation, monthlyIncome, isMarried)){
		output.flags.add('familienversicherung');
		output.flags.add('familienversicherung-spouse');
	}
	if(canHaveFamilienversicherungFromParents(occupation, monthlyIncome, age)){
		output.flags.add('familienversicherung');
		output.flags.add('familienversicherung-parents');
	}
	if(output.flags.has('familienversicherung')){  // Combined option for both Familienversicherung types
		output.free.options.push({ id: 'familienversicherung' });
	}

	if(isPaidBySocialBenefits(occupation, monthlyIncome)){
		output.free.options.push({ id: 'social-benefits' });
		output.flags.add('social-benefits');
	}

	if(canHaveEHIC(isEUCitizen, monthlyIncome)){
		output.free.options.push({ id: 'ehic' });
		output.flags.add('ehic');
	}

	if(output.free.options.length){
		output.free.eligible = true;
		output.flags.add('free');
	}


	/***************************************************
	* Expat health insurance
	***************************************************/

	output.expat = {
		id: 'expat',
		name: 'Expat health insurance',
		eligible: false,
		description: '',
		options: [],
	}
	if(canHaveExpatHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, currentInsurance)){
		output.flags.add('expat');
		output.expat.eligible = true;
		output.expat.options = [
			{id: 'feather-expat', cost: {{ FEATHER_STUDENT_COST }}}, // TODO
			{id: 'ottonova-expat', cost: {{ OTTONOVA_STUDENT_COST }}},
		];
	}


	/***************************************************
	* Public health insurance
	***************************************************/

	output.public = {
		id: 'public',
		name: 'Public health insurance',
		eligible: false,
		description: '',
		options: gkvOptions({
			age,
			childrenCount,
			customZusatzbeitrag,
			hoursWorkedPerWeek,
			monthlyIncome,
			occupation,
		}),
	}

	if(occupations.isStudent(occupation)){
		if(age >= 30) {
			output.flags.add('public-student-over-30');
		}
	}

	if(canHavePublicHealthInsurance((occupation, monthlyIncome, hoursWorkedPerWeek, age, isEUCitizen, currentInsurance))){
		output.public.eligible = true;
		output.flags.add('public');

		const tariff = gkvTariff(age, occupation, monthlyIncome, hoursWorkedPerWeek);
		output.flags.add(`public-tariff-${tariff}`);

		if(occupations.isStudent(occupation)){
			if(!isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek)){
				output.flags.add('public-not-werkstudent');
			}
		}

		if(monthlyIncome >= healthInsurance.maxMonthlyIncome) {
			output.flags.add('public-max-contribution');
		}

		if((tariff === 'selfPay' || tariff === 'selfEmployed') && monthlyIncome <= healthInsurance.minMonthlyIncome) {
			output.flags.add('public-min-contribution');
		}

		if(tariff !== 'student' && occupations.isMinijob(occupation, monthlyIncome)) {
			output.flags.add('public-minijob');
		}

		if(output.public.options[0].pflegeversicherung.totalRate === pflegeversicherung.surchargeRate) {
			output.flags.add('public-pflegeversicherung-surcharge');
		}

		if(needsGapInsurance(isEUCitizen, currentInsurance)){
			output.flags.add('public-gap-insurance');
		}
	}

	/***************************************************
	* Private health insurance
	***************************************************/

	output.private = {
		id: 'private',
		name: 'Private health insurance',
		eligible: false,
		description: '',
		options: [
			{id: 'broker'},
		],
	}

	if(canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek)){
		output.flags.add('private');
		output.private.eligible = true;
	}


	/***************************************************
	* Künstlersozialkasse
	***************************************************/

	output.other = {
		id: 'other',
		name: 'Other options',
		eligible: false,
		description: '',
		options: [],
	};

	if(canHaveKSK(occupation, monthlyIncome, hoursWorkedPerWeek)){
		output.other.eligible = true;
		output.other.options.push(kskOption(monthlyIncome, age, childrenCount));
		output.flags.add('ksk');
	};


	/***************************************************
	* Recommendations
	***************************************************/

	if(occupations.isStudent(occupation)){
		if(output.flags.has('public-student-over-30')){
			// Public is more expensive for older students
			// Expat makes more sense. They can switch to public once they start working.
			output.asList = [output.expat, output.public, output.private];
		}
		else{
			// Public is the best option for students under 30
			output.asList = [output.public, output.expat, output.private];	
		}
	}
	else if(occupations.isMinijob(occupation, monthlyIncome)){
		// Minijobbers can still have expat
		// Private usually refuses them
		output.asList = [output.public, output.expat, output.private];
	}
	else if(occupations.isUnemployed(occupation)){
		// Expat is cheaper for unemployed people
		output.asList = [output.expat, output.public, output.private];
	}
	else if(occupations.isSelfEmployed(occupation)){
		if(monthlyIncome * 12 > 60000){
			// Private makes sense from about €60000 per year
			output.asList = [output.private, output.public, output.expat];
		}
		else if(monthlyIncome * 12 > 30000){
			// Public makes sense for unstable businesses
			// Expat makes sense if non-EU
			output.asList = [output.public, output.private, output.expat];
		}
		else{
			// Expat makes sense for very low incomes
			output.asList = [output.expat, output.public, output.private];
		}
	}
	else if(output.flags.has('public-max-contribution') && age < 45 && childrenCount <= 2){
		// Prefer private for high-earning employees, unless they are old
		output.asList = [output.private, output.public, output.expat];
	}
	else{
		output.asList = [output.public, output.private, output.expat];
	}

	if(sortByPrice){
		output.public.options.sort((a, b) => a.total.personalContribution - b.total.personalContribution);
		output.private.options.sort((a, b) => a.total.personalContribution - b.total.personalContribution);
		output.expat.options.sort((a, b) => a.cost - b.cost);
		output.other.options.sort((a, b) => a.cost - b.cost);
	}

	output.asList.unshift(output.free);
	output.asList.push(output.other);
	output.asList = output.asList.filter(o => o.eligible);

	return output;
}
{% endjs %}