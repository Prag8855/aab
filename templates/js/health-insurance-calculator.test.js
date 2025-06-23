import { hasFlag, notHasFlag } from './test-utils.js';

const round = roundCurrency;
const equal = assert.equal;


function hasMinijobTariff(output){
	it('must pay the minimum rate (minijob)', () => {
		hasFlag(output, 'minijob')();
		hasMinimumSelfPayTariff(output);
	});
}

function hasMinijobTariffWithExtraPflegeversicherung(output){
	it('must pay the minimum rate (minijob)', () => {
		hasFlag(output, 'minijob')();
		hasMinimumSelfPayTariffWithExtraPflegeversicherung(output);
	});
}

function hasFreeInsuranceForLowPaidTrainees(output){
	it('must pay the trainee tariff', () => { equal(output.tariff, 'azubi-free') });
	it('must pay nothing because of their low income', () => {
		hasFlag(output, 'azubi-free');
		equal(output.options.tk.total.personalContribution, 0);
	});
	it('does not pay the minijob tariff', notHasFlag(output, 'minijob'));
}

function hasStudentTariff(output) {
	it('must pay the student tariff (if they have no kids)', () => {
		equal(output.tariff, 'student');
		equal(
			output.baseContribution.totalContribution,
			round(healthInsurance.studentRate * bafogBedarfssatz));
		equal(
			output.options.tk.zusatzbeitrag.totalContribution,
			round(healthInsurance.companies.tk.zusatzbeitrag * bafogBedarfssatz));
		equal(
			output.pflegeversicherung.totalContribution,
			round(pflegeversicherung.defaultRate * bafogBedarfssatz));
		equal(output.options.tk.total.employerContribution, 0);
		notHasFlag(output, 'student-30plus')();
	});
	it('can get private health insurance', hasFlag(output, 'private'));
}
function hasStudentTariffWithExtraPflegeversicherung(output) {
	it('must pay the student tariff with a Pflegeversicherung surcharge (if they have no kids)', () => {
		equal(output.tariff, 'student');
		equal(
			output.baseContribution.totalContribution,
			round(healthInsurance.studentRate * bafogBedarfssatz));
		equal(
			output.options.tk.zusatzbeitrag.totalContribution,
			round(healthInsurance.companies.tk.zusatzbeitrag * bafogBedarfssatz));
		equal(
			output.pflegeversicherung.totalContribution,
			round(pflegeversicherung.surchargeRate * bafogBedarfssatz));
		equal(output.options.tk.total.employerContribution, 0);
		notHasFlag(output, 'student-30plus')();
	});
}

function hasMinimumSelfEmployedTariff(output) {
	equal(output.tariff, 'selfEmployed');
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.minMonthlyIncome * pflegeversicherung.defaultRate));
	equal(output.options.tk.total.employerContribution, 0);
	hasFlag(output, 'min-contribution')();
}
function hasMinimumSelfEmployedTariffWithExtraPflegeversicherung(output) {
	equal(output.tariff, 'selfEmployed');
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.minMonthlyIncome * pflegeversicherung.surchargeRate));
	equal(output.options.tk.total.employerContribution, 0);
	hasFlag(output, 'min-contribution')();
}

function hasMaximumSelfEmployedTariff(output) {
	equal(output.tariff, 'selfEmployed');
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.maxMonthlyIncome * healthInsurance.selfPayRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.maxMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.maxMonthlyIncome * pflegeversicherung.defaultRate));
	equal(output.options.tk.total.employerContribution, 0);
	hasFlag(output, 'max-contribution')();
}
function hasMaximumSelfEmployedTariffWithExtraPflegeversicherung(output) {
	equal(output.tariff, 'selfEmployed');
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.maxMonthlyIncome * healthInsurance.selfPayRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.maxMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.maxMonthlyIncome * pflegeversicherung.surchargeRate));
	equal(output.options.tk.total.employerContribution, 0);
	hasFlag(output, 'max-contribution')();
}

