{% include '_js/constants.js' %}
{% include '_js/currency.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/collapsible.js' %}
{% include '_js/vue/glossary.js' %}
{% include '_js/vue/age-input.js' %}
{% include '_js/vue/email-input.js' %}
{% include '_js/vue/full-name-input.js' %}
{% include '_js/vue/income-input.js' %}
{% include '_js/vue/health-insurance-options.js' %}
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
	},
	data() {
		return {
			// Insurance questions
			age: userDefaults.age,
			childrenCount: userDefaults.childrenCount,
			inputIncome: userDefaults.useMonthlyIncome ? Math.round(userDefaults.yearlyIncome / 12) : userDefaults.yearlyIncome,
			occupation: userDefaults.occupation,
			isMarried: userDefaults.isMarried,
			useMonthlyIncome: userDefaults.useMonthlyIncome,
			yearlyIncome: userDefaults.yearlyIncome,
			worksOver20HoursPerWeek: false,
			isEUCitizen: false,
			hasPublicHealthInsurance: false,

			// Contact form
			contactMethod: null,
			fullName: userDefaults.fullName,
			email: userDefaults.email,
			question: '',
			isLoading: false,

			// Component settings
			trackAs: `Health insurance ${this.mode}`,
			stages: this.mode === 'question' ? [
					'ask-a-broker',
					'questions',
					'thank-you',
					'error',
				] : [
					'occupation',
					'questions',
					'options',
					'ask-a-broker',
					'thank-you',
					'error',
				],
			inputsToFocus: {}, // TODO

			pflegeversicherung,
			healthInsurance,

			// TODO: "We already know that..." replacement
			// TODO: Move occupations from constants.js to another file
			// TODO: Set inputsToFocus
			// TODO: Test collapsible header text
			// TODO: Length of progress bar changes depending on mode
			// TODO: askForCurrentInsurance: run two calculations and see if they differ. No business logic there.
			// TODO: Set submit button text based on purpose ("Ask Seamus")
			// TODO: .health-insurance-question is gone. Fix the CSS.
			// TODO: Use email-input and full-name-input everywhere
			// TODO: Add childrenCount to API
			// TODO: Add hasPublicHealthInsurance to API
			// TODO: Replace currentInsurance with hasPublicHealthInsurance
		};
	},
	mounted(){
		this.inputIncome = this.useMonthlyIncome ? this.monthlyIncome : this.yearlyIncome;
	},
	computed: {
		isStudent(){ return occupations.isStudent(this.occupation) },
		isUnemployed(){ return occupations.isUnemployed(this.occupation) },
		monthlyIncome(){ return this.yearlyIncome / 12 },

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
				currentInsurance: this.hasPublicHealthInsurance ? 'public' : null,
				hoursWorkedPerWeek: this.worksOver20HoursPerWeek ? 40 : 20,
				isEUCitizen: this.isEUCitizen,
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
			if(this.isEUCitizen !== undefined){
				facts.push(`I am ${this.isEUCitizen ? '' : 'not '}an EU citizen`);
			}
			if(this.isMarried !== undefined){
				facts.push(`I am ${this.isMarried ? '' : 'not '}married`);
			}

			if(this.childrenCount !== undefined){
				if(this.childrenCount === 0){
					facts.push(`I don't have children`);
				}
				else{
					facts.push(`I have ${this.childrenCount} ${this.childOrChildren}`);
				}
			}

			if(this.hasPublicHealthInsurance){
				facts.push(`I currently have public health insurance`);
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
			return `QUESTION:\n${this.question || 'not specified'}\n\nSUMMARY: ${this.personSummary || 'not specified'}`;
		},

		// Printed values
		salaryOrIncome(){ return occupations.isEmployed(this.occupation) ? 'Salary' : 'Income' },
		childOrChildren(){ return this.childrenCount === 1 ? 'child' : 'children' },
	},
	methods: {
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
			occupation ? this.nextStage() : this.goToStage('ask-a-broker');
		},

		// Insurance options
		selectInsuranceOption(option){
			if(option === 'broker'){
				this.goToStage('ask-a-broker');
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
							email: this.email,
							notes: this.caseNotes,
							referrer: getReferrer() || '',
							contact_method: this.contactMethod || 'EMAIL',
							insured_persons: [
								{
									first_name: this.fullName,
									income: this.yearlyIncome || null,
									occupation: this.occupation || '',
									age: this.age || null,
									is_married: this.isMarried,
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

			<progress v-if="stageIndex !== 0" aria-label="Form progress" :max="stages.length - 1" :value="stageIndex"></progress>

			<template v-if="stage === 'occupation'">
				<p><strong>Let's find the right health insurance.</strong> What is your occupation?</p>
				<ul class="buttons grid" aria-label="Occupations">
					<li>
						<button @click="selectOccupation('employee')">
							{% endraw %}{% include "_css/icons/job.svg" %}{% raw %}
							Employee
						</button>
					</li>
					<li>
						<button @click="selectOccupation('studentUnemployed')">
							{% endraw %}{% include "_css/icons/student.svg" %}{% raw %}
							Student
						</button>
					</li>
					<li>
						<button @click="selectOccupation('selfEmployed')">
							{% endraw %}{% include "_css/icons/business.svg" %}{% raw %}
							Self-employed
						</button>
					</li>
					<li>
						<button @click="selectOccupation('azubi')">
							{% endraw %}{% include "_css/icons/helper.svg" %}{% raw %}
							Apprentice
						</button>
					</li>
					<li>
						<button @click="selectOccupation('unemployed')">
							{% endraw %}{% include "_css/icons/visiting.svg" %}{% raw %}
							Unemployed
						</button>
					</li>
					<li>
						<button @click="selectOccupation(null)">
							{% endraw %}{% include "_css/icons/family.svg" %}{% raw %}
							It's complicated
						</button>
					</li>
				</ul>
			</template>

			<template v-if="stage === 'questions'">
				<h3>Tell us a bit more about you&hellip;</h3>
				<p>It helps us calculate prices and recommend the right health insurance.</p>
				<hr>
				<div class="form-group">
					<label :for="uid('isEUCitizen')">
						Nationality
					</label>
					<div class="input-group vertical">
						<label class="checkbox">
							<input type="checkbox" :id="uid('isEUCitizen')" v-model="isEUCitizen">
							<div>I am an <glossary term="European Union">EU</glossary> citizen</div>
						</label>
					</div>
				</div>
				<div class="form-group">
					<label :for="uid('age')">
						Age
					</label>
					<div class="input-group">
						<age-input :id="uid('age')" v-model="age"></age-input>
						years old
					</div>
				</div>
				<div class="form-group">
					<label :for="uid('isMarried')">
						Spouse
					</label>
					<div class="input-group vertical">
						<label class="checkbox">
							<input type="checkbox" :id="uid('isMarried')" v-model="isMarried">
							I am married
						</label>
					</div>
				</div>
				<div class="form-group">
					<label :for="uid('childrenCount')">
						Children
					</label>
					<div class="input-group">
						<select v-model="childrenCount" :id="uid('childrenCount')">
							<option :value="0">0</option>
							<option :value="1">1</option>
							<option :value="2">2</option>
							<option :value="3">3</option>
							<option :value="4">4</option>
							<option :value="5">5</option>
							<option :value="6">6</option>
						</select> {{ childOrChildren }}
					</div>
				</div>
				<div class="form-group" v-if="isStudent">
					<label :for="uid('studentOccupation')">
						Other occupation
					</label>
					<div class="input-group vertical">
						<label class="checkbox">
							<input type="radio" :name="uid('studentOccupation')" v-model="occupation" value="studentUnemployed" required>
							I am unemployed
						</label>
						<label class="checkbox">
							<input type="radio" :name="uid('studentOccupation')" v-model="occupation" value="studentEmployee" required>
							I have a job
						</label>
						<label class="checkbox">
							<input type="radio" :name="uid('studentOccupation')" v-model="occupation" value="studentSelfEmployed" required>
							I am self-employed
						</label>
					</div>
				</div>
				<div class="form-group" v-if="!isUnemployed">
					<label :for="uid('income')" v-text="salaryOrIncome"></label>
					<div class="input-group">
						<income-input :id="uid('income')" v-model="inputIncome"></income-input>&nbsp;€
						<button class="toggle" @click="useMonthlyIncome = !useMonthlyIncome">per {{ useMonthlyIncome ? 'month' : 'year' }}</button>
						<span class="no-mobile">before taxes</span>
					</div>
					<div class="input-group">
						<label class="checkbox" v-if="occupation === 'studentEmployee'">
							<input type="checkbox" v-model="worksOver20HoursPerWeek">
							I work more than 20 hours per week
						</label>
					</div>
				</div>
				<hr v-if="askForCurrentInsurance">
				<div class="form-group" v-if="askForCurrentInsurance">
					<label :for="uid('hasPublicHealthInsurance')">
						Current insurance
					</label>
					<div class="input-group vertical">
						<label class="checkbox">
							<input type="checkbox" :name="uid('hasPublicHealthInsurance')" v-model="hasPublicHealthInsurance">
							<div>
								I have public health insurance
							</div>
						</label>
						<span class="input-instructions">
							Select this if you had <glossary term="gesetzliche Krankenversicherung">public health insurance</glossary> in any <glossary term="European Union">EU</glossary> country for at least 2 of the past 5 years.
						</span>
					</div>
				</div>
				<template v-if="mode === 'question' && contactMethod !== 'WHATSAPP'">
					<hr>
					<div class="form-group">
						<label :for="uid('question')">
							Your question
						</label>
						<textarea :id="uid('question')" v-model="question" placeholder="How can Seamus help you?"></textarea>
					</div>
				</template>
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
						<button v-if="mode === 'calculator' && contactMethod === 'EMAIL'" class="button primary" @click="createCase" :disabled="isLoading" :class="{loading: isLoading}">
							Ask Seamus
						</button>
						<a v-if="mode === 'calculator' && contactMethod === 'WHATSAPP'" :href="whatsappUrl" @click="createCase" class="button whatsapp" target="_blank">
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

			<template v-if="stage === 'ask-a-broker'">
				<div class="form-recipient">
					<div>
						<p>Seamus will help you <strong>choose the right health insurance</strong>. I trust him because he is honest and knowledgeable.</p>
						<p>This service is <strong>100% free</strong>.</p>
					</div>
					<img
						srcset="/experts/photos/bioLarge1x/seamus-wolf.jpg, /experts/photos/bioLarge2x/seamus-wolf.jpg 2x"
						alt="Seamus Wolf, insurance broker" width="125" height="125"
						sizes="125px">
				</div>
				<hr>
				<div class="contact-method">
					<h3>How should we talk?</h3>
					<div class="tabs" aria-label="Preferred contact method">
						<input v-model="contactMethod" type="radio" :id="uid('contactMethodWhatsapp')" value="WHATSAPP">
						<label :for="uid('contactMethodWhatsapp')">WhatsApp</label>

						<input v-model="contactMethod" type="radio" :id="uid('contactMethodEmail')" value="EMAIL">
						<label :for="uid('contactMethodEmail')">Email</label>
					</div>
				</div>
				<template v-if="contactMethod">
					<hr>
					<div class="form-group required">
						<label :for="uid('fullName')">
							Name
						</label>
						<full-name-input :for="uid('fullName')" v-model="fullName" required></full-name-input>
					</div>
					<div class="form-group required">
						<label :for="uid('email')">
							Email address
						</label>
						<email-input v-model="email" :id="uid('email')" required></email-input>
						<details class="input-instructions" v-if="contactMethod === 'WHATSAPP'">
							<summary>Why we ask for your email</summary>
							<p>
								Seamus might send you documents and extra information. I will email you once to ask for your feedback. We do not send marketing emails.
							</p>
						</details>
					</div>
					<template v-if="mode === 'calculator' && contactMethod !== 'WHATSAPP'">
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
						<a v-if="mode === 'calculator' && contactMethod === 'WHATSAPP'" :href="whatsappUrl" @click="createCase" class="button whatsapp" target="_blank">
							{% endraw %}{% include "_css/icons/whatsapp.svg" %}{% raw %}
							<span class="only-mobile">Start chat</span>
							<span class="no-mobile">Chat with Seamus</span>
						</a>
					</div>
				</template>
			</template>

			<template v-if="stage === 'thank-you' || stage === 'error'">
				<p v-if="stage === 'thank-you'"><strong>Message sent!</strong> Seamus will contact you today or during the next business day.</p>
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