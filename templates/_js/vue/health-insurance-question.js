{% include '_js/constants.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/age-input.js' %}
{% include '_js/vue/eur.js' %}
{% include '_js/vue/glossary.js' %}
{% include '_js/vue/mixins/trackedStagesMixin.js' %}
{% include '_js/vue/mixins/uniqueIdsMixin.js' %}
{% include '_js/vue/mixins/userDefaultsMixin.js' %}
{% js %}{% raw %}
Vue.component('health-insurance-question', {
	mixins: [userDefaultsMixin, uniqueIdsMixin, trackedStagesMixin],
	props: {
		occupation: String,
		age: Number,
		income: Number,
		childrenCount: Number,
		preference: String,
	},
	data: function() {
		return {
			trackAs: 'Health insurance question',

			stage: 'contactInfo',
			minFreiwilligMonthlyIncome: healthInsurance.minFreiwilligMonthlyIncome * 12,

			question: '',
			fullName: userDefaults.fullName,
			email: userDefaults.email,
			phone: userDefaults.phone,
			contactMethod: 'email',

			inputAge: this.age,
			inputOccupation: this.occupation,
			incomeOverLimit: this.income >= (healthInsurance.minFreiwilligMonthlyIncome * 12),

			isLoading: false,
		};
	},
	computed: {
		whatSeamusWillDo(){
			return {
				'barmer': 'He will get you insured with Barmer.',
				'tk': 'He will get you insured with Techniker Krankenkasse.',
				'public': 'He will help you choose the best public health insurance.',
				'private': 'He will help you choose the best private health insurance.',
			}[this.preference] || 'He will help you choose health insurance.';
		}
	},
	methods: {
		async submitForm() {
			if(validateForm(this.$refs.collapsible)) {
				this.isLoading = true;
				const response = await fetch(
					'/api/forms/health-insurance-question',
					{
						method: 'POST',
						keepalive: true,
						headers: {'Content-Type': 'application/json; charset=utf-8',},
						body: JSON.stringify({
							name: this.fullName,
							email: this.email,
							phone: this.phone || '',
							income_over_limit: this.incomeOverLimit,
							occupation: this.inputOccupation,
							age: this.inputAge,
							question: this.question,
						}),
					}
				);
				this.isLoading = false;
				this.stage = response.ok ? 'thank-you' : 'error';
			}
		},
	},
	template: `
		<div ref="collapsible" class="health-insurance-question">
			<template v-if="stage === 'contactInfo'">
				<div class="form-recipient">
					<img
						srcset="/experts/photos/bioLarge1x/dr-rob-schumacher-feather-insurance.jpg, /experts/photos/bioLarge2x/dr-rob-schumacher-feather-insurance.jpg 2x"
						alt="Seamus Wolf, insurance broker" width="125" height="125"
						sizes="125px">
					<p><strong>Seamus Wolf</strong> is our insurance expert. I chose him for his knowledge and honesty. {{ whatSeamusWillDo }}</p>
				</div>
				<hr>
				<h3>How can we help you?</h3>
				<div class="form-group">
					<span class="label">About you</span>
					<div class="input-group">
						Employee, married, 2 children, 45,000€ per year salary.
					</div>
				</div>
				<div class="form-group required">
					<label :for="uid('question')">Your question</label>
					<div class="input-group">
						<textarea v-model="question" :id="uid('question')" required placeholder=" "></textarea>
						<span class="input-instructions">If you are applying for a <glossary term="Aufenthaltstitel">residence permit</glossary>, mention it.</span>
					</div>
				</div>
				<hr>
				<div class="form-group" v-if="!occupation">
					<span class="label">Your occupation</span>
					<select v-model="inputOccupation">
						<option value="employee">Employee</option>
						<option value="selfEmployed">Self-employed</option>
						<option value="student">Student</option>
						<option value="other">Other</option>
					</select>
				</div>
				<div class="form-group" v-if="income === undefined">
					<span class="label"></span>
					<div class="input-group">
						<label class="checkbox">
							<input type="checkbox" v-model="incomeOverLimit"> <span>I earn more than <eur :amount="minFreiwilligMonthlyIncome"></eur> per year</span>
						</label>
					</div>
				</div>
				<hr v-if="income === undefined && !occupation">
				<div class="form-group required">
					<label :for="uid('name')">
						Name
					</label>
					<div class="input-group">
						<input v-model="fullName" type="text" :id="uid('name')" required autocomplete="name">
						{% endraw %}{% include "_blocks/formHoneypot.html" %}{% raw %}
					</div>
				</div>
				<div class="form-group">
					<span class="label">Contact method</span>
					<div class="tabs">
						<button @click="contactMethod = 'email'" tabindex="0" :disabled="contactMethod === 'email'">
							Email
						</button>
						<button @click="contactMethod = 'whatsapp'" tabindex="0" :disabled="contactMethod === 'whatsapp'">
							WhatsApp
						</button>
						<button @click="contactMethod = 'phone'" tabindex="0" :disabled="contactMethod === 'phone'">
							Phone
						</button>
					</div>
				</div>
				<div class="form-group required" v-if="contactMethod === 'phone' || contactMethod === 'whatsapp'">
					<label :for="uid('phone')">
						{{ contactMethod === 'whatsapp' ? 'WhatsApp' : 'Phone' }} number
					</label>
					<input v-model="phone" type="tel" :id="uid('phone')" placeholder="+49..." autocomplete="tel" :aria-describedby="uid('instructions-phone')" required>
				</div>
				<div class="form-group required" v-if="contactMethod === 'email'">
					<label :for="uid('email')">
						Email address
					</label>
					<input v-model="email" type="email" :id="uid('email')" required autocomplete="email">
				</div>
				<hr>
				<div class="form-group required" v-if="!age">
					<label :for="uid('age')">
						Age
					</label>
					<label class="input-group">
						<age-input v-model="inputAge" :id="uid('age')" required :aria-describedby="uid('instructions-age')"></age-input>
						years old
						<span class="input-instructions" :id="uid('instructions-age')">Your age affects your health insurance options.</span>
					</label>
				</div>
				<div class="buttons bar">
					<slot name="form-buttons"></slot>
					<button class="button primary no-print" @click="submitForm" :disabled="isLoading" :class="{loading: isLoading}">Send question</button>
				</div>
			</template>
			<template v-if="stage === 'thank-you'">
				<p><strong>Message sent!</strong> We will contact you today or during the next business day.</p>
				<slot name="after-confirmation"></slot>
			</template>
			<template v-if="stage === 'error'">
				<p><strong>An error occured</strong> while sending your question. If this keeps happening, <a target="_blank" href="/contact">contact me</a>.</p>
				<slot name="after-confirmation"></slot>
			</template>
		</div>
	`,
});
{% endraw %}{% endjs %}