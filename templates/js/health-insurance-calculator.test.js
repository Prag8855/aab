// TODO: Test custom zusatzbeitrag
// TODO: Test insurance for self-employed students
// TODO: Test insurance for unemployed students
// TODO: Test 'public-gap-insurance'

import { hasFlag, notHasFlag } from './test-utils.js';

const round = roundCurrency;
const equal = assert.equal;
const defaultInsurer = Object.values(healthInsurance.companies)[0];

function canJoinKSK(output){
	it('can join the Künstlersozialkasse', () => {
		hasFlag(output, 'ksk')();
		equal(output.other.options.find(o => o.id === 'ksk').id, 'ksk');
	});
}
function cannotJoinKSK(output){
	it('cannot join the Künstlersozialkasse', () => {
		notHasFlag(output, 'ksk')();
		equal(output.other.options.find(o => o.id === 'ksk'), undefined);
	});
}

function isPaidBySocialBenefits(output){
	it('can get free health insurance through social benefits', () => {
		hasFlag(output, 'social-benefits')();
		equal(output.free.options.find(o => o.id === 'social-benefits').id, 'social-benefits');
	});
}
function isNotPaidBySocialBenefits(output){
	it('cannot get free health insurance through social benefits', () => {
		notHasFlag(output, 'social-benefits')();
		equal(output.free.options.find(o => o.id === 'social-benefits'), undefined);
	});
}

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

	it('pays the minimum self-pay amount (minijob)', () => {
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

function isRecommended(output, allowedOptions){
	const options = output.asList.filter(o => o.eligible).map(o => o.id);
	it(`is recommended ${allowedOptions.join(', ')} (in this order)`, () => {
		assert.deepEqual(options, allowedOptions);
	});
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

		assert.deepEqual(o.baseContribution, {
			totalRate: healthInsurance.studentRate,
			totalContribution: round(bafogBedarfssatz * healthInsurance.studentRate),
			employerRate: 0,
			employerContribution: 0,
			personalRate: healthInsurance.studentRate,
			personalContribution: round(bafogBedarfssatz * healthInsurance.studentRate),
		});

		assert.deepEqual(o.zusatzbeitrag, {
			totalRate: defaultInsurer.zusatzbeitrag,
			totalContribution: round(bafogBedarfssatz * defaultInsurer.zusatzbeitrag),
			employerRate: 0,
			employerContribution: 0,
			personalRate: defaultInsurer.zusatzbeitrag,
			personalContribution: round(bafogBedarfssatz * defaultInsurer.zusatzbeitrag),
		});

		const pflegeversicherungRate = paysPflegeversicherungSurcharge ? pflegeversicherung.surchargeRate : pflegeversicherung.defaultRate;

		assert.deepEqual(o.pflegeversicherung, {
			totalRate: pflegeversicherungRate,
			totalContribution: round(bafogBedarfssatz * pflegeversicherungRate),
			employerRate: 0,
			employerContribution: 0,
			personalRate: pflegeversicherungRate,
			personalContribution: round(bafogBedarfssatz * pflegeversicherungRate),
		});
	});
}

function paysPflegeversicherungSurcharge(output){
	it('pays a Pflegeversicherung surcharge', () => {
		hasFlag(output, 'public-pflegeversicherung-surcharge')();
		equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.surchargeRate);
	});
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