function hasMinimumSelfPayTariff(output) {
	equal(output.tariff, 'selfPay');
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.minMonthlyIncome * pflegeversicherung.defaultRate));
	equal(output.options.tk.total.employerContribution, 0);
	hasFlag(output, 'min-contribution')();
}
function hasMinimumSelfPayTariffWithExtraPflegeversicherung(output) {
	equal(output.tariff, 'selfPay');
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.selfPayRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.minMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.minMonthlyIncome * pflegeversicherung.surchargeRate));
	equal(output.options.tk.total.employerContribution, 0);
	hasFlag(output, 'min-contribution')();
}

function hasStandardTariffHighIncomeStudent(output) {
	const income = Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1);


	equal(
		output.baseContribution.totalContribution,
		round(income * healthInsurance.defaultRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(income * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(income * pflegeversicherung.defaultRate));
	equal(
		output.options.tk.total.employerContribution,
		round(income * healthInsurance.defaultRate / 2)
			+ round(income * healthInsurance.companies.tk.zusatzbeitrag / 2)
			+ round(income * pflegeversicherung.employerRate)
	);
}
function hasMaxTariff(output) {
	equal(
		output.baseContribution.totalContribution,
		round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate));
	equal(
		output.options.tk.zusatzbeitrag.totalContribution,
		round(healthInsurance.maxMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag));
	equal(
		output.pflegeversicherung.totalContribution,
		round(healthInsurance.maxMonthlyIncome * pflegeversicherung.defaultRate));
	equal(
		output.options.tk.total.employerContribution,
		round(
			round(healthInsurance.maxMonthlyIncome * healthInsurance.defaultRate / 2)
			+ round(healthInsurance.maxMonthlyIncome * healthInsurance.companies.tk.zusatzbeitrag / 2)
			+ round(healthInsurance.maxMonthlyIncome * pflegeversicherung.employerRate)
		));
	hasFlag(output, 'max-contribution')();
}

