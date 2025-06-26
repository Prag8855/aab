// TODO: Test custom zusatzbeitrag
// TODO: Test insurance for student freelancers

import { hasFlag, notHasFlag } from './test-utils.js';

const round = roundCurrency;
const equal = assert.equal;
const defaultInsurer = Object.values(healthInsurance.companies)[0];


function hasAzubiTariff(output){
	it('pays the Azubi tarif', () => {
		hasFlag(output, 'public-tariff-azubi')();
		notHasFlag(output, 'public-tariff-azubiFree')();
		notHasFlag(output, 'public-minijob')();
	});
}
function hasAzubiFreeTariff(output){
	it('gets free insurance due to their low income', () => {
		hasFlag(output, 'public-tariff-azubiFree')();
		notHasFlag(output, 'public-tariff-azubi')();
		notHasFlag(output, 'public-minijob')();
		equal(output.public.options[0].total.personalContribution, 0);
	});
}

function hasEmployeeTarif(output){
	it('pays the employee tarif', hasFlag(output, 'public-tariff-employee'));
}

function hasMinijobTariff(output, paysPflegeversicherungSurcharge){
 	const o = output.public.options[0];

	it('pays the minimum self-pay rate (minijob)', () => {
		hasFlag(output, 'public-minijob')();
		hasFlag(output, 'public-tariff-selfPay')();
		hasFlag(output, 'public-min-contribution')();

		equal(o.baseContribution.totalContribution, round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
		equal(o.zusatzbeitrag.totalContribution, round(healthInsurance.minMonthlyIncome * defaultInsurer.zusatzbeitrag));
		if(paysPflegeversicherungSurcharge){
			equal(o.pflegeversicherung.totalContribution, round(pflegeversicherung.surchargeRate * healthInsurance.minMonthlyIncome));
		}
		else{
			equal(o.pflegeversicherung.totalContribution, round(pflegeversicherung.defaultRate * healthInsurance.minMonthlyIncome));
		}
		equal(o.total.employerContribution, 0);
	});
}
function doesNotHaveMinijobTariff(output){
	it('does not have a minijob', notHasFlag(output, 'public-minijob'));
}

function hasMidijobTarif(output, paysPflegeversicherungSurcharge){
	it('pays the midijob tariff', () => {
		hasFlag(output, 'public-tariff-midijob')();

		// TODO: Test calculation properly
	});
}

function canHavePrivate(output){
	it('can get private health insurance', hasFlag(output, 'private'));
}
function cannotHavePrivate(output){
	it('cannot get private health insurance', notHasFlag(output, 'private'));
}

function canUseSpouseInsurance(output){
	it('can use their spouse\'s insurance', hasFlag(output, 'familienversicherung-spouse'));
}
function cannotUseSpouseInsurance(output){
	it('cannot use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
}

function canUseParentsInsurance(output){
	it('can use their parents\' insurance', hasFlag(output, 'familienversicherung-parents'));
}
function cannotUseParentsInsurance(output){
	it('cannot use their parents\' insurance', notHasFlag(output, 'familienversicherung-parents'));
}

function canUseEHIC(output){
	it('can use their EHIC card', hasFlag(output, 'ehic'));
}
function cannotUseEHIC(output){
	it('cannot use their EHIC card', notHasFlag(output, 'ehic'));
}

function hasStudentTariff(output, paysPflegeversicherungSurcharge) {
 	const o = output.public.options[0];

	it('pays the student tariff', () => {
		hasFlag(output, 'public-tariff-student')();
		notHasFlag(output, 'public-student-over-30')();
		notHasFlag(output, 'public-not-werkstudent')();

		// TODO: Fix calculation
		equal(o.baseContribution.totalContribution, round(healthInsurance.studentRate * bafogBedarfssatz));
		equal(o.zusatzbeitrag.totalContribution, round(defaultInsurer.zusatzbeitrag * bafogBedarfssatz));
		if(paysPflegeversicherungSurcharge){
			equal(o.pflegeversicherung.totalContribution, round(pflegeversicherung.surchargeRate * bafogBedarfssatz));
		}
		else{
			equal(o.pflegeversicherung.totalContribution, round(pflegeversicherung.defaultRate * bafogBedarfssatz));
		}
		equal(o.total.employerContribution, 0);
	});
}

function paysPflegeversicherungSurcharge(output){
	// TODO: Test surcharge rate
	it('pays a Pflegeversicherung surcharge', hasFlag(output, 'public-pflegeversicherung-surcharge'));
}

function doesNotPayPflegeversicherungSurcharge(output){
	it('does not pay a Pflegeversicherung surcharge', notHasFlag(output, 'public-pflegeversicherung-surcharge'));
}

function paysMinimumSelfEmployedAmount(output, paysPflegeversicherungSurcharge) {
 	const o = output.public.options[0];

	it('pays the minimum price for self-employed people', () => {
		hasFlag(output, 'public-tariff-selfEmployed')();
		hasFlag(output, 'public-min-contribution')();

		equal(o.baseContribution.totalContribution, round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
		equal(o.zusatzbeitrag.totalContribution, round(healthInsurance.minMonthlyIncome * defaultInsurer.zusatzbeitrag));
		if(paysPflegeversicherungSurcharge){
			equal(o.pflegeversicherung.totalContribution, round(healthInsurance.minMonthlyIncome * pflegeversicherung.surchargeRate));
		}
		else{
			equal(o.pflegeversicherung.totalContribution, round(healthInsurance.minMonthlyIncome * pflegeversicherung.defaultRate));
		}	
		equal(o.total.employerContribution, 0);
	});
}

function paysMinimumSelfPayAmount(output, paysPflegeversicherungSurcharge){
 	const o = output.public.options[0];

	it('pays the minimum self-pay price', () => {
		hasFlag(output, 'public-tariff-selfPay')();
		hasFlag(output, 'public-min-contribution')();

		equal(o.baseContribution.totalContribution, round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
		equal(o.zusatzbeitrag.totalContribution, round(healthInsurance.minMonthlyIncome * defaultInsurer.zusatzbeitrag));

		if(paysPflegeversicherungSurcharge){
			equal(o.pflegeversicherung.totalContribution, round(healthInsurance.minMonthlyIncome * pflegeversicherung.surchargeRate));
		}
		else{
			equal(o.pflegeversicherung.totalContribution, round(healthInsurance.minMonthlyIncome * pflegeversicherung.defaultRate));
		}
		equal(o.total.employerContribution, 0);
	});
}

function hasMaximumSelfEmployedTariff(output) {
 	const o = output.public.options[0];

	it('pays the maximum price for self-employed people', () => {
		hasFlag(output, 'public-tariff-selfEmployed')();
		hasFlag(output, 'public-max-contribution')();

		equal(o.baseContribution.totalContribution, round(healthInsurance.maxMonthlyIncome * healthInsurance.selfPayRate));
		equal(o.zusatzbeitrag.totalContribution, round(healthInsurance.maxMonthlyIncome * defaultInsurer.zusatzbeitrag));
		if(paysPflegeversicherungSurcharge){
			equal(o.pflegeversicherung.totalContribution, round(healthInsurance.maxMonthlyIncome * pflegeversicherung.surchargeRate));
		}
		else{
			equal(o.pflegeversicherung.totalContribution, round(healthInsurance.maxMonthlyIncome * pflegeversicherung.defaultRate));
		}
		equal(o.total.employerContribution, 0);
	});
}

function isNotWerkstudentDueToIncome(output, paysPflegeversicherungSurcharge) {
 	const o = output.public.options[0];

	it('is a Werkstudent because their income is too high', () => {
		hasFlag(output, 'public-tariff-employee')();
		hasFlag(output, 'public-not-werkstudent')();
		notHasFlag(output, 'public-tariff-student')();

		const income = Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1);
		equal(o.baseContribution.totalContribution, round(income * healthInsurance.defaultRate));
		equal(o.zusatzbeitrag.totalContribution, round(income * defaultInsurer.zusatzbeitrag));
		if(paysPflegeversicherungSurcharge){
			equal(o.pflegeversicherung.totalContribution, round(income * pflegeversicherung.surchargeRate));
		}
		else{
			equal(o.pflegeversicherung.totalContribution, round(income * pflegeversicherung.defaultRate));
		}

	});
}

function paysMaximumEmployeeAmount(output) {
 	const o = output.public.options[0];

	it('pays the maximum price for employees', () => {
		hasFlag(output, 'public-max-contribution')();

		equal(o.baseContribution.totalContribution, round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate));
		equal(o.zusatzbeitrag.totalContribution, round(healthInsurance.maxMonthlyIncome * defaultInsurer.zusatzbeitrag));
		equal(o.pflegeversicherung.totalContribution, round(healthInsurance.maxMonthlyIncome * pflegeversicherung.defaultRate));
		equal(
			o.total.employerContribution,
			round(
				round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate / 2)
				+ round(healthInsurance.maxMonthlyIncome * defaultInsurer.zusatzbeitrag / 2)
				+ round(healthInsurance.maxMonthlyIncome * pflegeversicherung.employerRate)
			)
		);
	});
}

describe('getHealthInsuranceOptions', () => {
	describe('married people with a low income', () => {
		const output = getHealthInsuranceOptions({
			age: 40,
			childrenCount: 0,
			isMarried: true,
			occupation: 'unemployed',
			monthlyIncome: healthInsurance.maxFamilienversicherungIncome,
		});
		canUseSpouseInsurance(output);
	});

	describe('unmarried people with a low income', () => {
		const output = getHealthInsuranceOptions({
			age: 40,
			childrenCount: 0,
			isMarried: false,
			occupation: 'unemployed',
			monthlyIncome: taxes.maxMinijobIncome,
		});
		cannotUseSpouseInsurance(output);
	});

	describe('students', () => {
		describe('a 22 year old student with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,
			});

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			canHavePrivate(output);
			cannotUseEHIC(output)
			canUseSpouseInsurance(output)
			canUseParentsInsurance(output);
		});

		describe('a 23 year old student with a minijob (and a child)', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,
			});

			hasStudentTariff(output, false);
			doesNotHaveMinijobTariff(output);
			doesNotPayPflegeversicherungSurcharge(output);

			canHavePrivate(output);
			cannotUseEHIC(output)
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);
		});

		describe('a 25 year old student with a minijob (and no children)', () => {
			const output = getHealthInsuranceOptions({
				age: 25,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,
			});

			hasStudentTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			canHavePrivate(output);
			cannotUseEHIC(output);
			cannotUseParentsInsurance(output);
			canUseSpouseInsurance(output);
		});

		describe('a 29 year old student with a minijob (and not children)', () => {
			const output = getHealthInsuranceOptions({
				age: 29,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,
			});

			hasStudentTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			canHavePrivate(output)
			cannotUseEHIC(output)
			canUseSpouseInsurance(output)
			cannotUseParentsInsurance(output);
		});

		describe('a 30 year old student with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 30,
				childrenCount: 0,
				isMarried: true,
				isEUResident: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,
			});

			it('cannot get the student tariff', hasFlag(output, 'public-student-over-30'));
			hasMinijobTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			canHavePrivate(output);

			cannotUseEHIC(output)
			canUseSpouseInsurance(output)
			cannotUseParentsInsurance(output);
		});

		describe(`a 22 year old student with a €${taxes.maxMinijobIncome + 1} job (and no children)`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
				hoursWorkedPerWeek: 20,
			});

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);

			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output);
		});

		describe(`a student with a 20 hr/week, ${Math.floor(0.75 * healthInsurance.maxNebenjobIncome - 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.floor(0.75 * healthInsurance.maxNebenjobIncome - 1),
				hoursWorkedPerWeek: 20,
			});

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			canHavePrivate(output); // Because Werkstudent?
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorkedPerWeek: 20,
			});

			isNotWerkstudentDueToIncome(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			cannotHavePrivate(output); // Treated as an employee
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe('a student with a 21 hr/week, €1500/month job', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: 1500,
				hoursWorkedPerWeek: 21,  // No longer Werkstudent
			});

			hasMidijobTarif(output);
			doesNotPayPflegeversicherungSurcharge(output);
			cannotHavePrivate(output);

			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorked: 20
			});

			isNotWerkstudentDueToIncome(output);

			cannotHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		// TODO: Students with freelance income
	});

	describe('unemployed people', () => {
		describe('an 18 year old unemployed EU resident', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
				isEUResident: true,
			});

			paysMinimumSelfPayAmount(output);
			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);

			canUseEHIC(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);

			doesNotPayPflegeversicherungSurcharge(output);
		});
		describe('an 18 year old unemployed EU resident', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
				isEUResident: false,
			});
			cannotUseEHIC(output);
		});

		describe('a 22 year old unemployed EU resident', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
				isEUResident: true
			});

			paysMinimumSelfPayAmount(output);
			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);
			canUseEHIC(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);
			doesNotPayPflegeversicherungSurcharge(output);
		});

		describe('a 23 year old unemployed person', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
				isEUResident: true,
			});

			paysMinimumSelfPayAmount(output, true);
			doesNotHaveMinijobTariff(output);

			canHavePrivate(output);
			canUseEHIC(output);
			canUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
			paysPflegeversicherungSurcharge(output);
		});
	});

	describe('employees', () => {
		describe('an 18 year old employee with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasMinijobTariff(output);

			canHavePrivate(output);
			cannotUseEHIC(output)
			canUseSpouseInsurance(output)
			canUseParentsInsurance(output);
		});

		describe('a 22 year old employee with a minijob', () => {
			const outputWithKids = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			paysMinimumSelfPayAmount(outputNoKids);
			hasMinijobTariff(outputNoKids);
			canHavePrivate(outputNoKids);
			cannotUseEHIC(outputNoKids)
			canUseSpouseInsurance(outputNoKids)
			canUseParentsInsurance(outputNoKids);
		});

		describe('a 23 year old employee with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasMinijobTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			canHavePrivate(output);
			cannotUseEHIC(output);
			canUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an 18 year old employee with a €${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 19,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
			});

			hasEmployeeTarif(output, false);

			cannotHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a 23 year old employee with a €${taxes.maxMinijobIncome + 1} job (and a child)`, () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			hasMidijobTarif(output, false);
			doesNotPayPflegeversicherungSurcharge(output);

			cannotHavePrivate(output);
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`a 22 year old employee with a €${taxes.maxMinijobIncome + 1} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			hasMidijobTarif(output);

			cannotHavePrivate(output);
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`an employee with a €${taxes.maxMinijobIncome + 1} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			hasMidijobTarif(output);

			cannotHavePrivate(output);
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`an employee with a €${healthInsurance.maxMidijobIncome} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.maxMidijobIncome,
			});

			hasMidijobTarif(output);

			cannotHavePrivate(output);
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`an employee with a €${healthInsurance.maxMidijobIncome + 1} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.maxMidijobIncome + 1,
			});

			hasEmployeeTarif(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			cannotHavePrivate(output);
		});

		describe(`an employee with a €${Math.ceil(healthInsurance.maxMonthlyIncome + 100)} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: Math.ceil(healthInsurance.maxMonthlyIncome + 100),
			});

			hasEmployeeTarif(output, false);
			paysMaximumEmployeeAmount(output);
			cannotHavePrivate(output);
		});

		describe(`an employee with a €${healthInsurance.minFreiwilligMonthlyIncome} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.minFreiwilligMonthlyIncome,
			});

			hasEmployeeTarif(output, false);
			paysMaximumEmployeeAmount(output);
			canHavePrivate(output);
		});

		describe(`an employee with a €200,000 job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 200000/12,
			});

			hasEmployeeTarif(output, false);
			paysMaximumEmployeeAmount(output);
			canHavePrivate(output);
		});
	});

	describe('freelancers', () => {
		describe(`a 22 year old freelancer with a €${healthInsurance.maxFamilienversicherungIncome} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: healthInsurance.maxFamilienversicherungIncome,
				hasGermanInsurance: true,
			});

			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);
			cannotUseEHIC(output);
		});

		describe(`a 22 year old freelancer with a €${taxes.maxMinijobIncome} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
			cannotUseEHIC(output);
		});

		describe(`a 22 year old freelancer with a €${taxes.maxMinijobIncome + 1} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome + 1,
				hasGermanInsurance: true,
			});

			paysMinimumSelfEmployedAmount(output);
			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a 23 year old freelancer with a €${taxes.maxMinijobIncome + 1} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome + 1,
				hasGermanInsurance: true,
			});

			paysMinimumSelfEmployedAmount(output);
			doesNotHaveMinijobTariff(output);
			canHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe('a 23 year old freelancer with a €1000 income', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: 1000,
				hasGermanInsurance: true,
			});

			paysMinimumSelfEmployedAmount(output, true);
			canHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`a 23 year old freelancer with a €${Math.ceil(healthInsurance.maxMonthlyIncome + 100)} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: Math.ceil(healthInsurance.maxMonthlyIncome + 100),
				hasGermanInsurance: true,
			});

			hasMaximumSelfEmployedTariff(output, true);
			canHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});
	});

	describe('azubis', () => {
		describe(`an Azubi with a €${healthInsurance.azubiFreibetrag} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: healthInsurance.azubiFreibetrag,
			});

			hasAzubiFreeTariff(output);
			doesNotHaveMinijobTariff(output);
			cannotHavePrivate(output);
			cannotUseEHIC(output)
			cannotUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});

		describe(`an Azubi with a €${taxes.maxMinijobIncome + 1} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			hasAzubiTariff(output);
			cannotHavePrivate(output);
			cannotUseEHIC(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an Azubi with a €${Math.ceil(healthInsurance.maxMonthlyIncome + 100)} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: Math.ceil(healthInsurance.maxMonthlyIncome + 100),
			});

			hasAzubiTariff(output);
			paysMaximumEmployeeAmount(output);
			cannotHavePrivate(output);
		});

		describe(`an Azubi with a €${ healthInsurance.minFreiwilligMonthlyIncome } income`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: healthInsurance.minFreiwilligMonthlyIncome,
			});

			hasAzubiTariff(output);
			paysMaximumEmployeeAmount(output);
			canHavePrivate(output);
		});
	});

	describe('parents', () => {
		describe(`a person with no children`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			paysPflegeversicherungSurcharge(output);
		});
		describe(`a parent with 1 child`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 1,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets no Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate);
				notHasFlag(output, 'public-pflegeversicherung-surcharge')();
			});
		});
		describe(`a parent with 2 children`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 2,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets a 0.25% Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 0.25/100);
			});
		});
		describe(`a parent with 3 children`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 3,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets a 0.5% Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 0.5/100);
			});
		});
		describe(`a parent with 4 children`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 4,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets a 0.75% Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 0.75/100);
			});
		});
		describe(`a parent with 5 children`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 5,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets a 1% Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 1/100);
			});
		});
		describe(`a parent with 6 children`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 6,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets a 1% Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 1/100);
			});
		});
	});
});
