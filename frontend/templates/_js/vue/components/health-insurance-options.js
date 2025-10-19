{% include '_js/utils/constants.js' %}
{% include '_js/utils/health-insurance.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/components/eur.js' %}
{% include '_js/vue/components/gkv-cost-explanation.js' %}
{% include '_js/vue/components/glossary.js' %}
{% include '_js/vue/mixins/uniqueIdsMixin.js' %}

{% js %}{% raw %}
Vue.component('health-insurance-options', {
	mixins: [uniqueIdsMixin],
	props: {
		age: Number,
		childrenCount: Number,
		hasGermanPublicHealthInsurance: Boolean,
		hasEUPublicHealthInsurance: Boolean,
		hoursWorkedPerWeek: Number,
		isApplyingForFirstVisa: Boolean,
		isMarried: Boolean,
		monthlyIncome: Number,
		occupation: String,
		customZusatzbeitrag: Number,
	},
	computed: {
		intro(){
			const optionsList = this.results.asList.map(r => r.id).filter(id => ['public', 'private', 'expat'].includes(id));
			if(this.results.free.eligible && !this.results.public.eligible){
				optionsList.unshift('public');
			}
			if(optionsList.length > 1){
				const options = new Intl.ListFormat('en-US', {style: 'long', type: 'disjunction'}).format(optionsList);
				return `You need <strong>${options} health insurance</strong>. Our expert can help you choose.`;
			}
		},

		isStudent(){ return occupations.isStudent(this.occupation) },

		results() {
			return getHealthInsuranceOptions({...this.$props, sortByPrice: true});
		},

		recommendedOption(){
			return this.results.asList[0].id;
		},

		minPublicPrice() {
			return this.results.public.options[0].total;
		},
		maxPublicPrice() {
			return this.results.public.options.at(-1).total;
		},

		ottonovaLink(){
			return this.isStudent ? "/out/ottonova-students" : "/out/ottonova-expats";
		},
		showGuideLink(){
			// If you're on this page, you're already reading about health insurance
			return window.location.pathname !== '/guides/german-health-insurance';
		},

		yourSponsorsHave() {
			if(this.flag('familienversicherung-parents') && this.flag('familienversicherung-spouse')){
				return 'your parents or your spouse have';
			}
			else if(this.flag('familienversicherung-spouse')){
				return 'your spouse has';
			}
			else if(this.flag('familienversicherung-parents')){
				return 'your parents have';
			}
		},
		visaType(){
			if(this.isStudent){
				return 'student visa';
			}
			else if(occupations.isSelfEmployed(this.occupation)){
				return 'freelance visa';
			}
			return 'visa';
		},
		calculatorParams() {
			return {
				age: +this.age,
				childrenCount: this.childrenCount,
				hasGermanPublicHealthInsurance: this.hasGermanPublicHealthInsurance,
				hasEUPublicHealthInsurance: this.hasEUPublicHealthInsurance,
				hoursWorkedPerWeek: this.hoursWorkedPerWeek,
				isApplyingForFirstVisa: this.isApplyingForFirstVisa,
				isMarried: this.isMarried,
				occupation: this.occupation,

				// Clear the income when the income input is not visible
				monthlyIncome: this.isUnemployed ? 0 : +this.monthlyIncome,
				sortByPrice: true,
			}
		},

		/***************************************************
		* Clarification for each option
		***************************************************/

		clarification(){
			if(this.occupation === 'azubi'){
				return this.azubiClarification;
			}
			else if(this.isStudent){
				return this.studentClarification;
			}
			else if(occupations.isSelfEmployed(this.occupation)){
				return this.selfEmployedClarification;
			}
			else if(occupations.isEmployed(this.occupation)){
				return this.employeeClarification;
			}
			else if(this.isUnemployed){
				return this.unemployedClarification;
			}
			return {};
		},

		azubiClarification(){
			const output = {};

			if(this.flag('public-tariff-azubiFree')){
				output.public = `You get free health insurance, because you earn less than ${this.eur(healthInsurance.azubiFreibetrag)} per month. ${this.publicCost}`;
			}
			else if(!this.flag('private')){
				output.public = `Public health insurance is <strong>your only option</strong>. ${this.publicCost}`
			}

			if(this.childrenCount > 0){
				output.public += ' ' + this.familienversicherung;
			}

			// You could have private if your Azubi income is really high, but it's unlikely to happen and not worth explaining
			return output;
		},
		employeeClarification(){
			const output = {};
			if(this.flag('public-minijob')){
				output.public = this.publicCost;
				if(this.results.expat.eligible){
					output.public = "It's more expensive, but you get <strong>better coverage</strong>. " + output.public;
					output.expat = "It's cheaper, but <strong>the coverage is not great</strong>.";
				}
				output.private = "Your income is too low for private health insurance. Most insurers will reject you.";
			}
			else if(this.results.private.eligible){
				if(this.childrenCount > 2){
					output.public = `Public health insurance is <strong>cheaper</strong>. ${this.publicCost}`;
					output.private = 'Choose private health insurance to get <strong>better coverage</strong> and faster doctor appointments for your family.'
				}
				else if(this.age <= 35){
					output.private = "It can be <strong>better and cheaper</strong> than public, because you are young and well-paid.";
					output.public = "This is a <strong>safer choice</strong>, because the cost is proportional to your income.";
				}
				else if(this.age >= 45){
					output.public = "This is usually the <strong>cheapest option</strong>, because you are over 45 years old."
					output.private = "It's usually more expensive, but you can get <strong>better coverage</strong> and faster doctor appointments."
				}
				else{
					output.private = "With private health insurance, you can get <strong>better coverage</strong> and faster doctor appointments."
				}
			}
			else{
				output.public = `Public health insurance is <strong>your only option</strong>. ${this.publicCost}`;
			}

			if(this.childrenCount > 0){
				output.public += ' ' + this.familienversicherung;
			}

			return output;
		},
		selfEmployedClarification(){
			const output = {
				expat: "This is the <strong>cheapest option</strong>, but the coverage is not great. It can be a really bad choice. Ask our expert before you choose this option."
			};

			if(this.age >= 45){
				output.public = "This is usually the <strong>best option</strong> for people over 45 years old."
				output.private = "It's usually more expensive, but you can get <strong>better coverage</strong> and faster doctor appointments."
			}
			else if(this.childrenCount > 2){
				output.public = `This is the <strong>cheapest option</strong> for families. ${this.publicCost}`;
				output.private = "It's usually more expensive, but you can get <strong>better coverage</strong> and faster doctor appointments for your family."
			}
			else{
				output.public = "This is the <strong>safest choice</strong>, because the cost is proportional to your income.";

				if((this.monthlyIncome * 12) >= 60000){
					output.private = "It might be <strong>better and cheaper</strong> than public health insurance, because you have a high income.";
					output.public = "If your income is unstable, this is the <strong>safest option</strong>, because the cost is proportional to your income."
				}
				else if((this.monthlyIncome * 12) >= 30000){							
					output.private = "Choose private health insurance to get <strong>better coverage</strong> and faster doctor appointments."
				}
				else{
					output.private = "Insurers might reject you because <strong>your income is too low</strong>."
					if(this.results.expat.eligible){
						output.private += " Expat health insurance might be your only option."
					}
					else if(this.results.public.eligible){
						output.private += " Public health insurance is a safer option."
					}
				}
			}

			if(this.childrenCount > 0){
				output.public += ' ' + this.familienversicherung;
			}

			return output;
		},
		studentClarification(){
			const output = {
				public: this.publicCost,
			};

			// Students under 30 years old
			if(this.flag('public-tariff-student')){
				if(this.results.free.eligible){
					output.public = "If you can't get free health insurance, this is the <strong>best option</strong>. " + output.public;
				}
				else{
					output.public = "This is the <strong>best option</strong> for students under 30 years old. " + output.public;
				}

				if(this.childrenCount > 0){
					output.public += ' ' + this.familienversicherung;
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
					if(this.results.free.eligible){
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

			if(this.results.free.eligible){
				output.public = `This is the <strong>safest option</strong>.`;
				output.expat = "This is the <strong>cheapest option</strong> for students over 30 years old, but the coverage is not great."
				output.private = 'Insurers usually reject unemployed people, but you can keep your current private health insurance.'
			}
			else{
				output.expat = "This is the <strong>cheapest option</strong>, but the coverage is not great. You can switch to public health insurance when you find a job.";
				output.public = `If you can't get free health insurance, this is the <strong>safest option</strong>.`;
			}

			if(this.childrenCount > 0){
				output.public += ' ' + this.familienversicherung;
			}

			return output;
		},

		familienversicherung(){
			return `It covers your ${this.childrenCount === 1 ? 'child' : 'children'} for free.`;
		},
		publicCost(){
			const minPrice = this.eur(this.minPublicPrice.personalContribution);
			const maxPrice = this.eur(this.maxPublicPrice.personalContribution);
			const priceRange = minPrice === maxPrice ? minPrice : `${minPrice} to ${maxPrice}`;
			return `It costs ${priceRange} per month, depending on the insurer you choose.`;
		},
	},
	methods: {
		selectOption(option){
			this.$emit('select', option);
		},

		flag(flagName){
			return this.results.flags.has(flagName);
		},
		eur(num) {
			return formatCurrency(num, false, '€', false);
		},
		optionPrice(type, id){
			return this.results[type].options.find(o => o.id === id).total.personalContribution;
		},
	},
	template: `
		<div class="health-insurance-options">
			<p v-if="intro" v-html="intro"></p>
			<hr v-if="intro">
			<template v-for="option in results.asList">
				<h3 v-if="results.asList.length > 1" v-text="option.name"></h3>

				<p v-if="clarification[option.id]" v-html="clarification[option.id]"></p>

				<ul class="buttons list" v-if="option.options.length">
					<li v-for="subOption in option.options" v-if="!['aok', 'hkk', 'dak'].includes(subOption.id)">
						<a v-if="subOption.id === 'familienversicherung'" @click="selectOption(subOption.id)" class="recommended" title="Learn more about family health insurance" href="/guides/german-health-insurance#free-health-insurance" target="_blank">
							{% endraw %}{% include "_css/icons/family.svg" %}{% raw %}
							<div>
								<h3><glossary term="Familienversicherung">Family insurance</glossary></h3>
								<p>If {{ yourSponsorsHave }} public health insurance, it covers you for free.</p>
							</div>
							<output>
								<eur :amount="0"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'social-benefits'" @click="selectOption(subOption.id)" :class="{recommended: !flag('familienversicherung')}" title="Learn more about state-sponsored health insurance" href="/guides/german-health-insurance#free-health-insurance" target="_blank">
							{% endraw %}{% include "_css/icons/bank.svg" %}{% raw %}
							<div>
								<h3>Paid by social benefits</h3>
								<p>If you get <glossary term="ALG I">unemployment benefits</glossary>, <glossary>Bürgergeld</glossary> or <glossary>Elterngeld</glossary>, you get free public health insurance.</p>
							</div>
							<output>
								<eur :amount="0"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'ehic'" @click="selectOption(subOption.id)" title="Learn more about the EHIC" href="/guides/german-health-insurance#insurance-from-other-eu-countries" target="_blank">
							{% endraw %}{% include "_css/icons/passport.svg" %}{% raw %}
							<div>
								<h3>European Health Insurance Card</h3>
								<p>Your insurance from another EU country might cover you in Germany.</p>
							</div>
							<output>
								<eur :amount="0"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'barmer'" @click="selectOption(subOption.id)" title="Sign up with BARMER" href="/out/feather-barmer-signup" target="_blank">
							{% endraw %}{% include "_css/icons/health-insurance/logo-barmer.svg" %}{% raw %}
							<div>
								<h3>Barmer</h3>
								<p>Second biggest health insurer. They speak English.</p>
							</div>
							<output>
								<eur :amount="optionPrice('public', 'barmer')"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'tk'" @click="selectOption(subOption.id)" title="Sign up with Techniker Krankenkasse" href="/out/feather-tk-signup" target="_blank" :class="{recommended: recommendedOption === 'public'}">
							{% endraw %}{% include "_css/icons/health-insurance/logo-tk.svg" %}{% raw %}
							<div>
								<h3>Techniker Krankenkasse</h3>
								<p>Biggest German health insurer. Great customer service. They speak English.</p>
							</div>
							<output>
								<eur :amount="optionPrice('public', 'tk')"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'ksk'" @click="selectOption(subOption.id)" title="Learn more about the KSK" href="/guides/ksk-kuenstlersozialkasse" target="_blank">
							{% endraw %}{% include "_css/icons/liability.svg" %}{% raw %}
							<div>
								<h3>Join the <glossary>Künstlersozialkasse</glossary></h3>
								<p>If you are an artist or a content creator, the KSK can pay half of your public health insurance.</p>
							</div>
							<output>
								<eur :amount="optionPrice('other', 'ksk')"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'feather-expat'" @click="selectOption(subOption.id)" title="Get expat health insurance from Feather" href="/out/feather-expats" target="_blank" :class="{recommended: recommendedOption === 'expat'}">
							{% endraw %}{% include "_css/icons/health-insurance/logo-feather.svg" %}{% raw %}
							<div>
								<h3>Feather</h3>
								<p>
									Great for a {{ visaType }} application.
									<template v-if="isStudent">It's valid until you graduate.</template>
									They speak English.
								</p>
							</div>
							<output>
								<eur :amount="subOption.cost"></eur> <small>per month</small>
							</output>
						</a>
						<a v-else-if="subOption.id === 'ottonova-expat'" @click="selectOption(subOption.id)" title="Get expat health insurance from Ottonova" :href="ottonovaLink" target="_blank">
							{% endraw %}{% include "_css/icons/health-insurance/logo-ottonova.svg" %}{% raw %}
							<div>
								<h3>Ottonova</h3>
								<p>Valid for a {{ visaType }} application. They speak English.</p>
							</div>
							<output>
								<eur :amount="subOption.cost"></eur> <small>per month</small>
							</output>
						</a>

						<button :aria-labelledby="uid('h-getAQuote')" v-else-if="subOption.id === 'broker'" @click="selectOption(subOption.id)" :class="{recommended: recommendedOption === 'private'}">
							{% endraw %}{% include "_css/icons/help.svg" %}{% raw %}
							<div>
								<h3 :id="uid('h-getAQuote')">Get a quote</h3>
								<p>Let us compare all private health insurers and find the best one for you.</p>
							</div>
						</button>
					</li>
				</ul>

				<gkv-cost-explanation v-if="option.id === 'public'" v-bind="calculatorParams"></gkv-cost-explanation>

				<hr>
			</template>

			<h3>Need help choosing?</h3>
			<ul class="buttons list">
				<li>
					<button @click="selectOption('broker')" class="recommended" :aria-labelledby="uid('h-askOurExpert')">
						{% endraw %}{% include "_css/icons/help.svg" %}{% raw %}
						<div>
							<h3 :id="uid('h-askOurExpert')">Ask our expert</h3>
							<p>Let us find the best health insurance for you. It's the fastest way to get insured, and it's 100% free.</p>
						</div>
					</button>
				</li>
				<li v-if="showGuideLink" :aria-labelledby="uid('h-readGuide')">
					<a href="/guides/german-health-insurance" @click="selectOption('guide')" target="_blank">
						{% endraw %}{% include "_css/icons/student.svg" %}{% raw %}
						<div>
							<h3 :id="uid('h-readGuide')">Learn how to choose</h3>
							<p>Read my health insurance guide and find the right insurance for your situation.</p>
						</div>
					</a>
				</li>
			</ul>
		</div>
	`
});
{% endraw %}{% endjs %}