describe('calculateHealthInsuranceContributions', () => {
	describe('married people with a low income', () => {
		const output = calculateHealthInsuranceContributions({
			age: 40,
			childrenCount: 0,
			isMarried: true,
			occupation: 'unemployed',
			monthlyIncome: healthInsurance.maxFamilienversicherungIncome,
		});
		it('can use their spouse\'s insurance', hasFlag(output, 'familienversicherung-spouse'));
	});

	describe('unmarried people with a low income', () => {
		const output = calculateHealthInsuranceContributions({
			age: 40,
			childrenCount: 0,
			isMarried: false,
			occupation: 'unemployed',
			monthlyIncome: taxes.maxMinijobIncome,
		});
		it('can\'t use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
	});

	describe('students', () => {
		describe('a 22 year old student with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasStudentTariff(outputWithKids);

			it('does not pay the minijob tariff', notHasFlag(outputWithKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputWithKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputWithKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputWithKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
		});

		describe('a 23 year old student with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasStudentTariff(outputWithKids);
			hasStudentTariffWithExtraPflegeversicherung(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('pays more for Pflegeversicherung if he has no kids', hasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('a 25 year old student with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 25,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 25,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasStudentTariff(outputWithKids);
			hasStudentTariffWithExtraPflegeversicherung(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('pays more for Pflegeversicherung if he has no kids', hasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('a 29 year old student with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 29,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 29,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasStudentTariff(outputWithKids);
			hasStudentTariffWithExtraPflegeversicherung(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('pays more for Pflegeversicherung if he has no kids', hasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('a 30 year old student with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 30,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 30,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasMinijobTariff(outputWithKids);
			hasMinijobTariffWithExtraPflegeversicherung(outputNoKids);

			it('can\'t get the student tariff', hasFlag(outputNoKids, 'student-30plus'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('pays more for Pflegeversicherung if he has no kids', hasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe(`a 22 year old student with a ${taxes.maxMinijobIncome + 1}€ job`, () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			hasStudentTariff(outputWithKids);
			hasStudentTariff(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('does not pay more for Pflegeversicherung if he has no kids', notHasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe(`a 22 year old student with a ${taxes.maxMinijobIncome + 1}€ job`, () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			hasStudentTariff(outputWithKids);
			hasStudentTariff(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('does not pay more for Pflegeversicherung if he has no kids', notHasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('a student with a 20 hr/week, 1500€/month job', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: 1500,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: 1500,
			});

			notHasFlag(outputNoKids, 'not-werkstudent')();
			hasStudentTariff(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('does not pay more for Pflegeversicherung if he has no kids', notHasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe(`a student with a 20 hr/week, ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€/month job`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
				hoursWorked: 20
			});

			it('must pay the employee rate due to their high income', () => {
				hasStandardTariffHighIncomeStudent(output);
				equal(output.tariff, 'employee');
				hasFlag(output, 'not-werkstudent')();
			});

			it('can\'t get the student tariff due to their high income', hasFlag(output, 'not-werkstudent'));
			it('can\'t get private health insurance', notHasFlag(output, 'private'));
			it('can\'t use their EHIC card', notHasFlag(output, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(output, 'familienversicherung-parents'));
		});

		describe(`a student with a 21 hr/week, 1500€/month job`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'studentEmployee',
				monthlyIncome: 1500,
				hoursWorked: 21
			});

			it('must pay the midijob tariff instead of the student tariff', () => {
				equal(output.tariff, 'midijob');
			});

			it('can\'t get the student tariff', hasFlag(output, 'not-werkstudent'));
			it('can\'t get private health insurance', notHasFlag(output, 'private'));
			it('can\'t use their EHIC card', notHasFlag(output, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(output, 'familienversicherung-parents'));
		});

		// TODO: Students with freelance income
	});

	describe('unemployed people', () => {
		describe('a 17 year old unemployed person', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 17,
				childrenCount: 1,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 17,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});

			it('must pay the minimum rate', () => {
				hasMinimumSelfPayTariff(outputWithKids);
				hasMinimumSelfPayTariff(outputNoKids);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can use their EHIC card', hasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('does not pay more for Pflegeversicherung if he has no kids', notHasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('an 18 year old unemployed person', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 18,
				childrenCount: 1,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 18,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});

			it('must pay the minimum rate', () => {
				hasMinimumSelfPayTariff(outputWithKids);
				hasMinimumSelfPayTariff(outputNoKids);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can use their EHIC card', hasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('does not pay more for Pflegeversicherung if he has no kids', notHasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('a 22 year old unemployed person', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});

			it('must pay the minimum rate', () => {
				hasMinimumSelfPayTariff(outputWithKids);
				hasMinimumSelfPayTariff(outputNoKids);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can use their EHIC card', hasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('does not pay more for Pflegeversicherung if he has no kids', notHasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe('a 23 year old unemployed person', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'unemployed',
				monthlyIncome: 0,
			});

			it('must pay the minimum rate', () => {
				hasMinimumSelfPayTariff(outputWithKids);
				hasMinimumSelfPayTariffWithExtraPflegeversicherung(outputNoKids);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can use their EHIC card', hasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('pays more for Pflegeversicherung if he has no kids', hasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});
	});

	describe('employees', () => {
		describe('a 17 year old employee with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 17,
				childrenCount: 1,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 17,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			hasMinijobTariff(outputWithKids);
			hasMinijobTariff(outputNoKids);

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe('a 22 year old employee with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must pay the minijob tariff', () => {
				hasFlag(outputWithKids, 'minijob')();
				hasFlag(outputNoKids, 'minijob')();
				hasMinimumSelfPayTariff(outputWithKids);
				hasMinimumSelfPayTariff(outputNoKids);
			});

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe('a 23 year old employee with a minijob', () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must pay the minijob tariff', () => {
				hasFlag(outputWithKids, 'minijob')();
				hasFlag(outputNoKids, 'minijob')();
				hasMinimumSelfPayTariff(outputWithKids);
				hasMinimumSelfPayTariffWithExtraPflegeversicherung(outputNoKids);
			});

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('does not pay more for Pflegeversicherung if he has kids', notHasFlag(outputWithKids, 'pflegeversicherung-surcharge'));
			it('pays more for Pflegeversicherung if he has no kids', hasFlag(outputNoKids, 'pflegeversicherung-surcharge'));
		});

		describe(`a 17 year old employee with a ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€ job`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 17,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
			});

			it('must pay the employee rate', () => {
				hasStandardTariffHighIncomeStudent(output);
				equal(output.tariff, 'employee');
			});

			it('does not pay the minijob tariff', notHasFlag(output, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(output, 'private'));
			it('can\'t use their EHIC card', notHasFlag(output, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(output, 'familienversicherung-parents'));
		});

		describe(`an 18 year old employee with a ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€ job`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 19,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
			});

			it('must pay the employee rate', () => {
				hasStandardTariffHighIncomeStudent(output);
				equal(output.tariff, 'employee');
			});

			it('does not pay the minijob tariff', notHasFlag(output, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(output, 'private'));
			it('can\'t use their EHIC card', notHasFlag(output, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(output, 'familienversicherung-parents'));
		});

		describe(`a 23 year old employee with a ${taxes.maxMinijobIncome + 1}€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			it('must pay the midijob tariff', () => {
				equal(outputWithKids.tariff, 'midijob');
				equal(outputWithKids.baseContribution.totalContribution, 54.41);
				equal(outputWithKids.options.tk.zusatzbeitrag.totalContribution, 9.13);
				equal(outputWithKids.pflegeversicherung.totalContribution, 13.42);
				equal(outputNoKids.tariff, 'midijob');
				equal(outputNoKids.baseContribution.totalContribution, 54.41);
				equal(outputNoKids.options.tk.zusatzbeitrag.totalContribution, 9.13);
				equal(outputNoKids.pflegeversicherung.totalContribution, 15.65);
			});

			it('must pay a smaller share than the employer', () => {
				equal(outputWithKids.options.tk.total.employerContribution, 76.82);
				equal(outputNoKids.options.tk.total.employerContribution, 76.8);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe(`a 22 year old employee with a ${taxes.maxMinijobIncome + 1}€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			it('must pay the midijob tariff', () => {
				equal(outputNoKids.tariff, 'midijob');
				equal(outputNoKids.baseContribution.totalContribution, 54.41);
				equal(outputNoKids.options.tk.zusatzbeitrag.totalContribution, 9.13);
				equal(outputNoKids.pflegeversicherung.totalContribution, 13.42);
			});

			it('must pay a smaller share than the employer', () => {
				equal(outputNoKids.options.tk.total.employerContribution, 76.82);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe(`an employee with a ${taxes.maxMinijobIncome + 1}€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			it('must pay the midijob tariff', () => {
				equal(outputNoKids.tariff, 'midijob');
				equal(outputNoKids.baseContribution.totalContribution, 54.41);
				equal(outputNoKids.options.tk.zusatzbeitrag.totalContribution, 9.13);
				equal(outputNoKids.pflegeversicherung.totalContribution, 13.42);
			});

			it('must pay a smaller share than the employer', () => {
				equal(outputNoKids.options.tk.total.employerContribution, 76.82);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe(`an employee with a ${healthInsurance.maxMidijobIncome}€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.maxMidijobIncome,
			});

			it('must pay the midijob tariff', () => {
				equal(outputNoKids.tariff, 'midijob');
				equal(outputNoKids.baseContribution.totalContribution, 292);
				equal(outputNoKids.options.tk.zusatzbeitrag.totalContribution, 49);
				equal(outputNoKids.pflegeversicherung.totalContribution, 72);
			});

			it('must pay a smaller share than the employer', () => {
				equal(outputNoKids.options.tk.total.employerContribution, (292 + 49 + 72) / 2);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe(`an employee with a ${healthInsurance.maxMidijobIncome + 1}€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.maxMidijobIncome + 1,
			});

			it('must pay the employee tariff', () => {
				equal(outputNoKids.tariff, 'employee');
			});

			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
		});

		describe('an employee with a 6000€ job', () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: 6000,
			});

			it('must pay the maximum employee tariff', () => {
				hasMaxTariff(outputNoKids);
				equal(outputNoKids.tariff, 'employee');
			});

			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
		});

		describe(`an employee with a ${healthInsurance.minFreiwilligMonthlyIncome}€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'employee',
				monthlyIncome: healthInsurance.minFreiwilligMonthlyIncome,
			});

			it('must pay the maximum employee tariff', () => {
				hasMaxTariff(outputNoKids);
				equal(outputNoKids.tariff, 'employee');
			});

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
		});

		describe(`an employee with a 200,000€ job`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: false,
				occupation: 'employee',
				monthlyIncome: 200000/12,
			});

			it('must pay the maximum employee tariff', () => {
				hasMaxTariff(outputNoKids);
				equal(outputNoKids.tariff, 'employee');
			});

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
		});
	});

	describe('freelancers', () => {
		describe(`a 22 year old freelancer with a ${taxes.maxMinijobIncome}€ income`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: healthInsurance.azubiFreibetrag,
			});
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: healthInsurance.azubiFreibetrag,
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can use their spouse\'s insurance', hasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can use their parents\' insurance', hasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe(`a 22 year old freelancer with a ${taxes.maxMinijobIncome + 1}€ income`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			it('must pay the minimum self-employed tariff', () => {
				hasMinimumSelfEmployedTariff(output);
			});

			it('does not pay the minijob tariff', notHasFlag(output, 'minijob'));
			it('can get private health insurance', hasFlag(output, 'private'));
			it('can\'t use their EHIC card', notHasFlag(output, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(output, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(output, 'familienversicherung-parents'));
		});

		describe(`a 23 year old freelancer with a ${taxes.maxMinijobIncome + 1}€ income`, () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			it('must pay the minimum self-employed tariff', () => {
				hasMinimumSelfEmployedTariff(outputWithKids);
				hasMinimumSelfEmployedTariffWithExtraPflegeversicherung(outputNoKids);
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe('a 23 year old freelancer with a 1000€ income', () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: 1000,
			});
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: 1000,
			});

			it('must pay the minimum self-employed tariff', () => {
				hasMinimumSelfEmployedTariff(outputWithKids);
				hasMinimumSelfEmployedTariffWithExtraPflegeversicherung(outputNoKids);
			});

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe('a 23 year old freelancer with a 6000€ job', () => {
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: 6000,
			});
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'selfEmployed',
				monthlyIncome: 6000,
			});

			it('must pay the maximum self-employed tariff', () => {
				hasMaximumSelfEmployedTariff(outputWithKids);
				hasMaximumSelfEmployedTariffWithExtraPflegeversicherung(outputNoKids);
			});

			it('can get private health insurance', hasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});
	});

	describe('azubis', () => {
		describe(`an Azubi with a ${healthInsurance.azubiFreibetrag}€ income`, () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 1,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: healthInsurance.azubiFreibetrag,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 23,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: healthInsurance.azubiFreibetrag,
			});

			hasFreeInsuranceForLowPaidTrainees(outputWithKids);
			hasFreeInsuranceForLowPaidTrainees(outputNoKids);

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
		});

		describe(`an Azubi with a ${taxes.maxMinijobIncome}€ income`, () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 1,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must pay the standard percentage of their income', () => {
				equal(outputNoKids.tariff, 'azubi');
				equal(
					outputNoKids.baseContribution.totalContribution,
					round(taxes.maxMinijobIncome * healthInsurance.defaultRate));
				equal(
					outputNoKids.options.tk.zusatzbeitrag.totalContribution,
					round(taxes.maxMinijobIncome * healthInsurance.companies.tk.zusatzbeitrag));
				equal(
					outputNoKids.pflegeversicherung.totalContribution,
					round(taxes.maxMinijobIncome * pflegeversicherung.surchargeRate));
				equal(outputNoKids.options.tk.total.employerContribution, 57.41);
				notHasFlag(outputNoKids, 'azubi-free')();

				equal(outputWithKids.tariff, 'azubi');
				equal(
					outputWithKids.baseContribution.totalContribution,
					round(taxes.maxMinijobIncome * healthInsurance.defaultRate));
				equal(
					outputWithKids.options.tk.zusatzbeitrag.totalContribution,
					round(taxes.maxMinijobIncome * healthInsurance.companies.tk.zusatzbeitrag));
				equal(
					outputWithKids.pflegeversicherung.totalContribution,
					round(taxes.maxMinijobIncome * pflegeversicherung.defaultRate));
				equal(outputWithKids.options.tk.total.employerContribution, 57.41);
				notHasFlag(outputWithKids, 'azubi-free')();
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('can\'t pay the Midijob tariff', notHasFlag(outputNoKids, 'midijob'));
		});

		describe(`an Azubi with a ${taxes.maxMinijobIncome + 1}€ income`, () => {
			const outputWithKids = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 1,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});
			const outputNoKids = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome + 1,
			});

			it('must pay the standard percentage of their income, not the midijob tariff', () => {
				equal(outputNoKids.tariff, 'azubi');
				equal(
					outputNoKids.baseContribution.totalContribution,
					round((taxes.maxMinijobIncome + 1) * healthInsurance.defaultRate));
				equal(
					outputNoKids.options.tk.zusatzbeitrag.totalContribution,
					round((taxes.maxMinijobIncome + 1) * healthInsurance.companies.tk.zusatzbeitrag));
				equal(
					outputNoKids.pflegeversicherung.totalContribution,
					round((taxes.maxMinijobIncome + 1) * pflegeversicherung.surchargeRate));
				equal(outputNoKids.options.tk.total.employerContribution, 57.51);
				notHasFlag(outputNoKids, 'azubi-free')();

				equal(outputWithKids.tariff, 'azubi');
				equal(
					outputWithKids.baseContribution.totalContribution,
					round((taxes.maxMinijobIncome + 1) * healthInsurance.defaultRate));
				equal(
					outputWithKids.options.tk.zusatzbeitrag.totalContribution,
					round((taxes.maxMinijobIncome + 1) * healthInsurance.companies.tk.zusatzbeitrag));
				equal(
					outputWithKids.pflegeversicherung.totalContribution,
					round((taxes.maxMinijobIncome + 1) * pflegeversicherung.defaultRate));
				equal(outputWithKids.options.tk.total.employerContribution, 57.51);
				notHasFlag(outputWithKids, 'azubi-free')();
			});

			it('does not pay the minijob tariff', notHasFlag(outputNoKids, 'minijob'));
			it('can\'t get private health insurance', notHasFlag(outputNoKids, 'private'));
			it('can\'t use their EHIC card', notHasFlag(outputNoKids, 'ehic'));
			it('can\'t use their spouse\'s insurance', notHasFlag(outputNoKids, 'familienversicherung-spouse'));
			it('can\'t use their parents\' insurance', notHasFlag(outputNoKids, 'familienversicherung-parents'));
			it('can\'t pay the Midijob tariff', notHasFlag(outputNoKids, 'midijob'));
		});

		describe(`an Azubi with a ${Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1)}€ income`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: Math.ceil(0.75 * healthInsurance.maxNebenjobIncome + 1),
			});

			it('must pay the standard percentage of their income', () => {
				hasStandardTariffHighIncomeStudent(output);
				equal(output.tariff, 'azubi');
			});
			it('can\'t get private health insurance', notHasFlag(output, 'private'));
		});

		describe('an Azubi with a 6000€ income', () => {
			const output = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: 6000,
			});

			it('must pay the maximum employee tariff', () => {
				hasMaxTariff(output);
				equal(output.tariff, 'azubi');
			});

			it('can\'t get private health insurance', notHasFlag(output, 'private'));
		});

		describe(`an Azubi with a ${ healthInsurance.minFreiwilligMonthlyIncome }€ income`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 22,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: healthInsurance.minFreiwilligMonthlyIncome,
			});

			it('must pay the maximum employee tariff', () => {
				hasMaxTariff(output);
				equal(output.tariff, 'azubi');
			});

			it('can get private health insurance', hasFlag(output, 'private'));
		});
	});

	describe('parents', () => {
		describe(`a person with no children`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 0,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('pays extra for Pflegeversicherung', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.surchargeRate);
			});
		});
		describe(`a parent with 1 child`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 1,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('gets no Pflegeversicherung discount', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.defaultRate);
			});
		});
		describe(`a parent with 2 children`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 2,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must get a 0.25% Pflegeversicherung discount', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 0.25/100);
			});
		});
		describe(`a parent with 3 children`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 3,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must get a 0.5% Pflegeversicherung discount', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 0.5/100);
			});
		});
		describe(`a parent with 4 children`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 4,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must get a 0.75% Pflegeversicherung discount', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 0.75/100);
			});
		});
		describe(`a parent with 5 children`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 5,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must get a 1% Pflegeversicherung discount', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 1/100);
			});
		});
		describe(`a parent with 6 children`, () => {
			const output = calculateHealthInsuranceContributions({
				age: 32,
				childrenCount: 6,
				isMarried: true,
				occupation: 'azubi',
				monthlyIncome: taxes.maxMinijobIncome,
			});

			it('must get a 1% Pflegeversicherung discount', () => {
				equal(output.pflegeversicherung.totalRate, pflegeversicherung.defaultRate - 1/100);
			});
		});
	});
});
