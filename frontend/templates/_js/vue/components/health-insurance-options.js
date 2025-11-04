{% include '_js/utils/constants.js' %}
{% include '_js/utils/health-insurance.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/components/eur.js' %}
{% include '_js/vue/components/glossary.js' %}
{% include '_js/vue/components/price.js' %}
{% include '_js/vue/components/public-health-insurance-options.js' %}
{% include '_js/vue/mixins/brokerMixin.js' %}
{% include '_js/vue/mixins/healthInsuranceOptionsMixin.js' %}
{% include '_js/vue/mixins/uniqueIdsMixin.js' %}

{% js %}{% raw %}
Vue.component('health-insurance-options', {
	mixins: [brokerMixin, uniqueIdsMixin, healthInsuranceOptionsMixin],
	computed: {
		optionsList(){
			return this.results.asList.map(r => r.id).filter(id => ['public', 'private', 'expat'].includes(id));
		},
		intro(){
			let output = null;
			if(this.flag('free')){
				output += "You might also qualify for free health insurance.";
			}
			else if(this.optionsList.length === 1){
				output += "It's your only option.";
			}

			if(this.flag('private-income-too-low')){
				output += "Your income is too low for private health insurance.";
			}
			if(!this.results.public.eligible){
				output += "You don't qualify for public health insurance.";
			}

			if(output){
				const options = new Intl.ListFormat('en-US', {style: 'long', type: 'disjunction'}).format(this.optionsList);
				output = `You must choose <strong>${options} health insurance</strong>. ${output}`;
			}

			return output;
		},

		minCostByOption() {
			return Object.fromEntries(
				this.results.asList.map(result => {
					const minCost = Math.min(
						...result.options.map(o => o?.total?.personalContribution || Infinity)
					);
					return [result.id, minCost === Infinity ? undefined : minCost];
				})
			);
		},

		familienversicherungText() {
			const parents = this.flag('familienversicherung-parents');
			const spouse = this.flag('familienversicherung-spouse');
			let sponsors = null;
			if(parents && spouse){
				sponsors = 'your parents or your spouse have';
			}
			else if(spouse){
				sponsors = 'your spouse has';
			}
			else if(parents){
				sponsors = 'your parents have';
			}

			return `If ${sponsors} public health insurance, it covers you for free.`;
		},

		/***************************************************
		* Clarification for each option
		***************************************************/

		clarification(){
			if(this.occupation === 'azubi'){
				return this.azubiClarification;
			}
			else if(occupations.isStudent(this.occupation)){
				return this.studentClarification;
			}
			else if(occupations.isSelfEmployed(this.occupation)){
				return this.selfEmployedClarification;
			}
			else if(occupations.isEmployed(this.occupation)){
				return this.employeeClarification;
			}
			else if(occupations.isUnemployed(this.occupation)){
				return this.unemployedClarification;
			}
			return {};
		},

		azubiClarification(){
			const output = {};

			if(this.flag('public-tariff-azubiFree')){
				output.public = `You get free health insurance, because you earn less than ${this.eur(healthInsurance.azubiFreibetrag)} per month.`;
			}
			else if(!this.flag('private')){
				output.public = `This is your only option, because your income is too low for private health insurance.`
			}

			// You could have private if your Azubi income is really high, but it's unlikely to happen and not worth explaining
			return output;
		},
		employeeClarification(){
			const output = {};
			if(this.results.private.eligible){
				if(this.minCostByOption.public > this.minCostByOption.private){
					output.private = "It's cheaper because you are young and you have a good income. You pay less <em>and</em> get better coverage.";
					output.public = "It's more expensive because it costs a percentage of your income.";
				}
				else {
					output.private = "In your situation, private only makes sense if you want better coverage or faster doctor appointments. Public health insurance is cheaper.";
				}
			}
			return output;
		},
		selfEmployedClarification(){
			const output = {};
			const public = this.results.public.eligible;
			const private = this.results.private.eligible;
			const expat = this.results.expat.eligible;

			if(public && private){
				if(this.minCostByOption.public > this.minCostByOption.private){
					output.private = "This is a great option because you are young and you have a good income. You can get better coverage <em>and</em> pay less.";
					output.public = "This is a safer option because the cost matches your income. Choose this if you have an unstable income.";
				}
				else {
					output.private = "In your situation, private only makes sense if you want better coverage or faster doctor appointments. Public health insurance is cheaper.";
				}
				output.expat = "Avoid this option if you can. The other options are much better.";
			}
			else if(public && expat && !private){
				output.public = "This is the best long-term option. It's more expensive, but you get much better coverage.";
				output.expat = "Avoid this option if you can. Public health insurance is much better. If you choose expat health insurance, you can't switch to public later.";
			}
			else if(private && expat && !public){
				output.private = "This is the best long-term option."
				output.expat = "Avoid this option if you can. Private health insurance is much better.";
			}
			else if(expat && !private && !public){
				output.expat = "This is not a great option, but you have no choice. Switch to public or private health insurance when you can.";
			}
			return output;
		},
		studentClarification(){
			const output = {
				public: null,
			};

			// Students under 30 years old
			if(this.flag('public-tariff-student')){
				if(this.flag('free')){
					output.public = "If you can't get free health insurance, this is the <strong>best option</strong>.";
				}
				else{
					output.public = "This is the <strong>best option</strong> for students under 30 years old.";
				}

				output.expat = "It's cheaper, but <strong>the coverage is bad</strong>. Public health insurance is better.";
				output.private = "It's more expensive, but you can get <strong>better coverage</strong> and faster doctor appointments.";
			}
			// Students over 30 years old
			else if(this.flag('public-student-over-30')){
				if(this.isApplyingForFirstVisa){
					// TODO: Private explanation for EU students over 30?
				}
				else{
					if(this.flag('free')){
						output.expat = "If you can't get free health insurance, this is the <strong>cheapest option</strong>, but the coverage is not great."
					}
					else{
						output.expat = "This is the <strong>cheapest option</strong> for students over 30 years old, but the coverage is not great."
						output.private = "It's more expensive, but you get <strong>much better coverage</strong>.";
					}
				}
			}
			else if(this.flag('public-not-werkstudent')){
				if(this.hoursWorkedPerWeek > 20){
					output.public += " You work more than 20 hours per week, so you don't pay the cheaper student tariff.";
				}
				else{
					output.public += " Your income is too high, so you don't pay the cheaper student tariff.";
				}
			}

			return output;
		},
		unemployedClarification(){
			const output = {};

			if(this.flag('free')){
				output.public = `This is the <strong>safest option</strong>.`;
				output.expat = "This is the <strong>cheapest option</strong> for students over 30 years old, but the coverage is not great."
				output.private = 'Insurers usually reject unemployed people, but you can keep your current private health insurance.'
			}
			else{
				output.expat = "This is the <strong>cheapest option</strong>, but the coverage is not great. You can switch to public health insurance when you find a job.";
				output.public = `If you can't get free health insurance, this is the <strong>safest option</strong>.`;
			}

			return output;
		},
	},
	methods: {
		flag(flagName){
			return this.results.flags.has(flagName);
		},
		eur(num) {
			return formatCurrency(num, false, '€', false);
		},
		learnMoreUrl(id){ return `/guides/german-health-insurance#${id}-health-insurance` },

		prosAndCons(insuranceType){
			if(insuranceType === 'public'){
				const pros = [
					"The cost adjusts to your income",
					"It covers all necessary healthcare",
				];
				if(this.childrenCount){
					pros.push(`It covers your ${this.childOrChildren} for free`);
				}
				return {
					pros,
					cons: [
						"Longer wait times to see a specialist",
						"Limited dental coverage",
					],
				};
			}
			else if(insuranceType === 'private'){
				const cons = ["It costs the same if you lose your job"];
				if(this.childrenCount){
					cons.push(`You must pay to cover your ${this.childOrChildren}`);
				}
				return {
					pros: [
						"Choose the coverage you want",
						"Get doctor appointments faster",
					],
					cons,
				};
			}
			else if(insuranceType === 'expat'){
				return {
					pros: [
						"Cheaper than full health insurance",
					],
					cons: [
						"Very limited coverage",
						"It's a bad long-term option",
					],
				};
			}
		},
	},
	template: `
		<div class="health-insurance-options">
			<h2>Your options</h2>
			<p v-html="intro" v-if="intro"></p>
			<ul class="buttons list" v-if="optionsList.length > 1">
				<li v-for="option in results.asList" v-if="option.eligible && option.id !== 'other'">
					<button class="button" @click="selectOption(option.id + 'Options')">
						<div>
							<h3 v-text="option.name"></h3>
							<p v-if="clarification[option.id]" v-html="clarification[option.id]"></p>
						</div>
						<price v-if="minCostByOption[option.id]" :amount="minCostByOption[option.id]" per-month></price>
						<div class="two-columns" v-if="prosAndCons(option.id)">
							<ul class="pros">
								<li v-for="pro in prosAndCons(option.id).pros" v-text="pro" :key="pro"></li>
							</ul>
							<ul class="cons">
								<li v-for="con in prosAndCons(option.id).cons" v-text="con" :key="con"></li>
							</ul>
						</div>
					</button>
				</li>
			</ul>

			<public-health-insurance-options @select="selectOption" v-bind="$props" v-if="optionsList.length === 1 && results.public.eligible"></public-health-insurance-options>
			<expat-health-insurance-options @select="selectOption" v-bind="$props" v-if="optionsList.length === 1 && results.expat.eligible"></expat-health-insurance-options>
			<template v-if="results.other.eligible">
				<hr>
				<h3 v-text="results.other.name"></h3>
				<ul class="buttons list">
					<li v-for="subOption in results.other.options" :key="subOption.id">
						<a v-if="subOption.id === 'familienversicherung'" @click="selectOption(subOption.id)" title="Learn more about family health insurance" href="/guides/german-health-insurance#free-health-insurance" target="_blank">
							{% endraw %}{% include "_css/icons/family.svg" %}{% raw %}
							<div>
								<h3>Family health insurance</h3>
								<p v-text="familienversicherungText"></p>
							</div>
							<price :amount="0" per-month></price>
						</a>
						<a v-if="subOption.id === 'social-benefits'" @click="selectOption(subOption.id)" title="Learn more about state-sponsored health insurance" href="/guides/german-health-insurance#free-health-insurance" target="_blank">
							{% endraw %}{% include "_css/icons/bank.svg" %}{% raw %}
							<div>
								<h3>Social benefits</h3>
								<p>If you get <glossary term="ALG I">unemployment benefits</glossary>, <glossary>Bürgergeld</glossary> or <glossary>Elterngeld</glossary>, you get free public health insurance.</p>
							</div>
							<price :amount="0" per-month></price>
						</a>
						<a v-if="subOption.id === 'ehic'" @click="selectOption(subOption.id)" title="Learn more about the EHIC" href="/guides/german-health-insurance#insurance-from-other-eu-countries" target="_blank">
							{% endraw %}{% include "_css/icons/passport.svg" %}{% raw %}
							<div>
								<h3>European Health Insurance Card</h3>
								<p>Your insurance from another EU country might cover you in Germany.</p>
							</div>
							<price :amount="0" per-month></price>
						</a>
						<a v-if="subOption.id === 'ksk'" @click="selectOption(subOption.id)" title="Learn more about the KSK" href="/guides/ksk-kuenstlersozialkasse" target="_blank">
							{% endraw %}{% include "_css/icons/liability.svg" %}{% raw %}
							<div>
								<h3>Join the <glossary>Künstlersozialkasse</glossary></h3>
								<p>If you are an artist, the KSK can pay half of your public health insurance. This is a really good deal.</p>
							</div>
							<price :amount="optionPrice('other', subOption.id)" per-month></price>
						</a>
					</li>
				</ul>
			</template>
		</div>
	`
});
{% endraw %}{% endjs %}
