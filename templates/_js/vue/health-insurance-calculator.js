{% include '_js/constants.js' %}
{% include '_js/currency.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/collapsible.js' %}
{% include '_js/vue/glossary.js' %}
{% include '_js/vue/age-input.js' %}
{% include '_js/vue/first-name-input.js' %}
{% include '_js/vue/income-input.js' %}
{% include '_js/vue/health-insurance-options.js' %}
{% include '_js/vue/last-name-input.js' %}
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
			currentInsurance: null,

			// Contact form
			contactMethod: null,
			firstName: '',
			lastName: '',
			email: userDefaults.email,
			question: '',
			isLoading: false,

			// Component settings
			trackAs: `Health insurance ${this.mode}`,
			stages: [
				'start',
				'questions',
				'options',
				'askABroker',
			],
			inputsToFocus: {}, // TODO

			pflegeversicherung,
			healthInsurance,

			// TODO: "We already know that..." replacement
			// TODO: Move occupations from constants.js to another file
			// TODO: Set inputsToFocus
			// TODO: Rename 'start' stage to 'occupation'
			// TODO: Test collapsible header text
			// TODO: Length of progress bar changes depending on mode
			// TODO: askForCurrentInsurance: run two calculations and see if they differ. No business logic there.
			// TODO: Set submit button text based on purpose ("Ask Seamus")
			// TODO: .health-insurance-question is gone. Fix the CSS.
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
				currentInsurance: this.currentInsurance,
				hoursWorkedPerWeek: this.worksOver20HoursPerWeek ? 40 : 20,
				isEUCitizen: this.isEUCitizen,
				isMarried: this.isMarried,
				monthlyIncome: this.monthlyIncome,
				occupation: this.occupation,
				customZusatzbeitrag: null,
			};
		},

		// Contact form
		whatsappMessage(){ return `Hi Seamus, can you ${this.whatSeamusWillDo(true)}? ${this.personSummary(true) || ''}` },
		whatsappUrl(){
			let url = 'https://wa.me/+491626969454';
			if(this.whatsappMessage){
				url += '?text=' + encodeURIComponent(this.whatsappMessage)
			}
			return url;
		},

		// Printed values
		salaryOrIncome(){ return occupations.isEmployed(this.occupation) ? 'Salary' : 'Income' },
		childOrChildren(){ return this.childrenCount === 1 ? 'child' : 'children' },
	},
	methods: {
		previousStage(){
			// If "it's complicated" is chosen, skip the questions stage on the way back
			this.stageIndex = this.occupation ? this.stageIndex - 1 : 0;
		},

		// Insurance questions
		selectOccupation(occupation){
			this.occupation = occupation;
			occupation ? this.nextStage() : this.goToStage('askABroker');
		},

		// Insurance options
		selectInsuranceOption(option){
			if(option === 'broker'){
				this.goToStage('askABroker')
			}
		},

		// Contact form
		trackWhatsapp(){
			plausible(this.trackAs, { props: { stage: 'whatsapp', pageSection: getNearestHeadingId(this.$el) }});
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
				<template v-if="mode === 'question'">Ask my<span class="no-mobile"> health</span> insurance expert</template>
				<template v-else>Health insurance calculator</template>
			</template>

			<progress v-if="stage !== 'start'" aria-label="Form progress" :max="stages.length - 1" :value="stageIndex"></progress>

			<template v-if="stage === 'start'">
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
					<span class="label">
						Current insurance
					</span>
					<div class="input-group vertical">
						<label class="checkbox">
							<input type="radio" :name="uid('currentInsurance')" v-model="currentInsurance" :value="null" required>
							No health insurance
						</label>
						<label class="checkbox">
							<input type="radio" :name="uid('currentInsurance')" v-model="currentInsurance" value="public" required>
							<div><glossary term="gesetzliche Krankenversicherung">Public health insurance</glossary></div>
						</label>
						<label class="checkbox">
							<input type="radio" :name="uid('currentInsurance')" v-model="currentInsurance" value="private" required>
							<div><glossary term="private Krankenversicherung">Private health insurance</glossary></div>
						</label>
						<label class="checkbox">
							<input type="radio" :name="uid('currentInsurance')" v-model="currentInsurance" value="expat" required :disabled="isEUCitizen">
							<div>Travel or <glossary term="Expat health insurance">expat health insurance</glossary></div>
						</label>
					</div>
				</div>
				<hr>
				<div class="buttons bar">
					<button aria-label="Go back" class="button" @click="goToStage('start')">
						<i class="icon left" aria-hidden="true"></i> <span class="no-mobile">Go back</span>
					</button>
					<button class="button primary" @click="nextStage()">
						See options <i class="icon right" aria-hidden="true"></i>
					</button>
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

			<template v-if="stage === 'contactInfo'">
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
				<h3 class="no-print">How should we talk?</h3>
				<div class="tabs" aria-label="Preferred contact method">
					<input v-model="contactMethod" type="radio" :id="uid('contactMethodWhatsapp')" value="whatsapp">
					<label :for="uid('contactMethodWhatsapp')">WhatsApp</label>

					<input v-model="contactMethod" type="radio" :id="uid('contactMethodEmail')" value="email">
					<label :for="uid('contactMethodEmail')">Email</label>
				</div>
				<template v-if="contactMethod && contactMethod !== 'whatsapp'">
					<hr>
					<div class="form-group required">
						<label :for="uid('firstName')">
							First and last name
						</label>
						<div class="input-group">
							<first-name-input :id="uid('firstName')" v-model="firstName" required></first-name-input>
							<last-name-input :id="uid('lastName')" v-model="lastName"></last-name-input>
							{% endraw %}{% include "_blocks/formHoneypot.html" %}{% raw %}
						</div>
					</div>
					<div class="form-group required" v-if="contactMethod === 'email'">
						<label :for="uid('email')">
							Email address
						</label>
						<input v-model="email" type="email" :id="uid('email')" required autocomplete="email">
					</div>
					<div class="form-group">
						<label :for="uid('question')">
							How can we help?
						</label>
						<textarea :id="uid('question')" v-model="question" placeholder="Tell us about your situation"></textarea>
					</div>
				</template>
				<hr v-if="contactMethod || $slots['form-buttons']">
				<div class="buttons bar" v-if="contactMethod || $slots['form-buttons']">
					<button aria-label="Go back" class="button" @click="previousStage()">
						<i class="icon left" aria-hidden="true"></i> <span class="no-mobile">Go back</span>
					</button>
					<button v-if="contactMethod === 'email'" class="button primary no-print" @click="createCase" :disabled="isLoading" :class="{loading: isLoading}">
						Ask Seamus
					</button>
					<a @click="trackWhatsapp" v-if="contactMethod === 'whatsapp'" class="button whatsapp no-print" :href="whatsappUrl" target="_blank">
						{% endraw %}{% include "_css/icons/whatsapp.svg" %}{% raw %}
						<span class="only-mobile">Start chat</span>
						<span class="no-mobile">Chat with Seamus</span>						
					</a>
				</div>
			</template>

			<template v-if="stage === 'thank-you'">
				<p><strong>Message sent!</strong> Seamus will contact you today or during the next business day.</p>
				<div class="buttons bar">
					<button aria-label="Go back" class="button" @click="goToStage('start')">
						<i class="icon left" aria-hidden="true"></i> Go back
					</button>
				</div>
			</template>

			<template v-if="stage === 'error'">
				<p><strong>An error occured</strong> while sending your question. If this keeps happening, <a target="_blank" href="/contact">contact me</a>.</p>
				<div class="buttons bar">
					<button aria-label="Go back" class="button" @click="goToStage('start')">
						<i class="icon left" aria-hidden="true"></i> Go back
					</button>
				</div>
			</template>
		</collapsible>
	`,
});

document.querySelectorAll('health-insurance-calculator').forEach(el => new Vue({ el }));
{% endraw %}{% endjs %}