{% include '_js/utils/constants.js' %}
{% include '_js/utils/currency.js' %}
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

	if(occupation === 'azubi') {
		// When the Azubi's pay is too low, the employer pays for everything - § 20 Abs. 3 SGB IV
		tariff = monthlyIncome <= healthInsurance.azubiFreibetrag ? 'azubiFree' : 'azubi';
	}
	else if(occupations.isStudent(occupation) && age < 30) {
		tariff = 'student';

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
	else if(occupations.isEmployed('employee')) {
		tariff = 'employee';
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

function expatOptions(age){
	return [
	{% for id, cost in EXPAT_INSURANCE_COST.items() %}
		{
			id: "{{ id }}",
			total: {
				personalContribution: {{ cost }},
			},
		},
	{% endfor %}
	];
}

function canHaveEHIC(hasEUPublicHealthInsurance, hasGermanPublicHealthInsurance, monthlyIncome){
	// EHIC is available if you are publicly insured in another EU country
	// It's invalidated as soon as you have an income, even if it's below the minijob threshold
	return (
		hasEUPublicHealthInsurance
		&& !hasGermanPublicHealthInsurance
		&& !monthlyIncome
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
	return (
		occupation !== 'azubi'
		&& monthlyIncome <= maxIncome
	);
}

function canHaveFamilienversicherungFromSpouse(occupation, monthlyIncome, isMarried){
	// There is no age limit if getting FV from your spouse
	return (
		isMarried
		&& _canHaveFamilienversicherung(occupation, monthlyIncome)
	);
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

function canBePaidBySocialBenefits(occupation, monthlyIncome, isApplyingForFirstVisa){
	return (
		occupations.isUnemployed(occupation)
		&& monthlyIncome <= healthInsurance.maxFamilienversicherungIncome
		&& !isApplyingForFirstVisa
	);
}

function isPflichtversichertAzubi(occupation, monthlyIncome){
	return (
		occupation === 'azubi'
		&& monthlyIncome > healthInsurance.azubiFreibetrag
		&& monthlyIncome < healthInsurance.minFreiwilligMonthlyIncome
	);
}

function isHighPaidEmployee(occupation, monthlyIncome){
	// Those can choose private health insurance, but public is still forced to accept them at first
	return (
		occupations.isEmployed(occupation)
		&& monthlyIncome >= healthInsurance.minFreiwilligMonthlyIncome
	);
}

function isPflichtversichertEmployee(occupation, monthlyIncome, hoursWorkedPerWeek, age){
	return (
		occupations.isEmployed(occupation)
		&& !occupations.isMinijob(occupation, monthlyIncome)
		&& !isHighPaidEmployee(occupation, monthlyIncome)
		&& !isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek)
	);
}

function isPflichtversichert(occupation, monthlyIncome, hoursWorkedPerWeek, age){
	return (
		isPflichtversichertEmployee(occupation, monthlyIncome, hoursWorkedPerWeek, age)
		|| isPflichtversichertAzubi(occupation, monthlyIncome)
	);
}

function canHaveStudentTarif(occupation, monthlyIncome, hoursWorkedPerWeek, age){
	return (
		occupations.isStudent(occupation)
		&& age < 30
		&& isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek)
	)
}

function canHavePublicHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age, hasEUPublicHealthInsurance){
	return (
		// If you had public health insurance in 2 of the last 5 years in the EU - §9 Abs. 1 S. 1 SGB V
		hasEUPublicHealthInsurance
		|| isPflichtversichert(occupation, monthlyIncome, hoursWorkedPerWeek, age)
		|| canHaveStudentTarif(occupation, monthlyIncome, hoursWorkedPerWeek, age)
		|| isHighPaidEmployee(occupation, monthlyIncome)
	);
}

function canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age){
	return (
	 	!isPflichtversichert(occupation, monthlyIncome, hoursWorkedPerWeek, age)
		|| isWerkstudent(occupation, monthlyIncome, hoursWorkedPerWeek)
		|| occupations.isSelfEmployed(occupation)
		|| occupations.isUnemployed(occupation)
	)
}

function canHaveExpatHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age, hasGermanPublicHealthInsurance){
	// These people can, but don't have to get expat insurance

	// Anyone who is temporarily in Germany can use expat insurance.
	// But the insurer and the immigration office must also agree that you are temporarily here.
	// This is only checked when you make a claim or apply for a residence permit,

	// TODO: It does not work for people who have been in Germany for more than 5 years
	return (
		!hasGermanPublicHealthInsurance
		&& !isPflichtversichert(occupation, monthlyIncome, hoursWorkedPerWeek, age)
		&& !isHighPaidEmployee(occupation, monthlyIncome)
	);
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
	);
}

function getHealthInsuranceOptions({
	age,
	childrenCount,
	hasEUPublicHealthInsurance,
	hasGermanPublicHealthInsurance,
	hoursWorkedPerWeek,
	isApplyingForFirstVisa,
	isMarried,
	monthlyIncome,
	occupation,

	customZusatzbeitrag,
	sortByPrice,
}){
	const output = {
		flags: new Set(),
		asList: [],  // The order here matters
	};

	if(hasGermanPublicHealthInsurance){
		hasEUPublicHealthInsurance = true;
	}

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

	if(canBePaidBySocialBenefits(occupation, monthlyIncome, isApplyingForFirstVisa)){
		output.flags.add('social-benefits');
		output.free.options.push({ id: 'social-benefits' });
	}

	if(canHaveEHIC(hasEUPublicHealthInsurance, hasGermanPublicHealthInsurance, monthlyIncome)){
		output.flags.add('ehic');
		output.free.options.push({ id: 'ehic' });
	}

	if(output.free.options.length){
		output.flags.add('free');
		output.free.eligible = true;
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
	if(canHaveExpatHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age, hasGermanPublicHealthInsurance)){
		output.flags.add('expat');
		output.expat.eligible = true;
		output.expat.options = expatOptions(age);
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

	if(canHavePublicHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age, hasEUPublicHealthInsurance)){
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

		if(isApplyingForFirstVisa){
			// Expat health insurance is often needed as a gap insurance before public health insurance kicks in
			// EU citizens don't need this because of EHIC, but EU residents do
			output.flags.add('gap-insurance');
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
			{id: 'askABroker'},
		],
	}

	if(canHavePrivateHealthInsurance(occupation, monthlyIncome, hoursWorkedPerWeek, age)){
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

	if(age >= 55){
		output.asList = [output.public, output.expat, output.private];
	}
	else if(occupations.isStudent(occupation)){
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
		output.expat.options.sort((a, b) => a.total.personalContribution - b.total.personalContribution);
		output.other.options.sort((a, b) => a.total.personalContribution - b.total.personalContribution);
	}

	output.asList.unshift(output.free);
	output.asList.push(output.other);
	output.asList = output.asList.filter(o => o.eligible);

	return output;
}
{% endjs %}