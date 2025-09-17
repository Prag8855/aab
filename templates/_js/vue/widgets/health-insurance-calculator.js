{% include '_js/utils/constants.js' %}
{% include '_js/utils/currency.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/components/age-input.js' %}
{% include '_js/vue/components/checkbox.js' %}
{% include '_js/vue/components/children-input.js' %}
{% include '_js/vue/components/collapsible.js' %}
{% include '_js/vue/components/email-input.js' %}
{% include '_js/vue/components/full-name-input.js' %}
{% include '_js/vue/components/glossary.js' %}
{% include '_js/vue/components/health-insurance-options.js' %}
{% include '_js/vue/components/income-input.js' %}
{% include '_js/vue/components/radio.js' %}
{% include '_js/vue/components/tabs.js' %}
{% include '_js/vue/mixins/multiStageMixin.js' %}
{% include '_js/vue/mixins/trackedStagesMixin.js' %}
{% include '_js/vue/mixins/uniqueIdsMixin.js' %}
{% include '_js/vue/mixins/userDefaultsMixin.js' %}

{% js %}{% raw %}
Vue.component('health-insurance-calculator', {
	mixins: [userDefaultsMixin, multiStageMixin, uniqueIdsMixin, trackedStagesMixin],
	props: {
		static: {
			type: Boolean,
			default: false,
		},
		mode: {
			type: String,
			default: 'calculator',
		},
		initialOccupation: {
			type: String,
			default: null,
		},
	},
	data() {
		return {
			// Some of these fields default to null, instead of userDefaults values.
			// This is to make sure that we send user input to the API, and not
			// default values.

			// Insurance questions
			age: userDefaults.empty,
			childrenCount: userDefaults.empty,
			inputIncome: userDefaults.empty,
			occupation: userDefaults.empty,
			isMarried: userDefaults.empty,
			useMonthlyIncome: userDefaults.useMonthlyIncome,
			yearlyIncome: userDefaults.empty,
			worksOver20HoursPerWeek: userDefaults.empty,
			isApplyingForFirstVisa: userDefaults.empty,
			hasGermanPublicHealthInsurance: userDefaults.empty,
			hasEUPublicHealthInsurance: userDefaults.empty,

			// Contact form
			contactMethod: null,
			fullName: userDefaults.empty,
			email: userDefaults.empty,
			question: '',
			isLoading: false,

			// Component settings
			trackAs: `Health insurance ${this.mode}`,
			stages: this.mode === 'question' ? [
					'askABroker',
					'questions',
					'thank-you',
					'error',
				] : [
					'occupation',
					'questions',
					'options',
					'askABroker',
					'thank-you',
					'error',
				],
			inputsToFocus: {},

			pflegeversicherung,
			healthInsurance,

			// TODO: "We already know that..." replacement
			// TODO: Email is passed even when field is not visible
			// TODO: Move occupations from constants.js to another file
			// TODO: Test collapsible header text
			// TODO: Length of progress bar changes depending on mode
			// TODO: askForCurrentInsurance: run two calculations and see if they differ. No business logic there.
			// TODO: Set submit button text based on purpose ("Ask Seamus")
			// TODO: .health-insurance-question is gone. Fix the CSS.
			// TODO: Use email-input and full-name-input everywhere
			// TODO: Add childrenCount to API
			// TODO: Add hasPublicHealthInsurance to API
			// TODO: Set expat insurance prices correctly
			// TODO: Add HanseMerkur
		};
	},
	mounted(){
		this.inputIncome = this.useMonthlyIncome ? this.monthlyIncome : this.yearlyIncome;
	},
	computed: {
		isStudent(){ return occupations.isStudent(this.occupation) },
		isSelfEmployed(){ return occupations.isSelfEmployed(this.occupation) },
		isUnemployed(){ return occupations.isUnemployed(this.occupation) },
		monthlyIncome(){ return this.yearlyIncome / 12 },
		progressBarLength(){ return this.mode === 'question' ? null : 3 },
		progressBarValue(){ return Math.min(this.stageIndex, this.progressBarLength) },
		sortedOccupations(){
			const sortedOccupations = ['employee', 'studentUnemployed', 'selfEmployed', 'azubi', 'unemployed', null];
			if(this.initialOccupation){
				return [this.initialOccupation, ...sortedOccupations.filter(o => o !== this.initialOccupation)];
			}
			return sortedOccupations;
		},

		requireCompleteForm(){
			// When asking a question, the fields are only a suggestion
			return this.mode === 'calculator';
		},

		askForCurrentInsurance(){
			// Current insurance has no effect; public is the only option
			return !( // Azubi
				this.occupation === 'azubi'
				&& this.monthlyIncome < healthInsurance.minFreiwilligMonthlyIncome
			)
			&& !( // Employee with medium income
				this.occupation === 'employee'
				&& this.monthlyIncome > taxes.maxMinijobIncome
				&& this.monthlyIncome < healthInsurance.minFreiwilligMonthlyIncome
			);
		},

		// Insurance options
		calculatorParams(){
			return {
				age: this.age,
				childrenCount: this.childrenCount,
				hasGermanPublicHealthInsurance: this.hasGermanPublicHealthInsurance,
				hasEUPublicHealthInsurance: this.hasEUPublicHealthInsurance,
				hoursWorkedPerWeek: this.worksOver20HoursPerWeek ? 40 : 20,
				isApplyingForFirstVisa: this.isApplyingForFirstVisa,
				isMarried: this.isMarried,
				monthlyIncome: this.isUnemployed ? 0 : this.monthlyIncome,
				occupation: this.occupation,
				customZusatzbeitrag: null,
			};
		},

		// Contact form
		personSummary(){
			if(!this.occupation){
				// "It's complicated"
				return '';
			}

			const facts = [];

			facts.push(`I am ${this.fullName}`);

			if(this.age !== undefined){
				facts.push(`I am ${this.age} years old`);
			}

			const cleanOccupation = {
				azubi: 'an apprentice',
				employee: 'employed',
				selfEmployed: 'self-employed',
				studentEmployee: 'a student',
				studentSelfEmployed: 'a self-employed student',
				studentUnemployed: 'an unemployed student',
				unemployed: 'unemployed',
			}[this.occupation];
			if(cleanOccupation){
				facts.push(`I am ${cleanOccupation}`);
			}
			if(this.isStudent){
				facts.push(`I work ${this.worksOver20HoursPerWeek ? 'more' : 'less'} than 20 hours per week`);
			}
			if(this.yearlyIncome !== undefined && !this.isUnemployed){
				facts.push(`I earn ${formatCurrency(this.yearlyIncome)} per year`);
			}
			if(this.isApplyingForFirstVisa != null){
				facts.push('I am applying for a visa');
			}
			if(this.isMarried != null){
				facts.push(`I am ${this.isMarried ? '' : 'not '}married`);
			}

			if(this.childrenCount != null){
				if(this.childrenCount === 0){
					facts.push(`I don't have children`);
				}
				else{
					facts.push(`I have ${this.childrenCount} ${this.childOrChildren}`);
				}
			}

			if(this.hasGermanPublicHealthInsurance != null){
				facts.push(`I have German public health insurance`);
			}
			else if(this.hasEUPublicHealthInsurance != null){
				facts.push(`I have public health insurance in another EU country`);
			}

			return (new Intl.ListFormat('en-US', {style: 'long', type: 'conjunction'}).format(facts)) + '.';
		},
		whatsappMessage(){
			return `Hi Seamus, can you help me choose health insurance? ${this.personSummary}`;
		},
		whatsappUrl(){
			return `https://wa.me/{% endraw %}{{ BROKER_PHONE_NUMBER }}{% raw %}?text=${encodeURIComponent(this.whatsappMessage)}`;
		},
		caseNotes(){
			return `QUESTION:\n${this.question || 'not specified'}\n\nSUMMARY:\n${this.personSummary || 'not specified'}`;
		},

		// Printed values
		salaryOrIncome(){ return occupations.isEmployed(this.occupation) ? 'Salary' : 'Income' },
		childOrChildren(){ return this.childrenCount === 1 ? 'child' : 'children' },
	},
	methods: {
		nextStage(){
			if(validateForm(this.$el)){
				this.stageIndex += 1;
			}
		},
		previousStage(){
			// If "it's complicated" is chosen, skip the questions stage on the way back
			if(this.mode === 'calculator' && !this.occupation){
				this.goToStart();
			}
			else{
				this.stageIndex -= 1;
			}
		},

		// Insurance questions
		selectOccupation(occupation){
			this.occupation = occupation;
			occupation ? this.nextStage() : this.goToStage('askABroker');
		},

		// Insurance options
		selectInsuranceOption(option){
			if(option === 'broker'){
				this.goToStage('askABroker');
			}
		},

		// Contact form
		async createCase(event){
			if(validateForm(this.$el)){
				this.isLoading = true;
				const response = await fetch(
					'/api/insurance/case',
					{
						method: 'POST',
						keepalive: true,
						headers: {'Content-Type': 'application/json; charset=utf-8'},
						body: JSON.stringify({
							email: this.email || '',
							notes: this.caseNotes,
							referrer: getReferrer() || '',
							contact_method: this.contactMethod || 'EMAIL',
							insured_persons: [
								{
									// If occupation is not set, we are in "It's complicated" mode and the input values must be ignored
									first_name: this.fullName,
									income: (this.occupation && this.yearlyIncome != null) ? this.yearlyIncome : null,
									occupation: this.occupation || 'other',
									age: (this.occupation && this.age) ? this.age : null,
									is_married: this.occupation ? this.isMarried : null,
								}
							],

						}),
					},
				);
				this.isLoading = false;

				if(response.ok){
					this.goToStage('thank-you');
					if(this.contactMethod === 'WHATSAPP'){
						plausible(this.trackAs, { props: { stage: 'whatsapp', pageSection: getNearestHeadingId(this.$el) }});
					}
				}
				else{
					this.goToStage('error');
				}
			}
			else{
				// Don't open Whatsapp
				event.preventDefault();
				return;
			}
		},
	},
	watch: {
		inputIncome(newIncome){
			this.yearlyIncome = this.useMonthlyIncome ? newIncome * 12 : newIncome;
		},
		useMonthlyIncome(monthly){
			this.yearlyIncome = monthly ? this.inputIncome * 12 : this.inputIncome;
		},
	},
	template: `
		<collapsible class="health-insurance-calculator" :static="static" :aria-label="trackAs">
			<template v-slot:header v-text="trackAs">
				<template v-if="mode === 'question'">Ask our<span class="no-mobile"> health</span> insurance expert</template>
				<template v-else>Health insurance calculator</template>
			</template>

			<progress v-if="progressBarLength && stageIndex !== 0" aria-label="Form progress" :value="progressBarValue" :max="progressBarLength"></progress>

			<template v-if="stage === 'occupation' && initialOccupation === 'studentUnemployed'">
				<p>This tool helps you <strong>find student health insurance</strong> in a few seconds.</p>
				<hr>
				<ul class="benefits">
					<li>
						{% endraw %}{% include "_css/icons/liability.svg" %}{% raw %}
						<div>
							<strong>Low price, great coverage</strong>
							<br>Find affordable health insurance that works when you need it.
						</div>
					</li>
					<li>
						{% endraw %}{% include "_css/icons/moving.svg" %}{% raw %}
						<div>
							<strong>Perfect for a student visa</strong>
							<br>Get the right insurance for your National Visa application.
						</div>
					</li>
				</ul>
				<hr>
				<div class="buttons bar">
					<button class="button primary" @click="selectOccupation('studentUnemployed')">Find health insurance <i class="icon right"></i></button>
				</div>
			</template>

			<template v-if="stage === 'occupation' && initialOccupation === 'selfEmployed'">
				<p>This tool helps you <strong>find the best health insurance</strong> for freelancers in a few seconds.</p>
				<hr>
				<ul class="benefits">
					<li>
						{% endraw %}{% include "_css/icons/liability.svg" %}{% raw %}
						<div>
							<strong>Low price, great coverage</strong>
							<br>Find affordable health insurance that works when you need it.
						</div>
					</li>
					<li>
						{% endraw %}{% include "_css/icons/moving.svg" %}{% raw %}
						<div>
							<strong>Perfect for your <span class="no-mobile">freelance</span> visa</strong>
							<br>Get insurance that's accepted by the immigration office.
						</div>
					</li>
					<li>
						{% endraw %}{% include "_css/icons/helper.svg" %}{% raw %}
						<div>
							<strong>Free expert advice</strong>
							<br>Ask us anything on WhatsApp, get answers from our insurance expert.
						</div>
					</li>
				</ul>
				<hr>
				<div class="buttons bar">
					<button class="button primary" @click="selectOccupation('selfEmployed')">Find health insurance <i class="icon right"></i></button>
				</div>
			</template>

			<template v-if="stage === 'occupation' && initialOccupation === 'employee'">
				<p>This tool helps you <strong>find the best health insurance</strong> in a few seconds.</p>
				<hr>
				<ul class="benefits">
					<li>
						{% endraw %}{% include "_css/icons/family.svg" %}{% raw %}
						<div>
							<strong>Insurance for you and your family</strong>
							<br>Find health insurance that covers your spouse and your children.
						</div>
					</li>
					<li>
						{% endraw %}{% include "_css/icons/job.svg" %}{% raw %}
						<div>
							<strong>Perfect for your visa <span class="no-mobile">application</span></strong>
							<br>Get the right insurance for your work visa, Blue Card or Chancenkarte.
						</div>
					</li>
					<li>
						{% endraw %}{% include "_css/icons/helper.svg" %}{% raw %}
						<div>
							<strong>Free expert advice</strong>
							<br>Ask our insurance expert anything on WhatsApp.
						</div>
					</li>
				</ul>
				<hr>
				<div class="buttons bar">
					<button class="button primary" @click="selectOccupation('employee')">Find health insurance <i class="icon right"></i></button>
				</div>
			</template>

			<template v-if="stage === 'occupation' && !['employee', 'studentUnemployed', 'selfEmployed'].includes(initialOccupation)">
				<p><strong>Let's find the right health insurance.</strong> What is your occupation?</p>
				<ul class="buttons grid" aria-label="Occupations">
					<li v-for="occ in sortedOccupations" :key="occ">
						<button v-if="occ === 'employee'" @click="selectOccupation('employee')">
							{% endraw %}{% include "_css/icons/job.svg" %}{% raw %}
							Employee
						</button>
						<button v-else-if="occ === 'studentUnemployed'" @click="selectOccupation('studentUnemployed')">
							{% endraw %}{% include "_css/icons/student.svg" %}{% raw %}
							Student
						</button>
						<button v-else-if="occ === 'selfEmployed'" @click="selectOccupation('selfEmployed')">
							{% endraw %}{% include "_css/icons/business.svg" %}{% raw %}
							Self-employed
						</button>
						<button v-else-if="occ === 'azubi'" @click="selectOccupation('azubi')">
							{% endraw %}{% include "_css/icons/helper.svg" %}{% raw %}
							Apprentice
						</button>
						<button v-else-if="occ === 'unemployed'" @click="selectOccupation('unemployed')">
							{% endraw %}{% include "_css/icons/visiting.svg" %}{% raw %}
							Unemployed
						</button>
						<button v-else-if="occ === null" @click="selectOccupation(null)">
							{% endraw %}{% include "_css/icons/family.svg" %}{% raw %}
							It's complicated
						</button>
					</li>
				</ul>
			</template>

			<template v-if="stage === 'questions'">
				<h3>Tell us a bit more about you&hellip;</h3>
				<p v-if="mode === 'question'">It's optional, but it helps Seamus recommend the right health insurance.</p>
				<p v-else>It helps us calculate prices and recommend the right health insurance.</p>
				<hr>
				<div class="form-group">
					<label :for="uid('isApplyingForFirstVisa')">
						Immigration
					</label>
					<checkbox :id="uid('isApplyingForFirstVisa')" v-model="isApplyingForFirstVisa">
						<div v-if="occupation === 'employee'">
							I am applying for my first <glossary term="Work Visa">work visa</glossary>, <glossary>Blue Card</glossary> or <glossary term="Chancenkarte">Opportunity Card</glossary>
						</div>
						<div v-else-if="isSelfEmployed">
							I am applying for my first <glossary term="Freelance visa">freelance visa</glossary>
						</div>
						<div v-else-if="isStudent">
							I am applying for a <glossary term="Student visa">student visa</glossary>
						</div>
						<div v-else>
							I am applying for a <glossary>National Visa</glossary> to move to Germany
						</div>
					</checkbox>
				</div>
				<hr>
				<div class="form-group">
					<label :for="uid('age')">
						Age
					</label>
					<div class="input-group">
						<age-input
							ref="ageInput"
							:id="uid('age')"
							v-model="age"
							:required="requireCompleteForm"></age-input>
						years old
					</div>
				</div>
				<div class="form-group">
					<span class="label">
						Spouse
					</span>
					<tabs
						aria-label="Are you married?"
						v-model="isMarried"
						:id="uid('isMarried')"
						:options="[{label: 'Married', value: true}, {label: 'Not married', value: false}]"
						:required="requireCompleteForm"></tabs>
				</div>
				<div class="form-group">
					<label :id="uid('childrenCount')">
						Children
					</label>
					<children-input
						v-model="childrenCount"
						:id="uid('childrenCount')"
						:required="requireCompleteForm"></children-input>
				</div>
				<div class="form-group" v-if="isStudent">
					<span class="label">
						Other occupation
					</span>
					<radio
						v-model="occupation"
						value="studentUnemployed"
						:required="requireCompleteForm">
						I am unemployed
					</radio>
					<radio
						v-model="occupation"
						value="studentEmployee"
						:required="requireCompleteForm">
						I have a job
					</radio>
					<radio
						v-model="occupation"
						value="studentSelfEmployed"
						:required="requireCompleteForm">
						I am self-employed
					</radio>
				</div>
				<div class="form-group" v-if="!isUnemployed">
					<label :for="uid('income')" v-text="salaryOrIncome"></label>
					<div class="input-group">
						<income-input
							:id="uid('income')"
							v-model="inputIncome"
							:required="requireCompleteForm"></income-input>&nbsp;€
						<button class="toggle" @click="useMonthlyIncome = !useMonthlyIncome">per {{ useMonthlyIncome ? 'month' : 'year' }}</button>
						<span class="no-mobile">before taxes</span>
					</div>
					<checkbox v-model="worksOver20HoursPerWeek" v-if="occupation === 'studentEmployee'">
						I work more than 20 hours per week
					</checkbox>
				</div>
				<hr v-if="askForCurrentInsurance">
				<div class="form-group" v-if="askForCurrentInsurance">
					<span class="label">
						Current insurance
					</span>
					<checkbox v-model="hasGermanPublicHealthInsurance">
						I have public health insurance in Germany
						<span class="input-instructions">
							Or had <glossary term="gesetzliche Krankenversicherung">public health insurance</glossary> in Germany for at least 2 of the past 5 years.
						</span>
					</checkbox>
					<checkbox v-model="hasEUPublicHealthInsurance">
						I have public health insurance in another EU country
						<span class="input-instructions">
							Or had <glossary term="gesetzliche Krankenversicherung">public health insurance</glossary> in the EU for at least 2 of the past 5 years.
						</span>
					</checkbox>
				</div>
				<hr>
				<div class="buttons bar">
					<template v-if="mode === 'calculator'">
						<button aria-label="Go back" class="button" @click="goToStart()">
							<i class="icon left" aria-hidden="true"></i> <span class="no-mobile">Go back</span>
						</button>
						<button class="button primary" @click="nextStage()">
							See options <i class="icon right" aria-hidden="true"></i>
						</button>
					</template>

					<template v-if="mode === 'question'">
						<button aria-label="Go back" class="button" @click="goToStart()">
							<i class="icon left" aria-hidden="true"></i> <span class="no-mobile">Go back</span>
						</button>
						<button v-if="contactMethod === 'EMAIL'" class="button primary" @click="createCase" :disabled="isLoading" :class="{loading: isLoading}">
							Ask Seamus
						</button>
						<a v-if="contactMethod === 'WHATSAPP'" :href="whatsappUrl" @click="createCase" class="button whatsapp" :disabled="isLoading" target="_blank">
							{% endraw %}{% include "_css/icons/whatsapp.svg" %}{% raw %}
							<span class="only-mobile">Start chat</span>
							<span class="no-mobile">Chat with Seamus</span>
						</a>
					</template>
				</div>
			</template>

			<template v-if="stage === 'options'">
				<health-insurance-options v-bind="calculatorParams" @select="selectInsuranceOption"></health-insurance-options>
				<hr>
				<div class="buttons bar">
					<button aria-label="Go back" class="button" @click="previousStage()">
						<i class="icon left" aria-hidden="true"></i> <span class="no-mobile">Go back</span>
					</button>
					<button class="button primary" @click="nextStage()">
						Ask our expert <i class="icon right" aria-hidden="true"></i>
					</button>
				</div>
			</template>

			<template v-if="stage === 'askABroker'">
				<div class="form-recipient">
					<div>
						<p>Seamus will help you <strong>choose the best health insurance</strong>. I work with him because he is honest and knowledgeable.</p>
						<p>Seamus replies on the same day. His help is <strong>100% free</strong>.</p>
					</div>
					<img
						srcset="/experts/photos/bioLarge1x/seamus-wolf.jpg, /experts/photos/bioLarge2x/seamus-wolf.jpg 2x"
						alt="Seamus Wolf, insurance broker" width="125" height="125"
						sizes="125px">
				</div>
				<hr>
				<div class="contact-method">
					<h3>How should we talk?</h3>
					<tabs
						aria-label="Preferred contact method"
						v-model="contactMethod"
						:id="uid('contactMethod')"
						:options="[{label: 'WhatsApp', value: 'WHATSAPP'}, {label: 'Email', value: 'EMAIL'}]"></tabs>
				</div>
				<template v-if="contactMethod">
					<hr>
					<div class="form-group">
						<label :for="uid('fullName')">
							Name
						</label>
						<full-name-input
							:for="uid('fullName')"
							v-model="fullName"
							required></full-name-input>
					</div>
					<div class="form-group" v-if="contactMethod === 'EMAIL'">
						<label :for="uid('email')">
							Email address
						</label>
						<email-input
							v-model="email"
							:id="uid('email')"
							required></email-input>
					</div>
					<template v-if="contactMethod !== 'WHATSAPP'">
						<hr>
						<div class="form-group">
							<label :for="uid('question')">
								Your question
							</label>
							<textarea :id="uid('question')" v-model="question" placeholder="How can Seamus help you?"></textarea>
						</div>
					</template>
				</template>
				<template v-if="contactMethod">
					<hr>
					<div class="buttons bar">
						<button v-if="stageIndex > 0" aria-label="Go back" class="button" @click="previousStage()">
							<i class="icon left" aria-hidden="true"></i> <span class="no-mobile">Go back</span>
						</button>
						<button v-if="mode === 'question'" class="button primary" @click="nextStage()">
							Continue <i class="icon right" aria-hidden="true"></i>
						</button>
						<button v-if="mode === 'calculator' && contactMethod === 'EMAIL'" class="button primary" @click="createCase" :disabled="isLoading" :class="{loading: isLoading}">
							Ask Seamus
						</button>
						<a v-if="mode === 'calculator' && contactMethod === 'WHATSAPP'" :href="whatsappUrl" @click="createCase" class="button whatsapp" :disabled="isLoading" target="_blank">
							{% endraw %}{% include "_css/icons/whatsapp.svg" %}{% raw %}
							<span class="only-mobile">Start chat</span>
							<span class="no-mobile">Chat with Seamus</span>
						</a>
					</div>
				</template>
			</template>

			<template v-if="stage === 'thank-you' || stage === 'error'">
				<p v-if="stage === 'thank-you'"><strong>Thank you!</strong> Seamus will contact you today or during the next business day.</p>
				<p v-if="stage === 'error'"><strong>An error occured</strong> while sending your question. If this keeps happening, <a target="_blank" href="/contact">contact me</a>.</p>
				<hr>
				<div class="buttons bar">
					<button aria-label="Go back" class="button" @click="goToStart()">
						<i class="icon left" aria-hidden="true"></i> Go back
					</button>
				</div>
			</template>
		</collapsible>
	`,
});

document.querySelectorAll('health-insurance-calculator').forEach(el => new Vue({ el }));
{% endraw %}{% endjs %}