function paysMaximumSelfEmployedAmount(output) {
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

function paysMaximumEmployeeAmount(output) {
 	const o = output.public.options[0];

	it('pays the maximum price for employees', () => {
		hasFlag(output, 'public-max-contribution')();

		assert.deepEqual(o.baseContribution, {
			totalRate: healthInsurance.defaultRate,
			totalContribution: round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate),
			employerRate: healthInsurance.defaultRate / 2,
			employerContribution: round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate / 2),
			personalRate: healthInsurance.defaultRate / 2,
			personalContribution: round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate / 2),
		});

		assert.deepEqual(o.zusatzbeitrag, {
			totalRate: defaultInsurer.zusatzbeitrag,
			totalContribution: round(healthInsurance.maxMonthlyIncome * defaultInsurer.zusatzbeitrag),
			employerRate: defaultInsurer.zusatzbeitrag / 2,
			employerContribution: round(healthInsurance.maxMonthlyIncome * defaultInsurer.zusatzbeitrag / 2),
			personalRate: defaultInsurer.zusatzbeitrag / 2,
			personalContribution: round(healthInsurance.maxMonthlyIncome * defaultInsurer.zusatzbeitrag / 2),
		});

		assert.deepEqual(o.pflegeversicherung, {
			totalRate: pflegeversicherung.defaultRate,
			totalContribution: round(healthInsurance.maxMonthlyIncome * pflegeversicherung.defaultRate),
			employerRate: pflegeversicherung.employerRate,
			employerContribution: round(healthInsurance.maxMonthlyIncome * pflegeversicherung.employerRate),
			personalRate: pflegeversicherung.defaultRate - pflegeversicherung.employerRate,
			personalContribution: round(healthInsurance.maxMonthlyIncome * o.pflegeversicherung.personalRate),
		});

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

function isNotWerkstudentDueToIncome(output, paysPflegeversicherungSurcharge) {
 	const o = output.public.options[0];

	it('is not a Werkstudent because their income is too high', () => {
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

function isNotWerkstudentDueToHoursWorked(output, paysPflegeversicherungSurcharge) {
	it('is not a Werkstudent because they work over 20 hours per week', () => {
		hasFlag(output, 'public-tariff-midijob')();
		hasFlag(output, 'public-not-werkstudent')();
		notHasFlag(output, 'public-tariff-student')();
		notHasFlag(output, 'public-tariff-employee')();
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

	describe('non-EU students getting their first insurance', () => {
		describe('a 22 year old unemployed non-EU student', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentUnemployed',
				monthlyIncome: 0,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: false,
			});

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isRecommended(output, ['free', 'public', 'expat', 'private']);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);
		});

		describe('a 22 year old non-EU student with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: false,
			});

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isRecommended(output, ['free', 'public', 'expat', 'private']);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);
		});

		describe('a 23 year old EU student with a minijob (and a child)', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);

			hasStudentTariff(output, false);
			doesNotHaveMinijobTariff(output);
			doesNotPayPflegeversicherungSurcharge(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'public', 'expat', 'private']);

			hasStudentTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseParentsInsurance(output);
			canUseSpouseInsurance(output);
		});

		describe('a 29 year old student with a minijob (and no children)', () => {
			const output = getHealthInsuranceOptions({
				age: 29,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'public', 'expat', 'private']);

			hasStudentTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output)
			cannotUseParentsInsurance(output);
		});

		describe('a 30 year old student with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 30,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'expat', 'private']);

			it('cannot get the student tariff', hasFlag(output, 'public-student-over-30'));

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public', 'expat', 'private']);  // Because Werkstudent

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public', 'expat', 'private']);  // Because Werkstudent

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);  // No longer Werkstudent, treated as an employee

			isNotWerkstudentDueToIncome(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe('a student with a 21 hr/week, €1500/month job', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: 1500,
				hoursWorkedPerWeek: 21,  // No longer Werkstudent, treated as an employee

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);

			isNotWerkstudentDueToHoursWorked(output, false);
			hasMidijobTarif(output);
			doesNotPayPflegeversicherungSurcharge(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorked: 20,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			isNotWerkstudentDueToIncome(output);

			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});
	});

	describe('EU students getting their first insurance', () => {
		describe('a 22 year old student with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);
			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);

			hasStudentTariff(output, false);
			doesNotHaveMinijobTariff(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
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

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);

			hasStudentTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseParentsInsurance(output);
			canUseSpouseInsurance(output);
		});

		describe('a 29 year old student with a minijob (and no children)', () => {
			const output = getHealthInsuranceOptions({
				age: 29,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);

			hasStudentTariff(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output)
			cannotUseParentsInsurance(output);
		});

		describe('a 30 year old student with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 30,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);

			it('cannot get the student tariff', hasFlag(output, 'public-student-over-30'));
			hasMinijobTariff(output, true);
			paysPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['public', 'private']);

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['public', 'private']);

			hasStudentTariff(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorkedPerWeek: 20,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['public']);  // No longer Werkstudent, treated as an employee

			isNotWerkstudentDueToIncome(output, false);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe('a student with a 21 hr/week, €1500/month job', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: 1500,
				hoursWorkedPerWeek: 21,  // No longer Werkstudent, treated as an employee

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['public']);

			hasMidijobTarif(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorked: 20,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['public']);
			isNotWerkstudentDueToIncome(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});
	});

	describe('unemployed people', () => {
		describe('an 18 year old unemployed EU immigrant', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);
			paysMinimumSelfPayAmount(output);
			doesNotPayPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isPaidBySocialBenefits(output);
			canUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);

		});
		describe('an 18 year old, unemployed, uninsured non-EU immigrant', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'expat', 'private']);
			cannotUseEHIC(output);
			isPaidBySocialBenefits(output);
		});
		describe('an 18 year old, unemployed, already insured non-EU immigrant', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,

				currentInsurance: 'public',
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'public', 'private']);
			cannotUseEHIC(output);
			isPaidBySocialBenefits(output);
		});

		describe('a 23 year old unemployed, already insured person', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,

				currentInsurance: 'public',
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'public', 'private']);
			paysMinimumSelfPayAmount(output, true);
			paysPflegeversicherungSurcharge(output);
			doesNotHaveMinijobTariff(output);

			isPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output)
			cannotUseParentsInsurance(output)
		});
	});

	describe('employees', () => {
		describe('an 18 year old EU employee with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['free', 'public', 'private']);
			hasMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output);
			canUseParentsInsurance(output);
		});

		describe('a 22 year old non-EU employee with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'public', 'expat', 'private']);
			hasMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			canUseSpouseInsurance(output)
			canUseParentsInsurance(output);
		});

		describe('a 23 year old employee with a minijob', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['free', 'public', 'expat', 'private']);
			hasMinijobTariff(output, true);
			paysPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasEmployeeTarif(output, false);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasMidijobTarif(output, false);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a 22 year old employee with a €${taxes.maxMinijobIncome + 1} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasMidijobTarif(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an employee with a €${taxes.maxMinijobIncome + 1} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasMidijobTarif(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an employee with a €${healthInsurance.maxMidijobIncome} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.maxMidijobIncome,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasMidijobTarif(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an employee with a €${healthInsurance.maxMidijobIncome + 1} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.maxMidijobIncome + 1,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasEmployeeTarif(output, false);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an employee with a €${Math.ceil(healthInsurance.maxMonthlyIncome + 100)} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: Math.ceil(healthInsurance.maxMonthlyIncome + 100),

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasEmployeeTarif(output, false);
			paysMaximumEmployeeAmount(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an employee with a €${healthInsurance.minFreiwilligMonthlyIncome} job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.minFreiwilligMonthlyIncome,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['private', 'public']);
			hasEmployeeTarif(output, false);
			paysMaximumEmployeeAmount(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an employee with a €200,000 job`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 200000/12,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['private', 'public']);
			hasEmployeeTarif(output, false);
			paysMaximumEmployeeAmount(output);
			doesNotPayPflegeversicherungSurcharge(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe('a 55 year old employee with public health insurance in another EU country', () => {
			const output = getHealthInsuranceOptions({
				age: 55,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 100000/12,

				currentInsurance: null,
				isEUCitizen: true,
			});

			isRecommended(output, ['public', 'private']);
		});
		describe('a 55 year old employee with public health insurance', () => {
			const output = getHealthInsuranceOptions({
				age: 55,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 100000/12,

				currentInsurance: 'public',
				isEUCitizen: false,
			});

			isRecommended(output, ['public', 'private']);
		});
		describe('a 55 year old employee with private health insurance', () => {
			const output = getHealthInsuranceOptions({
				age: 55,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 100000/12,

				currentInsurance: 'private',
				isEUCitizen: false,
			});

			isRecommended(output, ['private']);
		});
		describe('a 55 year old employee with expat health insurance', () => {
			const output = getHealthInsuranceOptions({
				age: 55,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 100000/12,

				currentInsurance: 'expat',
				isEUCitizen: false,
			});

			isRecommended(output, ['private']);
		});
	});

	describe('freelancers', () => {
		describe(`a 22 year old freelancer with a €${healthInsurance.maxFamilienversicherungIncome} income`, () => {
			const person = {
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: healthInsurance.maxFamilienversicherungIncome,

				currentInsurance: null,
				isEUCitizen: false,
			};

			describe('who is a EU citizen', () => {
				const output = getHealthInsuranceOptions({
					...person,
					currentInsurance: null,
					isEUCitizen: true,
				});
				isRecommended(output, ['free', 'public', 'private', 'other']);

				isNotPaidBySocialBenefits(output);
				doesNotHaveMinijobTariff(output);
				cannotUseEHIC(output);
				canJoinKSK(output);
				canUseSpouseInsurance(output);
				canUseParentsInsurance(output);
			});
			describe('who just moved from a non-EU country', () => {
				const output = getHealthInsuranceOptions({
					...person,
					currentInsurance: null,
					isEUCitizen: false,
				});
				isRecommended(output, ['free', 'expat', 'private', 'other']);
			});
			describe('who is already insured in Germany', () => {
				const output = getHealthInsuranceOptions({
					...person,
					currentInsurance: 'public',
					isEUCitizen: false,
				});
				isRecommended(output, ['free', 'public', 'private', 'other']);
			});
		});

		describe(`a 22 year old freelancer with a €${taxes.maxMinijobIncome} income`, () => {
			const person = {
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome,
			};

			describe('who is a EU citizen', () => {
				const output = getHealthInsuranceOptions({
					...person,
					currentInsurance: null,
					isEUCitizen: true,
				});

				isRecommended(output, ['public', 'private', 'other']);

				isNotPaidBySocialBenefits(output);
				doesNotHaveMinijobTariff(output);
				cannotUseEHIC(output);
				canJoinKSK(output);
				cannotUseSpouseInsurance(output);
				cannotUseParentsInsurance(output);
			});
			describe('who just moved from a non-EU country', () => {
				const output = getHealthInsuranceOptions({
					...person,
					currentInsurance: null,
					isEUCitizen: false,
				});
				isRecommended(output, ['expat', 'private', 'other']);
			});
			describe('who is already insured in Germany', () => {
				const output = getHealthInsuranceOptions({
					...person,
					currentInsurance: 'public',
					isEUCitizen: false,
				});
				isRecommended(output, ['public', 'private', 'other']);
			});
		});

		describe('a 23 year old non-EU freelancer with a €1000 income and public insurance', () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: 1000,

				currentInsurance: 'public',
				isEUCitizen: false,
			});

			paysMinimumSelfEmployedAmount(output, true);
			isRecommended(output, ['public', 'private', 'other']);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			canJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`a 23 year old non-EU freelancer with a €${Math.ceil(healthInsurance.maxMonthlyIncome + 100)} income and public insurance`, () => {
			const output = getHealthInsuranceOptions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: Math.ceil(healthInsurance.maxMonthlyIncome + 100),

				currentInsurance: 'public',
				isEUCitizen: false,
			});

			paysMaximumSelfEmployedAmount(output, true);
			isRecommended(output, ['private', 'public', 'other']);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			canJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasAzubiFreeTariff(output);
			doesNotHaveMinijobTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an Azubi with a €${taxes.maxMinijobIncome + 1} income`, () => {
			const output = getHealthInsuranceOptions({
				age: 32,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome + 1,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasAzubiTariff(output);

			isNotPaidBySocialBenefits(output);
			cannotUseEHIC(output);
			cannotJoinKSK(output);
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['public']);
			hasAzubiTariff(output);
			paysMaximumEmployeeAmount(output);

			isNotPaidBySocialBenefits(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
		});

		describe(`an Azubi with a €${ healthInsurance.minFreiwilligMonthlyIncome } income`, () => {
			const output = getHealthInsuranceOptions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: healthInsurance.minFreiwilligMonthlyIncome,

				currentInsurance: null,
				isEUCitizen: false,
			});

			isRecommended(output, ['private', 'public']);
			hasAzubiTariff(output);
			paysMaximumEmployeeAmount(output);

			isNotPaidBySocialBenefits(output);
			cannotJoinKSK(output);
			cannotUseSpouseInsurance(output);
			cannotUseParentsInsurance(output);
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

				currentInsurance: null,
				isEUCitizen: false,
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

				currentInsurance: null,
				isEUCitizen: false,
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

				currentInsurance: null,
				isEUCitizen: false,
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

				currentInsurance: null,
				isEUCitizen: false,
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

				currentInsurance: null,
				isEUCitizen: false,
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

				currentInsurance: null,
				isEUCitizen: false,
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

				currentInsurance: null,
				isEUCitizen: false,
			});

			it('gets a 1% Pflegeversicherung discount', () => {
				equal(output.public.options[0].pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 1/100);
			});
		});
	});
});
