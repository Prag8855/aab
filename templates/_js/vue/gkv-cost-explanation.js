{% include "_js/constants.js" %}
{% include "_js/currency.js" %}
{% include '_js/health-insurance-calculator.js' %}
{% include '_js/utils.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/eur.js' %}
{% include '_js/vue/glossary.js' %}
{% js %}{% raw %}
Vue.component('gkv-cost-explanation', {
	props: {
		age: Number,
		childrenCount: Number,
		isMarried: Boolean,
		monthlyIncome: Number,
		occupation: String,
		worksOver20HoursPerWeek: Boolean,
	},
	data(){
		return {
			formatPercent,
		}
	},
	computed: {
		result() {
			return calculateHealthInsuranceContributions({
				age: this.age,
				occupation: this.occupation,
				isMarried: this.isMarried,
				childrenCount: this.childrenCount,
				hoursWorked: this.hoursWorked,
				monthlyIncome: this.monthlyIncome,
			});
		},
		tariffName() {
			return {
				employee: 'employee',
				midijob: 'midijob',
				selfEmployed: 'self-employed',
				selfPay: this.flag('minijob') ? 'minijob' : 'self-pay',
				student: 'student',
				azubi: 'apprentice',
			}[this.result.tariff];
		},
		baseContributionRate() {
			return this.formatPercent(this.result.baseContribution.totalRate * 100);
		},
		minPublicPrice() {
			return this.result.options.cheapest.total;
		},
		maxPublicPrice() {
			return this.result.options.mostExpensive.total;
		},
	},
	methods: {
		flag(flagName){
			return this.result.flags.has(flagName);
		},
		eur(num) {
			return formatCurrency(num, false, '€', false);
		},
	},
	template: `
		<details class="cost-explanation">
			<summary>Cost explanation</summary>
			<p>
				You pay the <strong>{{ tariffName }} tariff</strong>.
				<template v-if="result.tariff === 'employee'">
					Your health insurance costs a percentage of your income. Your employer pays half of it.
				</template>
				<template v-if="result.tariff === 'selfEmployed' || (result.tariff === 'azubi' && !flag('azubi-free'))">
					Your health insurance costs a percentage of your income.
				</template>
				<template v-if="result.tariff === 'student'">
					Your health insurance has a fixed price.
				</template>
				<template v-if="result.tariff === 'selfPay'">
					<template v-if="flag('minijob')">
						You pay the <glossary term="Mindestbeitrag">minimum price</glossary>.
					</template>
					<template v-else>
						Your health insurance costs a percentage of your income.
					</template>
				</template>
				<template v-if="result.tariff === 'midijob'">
					It's a cheaper tariff for low-income jobs.
				</template>
				<template v-if="result.tariff === 'azubi' && flag('azubi-free')">
					You make less than <eur :amount="healthInsurance.azubiFreibetrag"></eur> per month, so you don't pay for health insurance. Your employer pays for it.
				</template>

				<template v-if="flag('student-30plus')">
					You can't get the student tariff because you are over 30 years old.
				</template>
				<template v-else-if="flag('not-werkstudent') && worksOver20HoursPerWeek">
					You can't get the student tariff because you work more than 20 hours per week.
				</template>
				<template v-else-if="flag('not-werkstudent') && !worksOver20HoursPerWeek">
					You can't get the student tariff because your income is too high.
				</template>
			</p>
			<hr>
			<details>
				<summary class="price">
					Base cost
					<output>
						<eur :amount="result.baseContribution.totalContribution"></eur><small class="no-mobile">/month</small>
					</output>
				</summary>
				<p>
					<template v-if="flag('minijob')">
						You have a minijob, so you pay the <glossary term="Mindestbeitrag">minimum price</glossary>. It's {{ baseContributionRate }} of <eur :amount="healthInsurance.minMonthlyIncome"></eur> }}.
					</template>
					<template v-else-if="flag('min-contribution')">
						You make less than <eur :amount="healthInsurance.minMonthlyIncome"></eur> per month, so you pay the <glossary term="Mindestbeitrag">minimum price</glossary>. It's {{ baseContributionRate }} of <eur :amount="healthInsurance.minMonthlyIncome"></eur>.
					</template>
					<template v-else-if="flag('max-contribution')">
						You make more than <eur :amount="healthInsurance.maxMonthlyIncome"></eur> per month, so you pay the <glossary term="Höchstbeitrag">maximum price</glossary>. It's {{ baseContributionRate }} of <eur :amount="healthInsurance.maxMonthlyIncome"></eur>.
					</template>
					<template v-else-if="flag('midijob')">
						You make less than <eur :amount="healthInsurance.maxMidijobIncome"></eur> per month, so you pay the midijob tariff. It's cheaper than the normal tariff.
					</template>
					<template v-else-if="result.tariff === 'student'">
						You pay the student tariff; the base cost is a fixed price.
					</template>
					<template v-else>
						You pay {{ baseContributionRate }} of your income.
					</template>
					This cost is the same for all insurers.
				</p>
			</details>
			<details>
				<summary class="price">
					Insurer surcharge
					<output
						v-if="eur(result.options.cheapest.zusatzbeitrag.totalContribution) === eur(result.options.mostExpensive.zusatzbeitrag.totalContribution)">
						<eur :amount="result.options.mostExpensive.zusatzbeitrag.totalContribution"></eur>
					</output>
					<output v-else>
						<eur :amount="result.options.cheapest.zusatzbeitrag.totalContribution"></eur>
						&nbsp;to&nbsp;
						<eur :amount="result.options.mostExpensive.zusatzbeitrag.totalContribution"></eur><small class="no-mobile">/month</small>
					</output>
				</summary>
				<p>
					Insurers can charge more for better services. Each insurer has a different surcharge. The average surcharge is {{ formatPercent(healthInsurance.avgZusatzbeitrag * 100) }} of your income.
				</p>
			</details>
			<details>
				<summary class="price">
					Long-term care insurance
					<output>
						<eur :amount="result.pflegeversicherung.totalContribution"></eur><small class="no-mobile">/month</small>
					</output>
				</summary>
				<p>
					<template v-if="flag('max-contribution')">
						You pay the <glossary term="Höchstbeitrag">maximum price</glossary>, because you make more than <eur :amount="healthInsurance.maxMonthlyIncome"></eur> per month.
					</template>
					<template v-else>
						You pay {{ formatPercent(result.pflegeversicherung.totalRate * 100) }} of your income.
						<template v-if="age > pflegeversicherung.defaultRateMaxAge && childrenCount === 0">
							You pay more because you are over {{ pflegeversicherung.defaultRateMaxAge }} years old and you don't have children.
						</template>
						<template v-else-if="age <= pflegeversicherung.defaultRateMaxAge">
							You pay less because you are under {{ pflegeversicherung.defaultRateMaxAge + 1 }} years old.
						</template>
						<template v-else>
							You pay less because you have children.
						</template>
					</template>
					The cost is the same for all insurers.
				</p>
			</details>
			<details>
				<summary class="price">
					Your employer pays
					<output v-if="maxPublicPrice.employerContribution === 0">
						<eur :amount="0"></eur>
					</output>
					<template v-else>
						<output v-if="eur(minPublicPrice.employerContribution) === eur(maxPublicPrice.employerContribution)">
							<eur :amount="maxPublicPrice.employerContribution"></eur><small class="no-mobile">/month</small>
						</output>
						<output v-else>
							<eur :amount="minPublicPrice.employerContribution"></eur>
							&nbsp;to&nbsp;
							<eur :amount="maxPublicPrice.employerContribution"></eur><small class="no-mobile">/month</small>
						</output>
					</template>
				</summary>
				<p v-if="result.tariff === 'selfEmployed'">
					You are self-employed, so you don't get help from an employer.
				</p>
				<p v-if="flag('azubi-free')">
					When you make less than <eur :amount="healthInsurance.azubiFreibetrag"></eur> per month, your employer pays for your health insurance.
				</p>
				<p v-if="result.tariff === 'selfPay' && !flag('minijob')">
					You are unemployed, so you don't get help from an employer.
				</p>
				<p v-if="flag('minijob')">
					When you have a <glossary term="Minijob">minijob</glossary>, your employer does not pay for your health insurance.
				</p>
				<p v-if="result.tariff === 'employee'">
					Your employer pays half of your health insurance.
				</p>
				<p v-if="result.tariff === 'midijob'">
					Your employer pays part of your health insurance.
				</p>
			</details>
			<details>
				<summary class="price highlighted">
					You pay
					<output v-if="maxPublicPrice.personalContribution === 0">
						<eur :amount="0"></eur>
					</output>
					<output v-if="eur(minPublicPrice.personalContribution) === eur(maxPublicPrice.personalContribution) && maxPublicPrice.personalContribution > 0">
						<eur :amount="maxPublicPrice.personalContribution"></eur>
					</output>
					<output v-if="eur(minPublicPrice.personalContribution) != eur(maxPublicPrice.personalContribution) && maxPublicPrice.personalContribution > 0">
						<eur :amount="minPublicPrice.personalContribution"></eur>
						&nbsp;to&nbsp;
						<eur :amount="maxPublicPrice.personalContribution"></eur>
					</output>
					<small class="no-mobile">/month</small>
				</summary>
				<p>
					This is what you pay for public health insurance.
					<template v-if="flag('max-contribution')">
						You make more than <eur :amount="healthInsurance.maxMonthlyIncome"></eur> per month, so you pay the <glossary term="Höchstbeitrag">maximum price</glossary>.
					</template>
					<template v-else-if="flag('min-contribution')">
						You pay the <glossary term="Mindestbeitrag">minimum price</glossary>, because you make less than <eur :amount="healthInsurance.minMonthlyIncome"></eur> per month.
					</template>
					<template v-else-if="flag('azubi-free')">
						You pay nothing, because you make less than <eur :amount="healthInsurance.azubiFreibetrag"></eur> per month. Your employer pays for your insurance.
					</template>
					This is a <glossary term="steuerlich absetzbar">tax-deductible</glossary> expense.
				</p>
			</details>
		</details>
	`,
});
{% endraw %}{% endjs %}