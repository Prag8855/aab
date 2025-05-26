{% include '_js/constants.js' %}
{% include '_js/currency.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/age-input.js' %}
{% include '_js/vue/income-input.js' %}
{% include '_js/vue/occupation-input.js' %}
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
		desiredService: String,
		isMarried: Boolean,
	},
	data: function() {
		return {
			trackAs: 'Health insurance question',

			stage: 'contactInfo',

			question: '',
			fullName: userDefaults.fullName,
			email: userDefaults.email,
			phone: userDefaults.phone,
			contactMethod: null,

			showDetailsField: false,

			isLoading: false,
		};
	},
	computed: {
		whatSeamusWillDo(){
			return {
				barmer: 'He will get you insured with Barmer.',
				tk: 'He will get you insured with Techniker Krankenkasse.',
				public: 'He will help you choose the best public health insurance.',
				private: 'He will help you choose the best private health insurance.',
			}[this.desiredService] || 'He will help you choose the right health insurance.';
		},
		submitButtonText(){
			return ({
				barmer: 'Get insured',
				tk: 'Get insured',
				public: 'Get a recommendation',
				private: 'Get a quote',
			}[this.desiredService] || 'Send question') + ' <i class="icon right"></i>'
		},
		personSummary(){
			const facts = [];

			if(!this.occupation){ // "It's complicated" or direct contact form
				return;
			}

			if(this.age !== undefined){
				facts.push(`that you are ${this.age} years old`);
			}

			const cleanOccupation = {
				azubi: 'an apprentice',
				employee: 'employed',
				selfEmployed: 'self-employed',
				studentEmployee: 'a student',
				studentSelfEmployed: 'a self-employed student',
				studentUnemployed: 'an unemployed student',
				unemployed: 'unemployed',
			}[this.inputOccupation];
			if(cleanOccupation){
				facts.push(`that you are ${cleanOccupation}`);
			}
			if(this.income !== undefined){
				facts.push(`that you earn ${formatCurrency(this.income)} per year`);
			}
			if(this.isMarried !== undefined){
				facts.push(`that you are ${this.isMarried ? '' : 'not '}married`)
			}

			if(this.childrenCount !== undefined){
				if(this.childrenCount === 0){
					facts.push("that you don't have children");
				}
				else if(this.childrenCount === 1){
					facts.push("that you have a child");
				}
				else {
					facts.push(`that you have ${this.childrenCount} children`);
				}
			}

			if(facts.length === 0){
				return;
			}

			let summary = new Intl.ListFormat('en-US', {style: 'long', type: 'conjunction'}).format(facts) + '.';
			return 'We know ' + summary;
		},
		whatsappMessage(){
			return "Hi Seamus, I found you through All About Berlin. I need help with German health insurance."
		},
		whatsappUrl(){
			let url = 'https://wa.me/+491626969454';
			if(this.whatsappMessage){
				url += '?text=' + encodeURIComponent(this.whatsappMessage)
			}
			return url;
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
							income: this.income,
							occupation: this.occupation,
							age: this.age,
							question: this.question,
							is_married: !!this.isMarried,
							children_count: this.childrenCount,
							desired_service: this.desiredService
						}),
					}
				);
				this.isLoading = false;
				this.stage = response.ok ? 'thank-you' : 'error';
			}
		},
		trackWhatsapp() {
			plausible(this.trackAs, { props: { stage: 'whatsapp' }});
		}
	},
	template: `
		<div ref="collapsible" class="health-insurance-question">
			<template v-if="stage === 'contactInfo'">
				<div class="form-recipient">
					<div>
						<p><strong>Seamus Wolf</strong> is the insurance broker I trust. He is honest and knowledgeable. {{ whatSeamusWillDo }} This is a free service.</p>
					</div>
					<img
						srcset="/experts/photos/bioLarge1x/seamus-wolf.jpg, /experts/photos/bioLarge2x/seamus-wolf.jpg 2x"
						alt="Seamus Wolf, insurance broker" width="125" height="125"
						sizes="125px">
				</div>
				<hr>
				<h3 class="no-print">How should we talk?</h3>
				<div class="tabs no-print">
					<button @click="contactMethod = 'whatsapp'" tabindex="0" :disabled="contactMethod === 'whatsapp'">
						WhatsApp
					</button>
					<button @click="contactMethod = 'email'" tabindex="0" :disabled="contactMethod === 'email'">
						Email
					</button>
					<button @click="contactMethod = 'phone'" tabindex="0" :disabled="contactMethod === 'phone'">
						Phone
					</button>
				</div>
				<template v-if="contactMethod && contactMethod !== 'whatsapp'">
					<hr>
					<div class="form-group">
						<label :for="uid('name')">
							Name
						</label>
						<div class="input-group">
							<input v-model="fullName" type="text" :id="uid('name')" autocomplete="name">
							{% endraw %}{% include "_blocks/formHoneypot.html" %}{% raw %}
						</div>
					</div>
					<div class="form-group">
						<label :for="uid('question')">
							How can we help?
						</label>
						<textarea :id="uid('question')" v-model="question" placeholder="Tell us more about your situation"></textarea>
						<div v-if="personSummary" class="input-instructions" v-text="personSummary"></div>
					</div>
					<div class="form-group required" v-if="contactMethod === 'phone'">
						<label :for="uid('phone')">
							Your phone number
						</label>
						<input v-model="phone" type="tel" :id="uid('phone')" placeholder="+49..." autocomplete="tel" :aria-describedby="uid('instructions-phone')" required>
						<div class="input-instructions">
							Seamus' phone number is <a href="tel:+491626969454">+49&nbsp;162&nbsp;6969454</a>.
						</div>
					</div>
					<div class="form-group required" v-if="contactMethod === 'email'">
						<label :for="uid('email')">
							Email address
						</label>
						<input v-model="email" type="email" :id="uid('email')" required autocomplete="email">
					</div>
				</template>
				<hr v-if="contactMethod">
				<div class="buttons bar" v-if="contactMethod">
					<slot name="form-buttons"></slot>
					<button v-if="contactMethod !== 'whatsapp'" class="button primary no-print" @click="submitForm" :disabled="isLoading" :class="{loading: isLoading}" v-html="submitButtonText"></button>
					<a @click="trackWhatsapp" v-if="contactMethod === 'whatsapp'" class="button whatsapp no-print" :href="whatsappUrl" target="_blank">
						<svg width="25px" height="25px" fill="currentColor" viewBox="0 0 308 308"><path d="M227.9 176.98c-.6-.29-23.05-11.34-27.04-12.78a15.53 15.53 0 0 0-5.23-1.16c-3.03 0-5.58 1.51-7.56 4.48-2.25 3.34-9.04 11.27-11.13 13.64-.28.32-.65.7-.88.7-.2 0-3.67-1.44-4.72-1.9-24.1-10.46-42.37-35.62-44.88-39.86-.36-.61-.37-.89-.38-.89.1-.32.9-1.14 1.32-1.55a62.27 62.27 0 0 0 3.83-4.35c.6-.73 1.21-1.47 1.81-2.16a24.05 24.05 0 0 0 3.65-5.79l.5-1c2.35-4.66.34-8.6-.3-9.86-.53-1.06-10.02-23.95-11.02-26.35-2.43-5.8-5.63-8.5-10.08-8.5-.41 0 0 0-1.73.07-2.11.09-13.6 1.6-18.68 4.8C90 87.92 80.9 98.74 80.9 117.77c0 17.13 10.87 33.3 15.54 39.45l.63.93c17.88 26.1 40.16 45.44 62.75 54.47 21.74 8.68 32.04 9.69 37.9 9.69 2.45 0 4.42-.2 6.16-.37l1.1-.1c7.51-.67 24.02-9.22 27.78-19.66 2.95-8.22 3.73-17.2 1.77-20.46-1.35-2.21-3.68-3.33-6.62-4.74z"/><path d="M156.73 0C73.32 0 5.45 67.35 5.45 150.14c0 26.78 7.17 53 20.75 75.93l-26 76.65a4 4 0 0 0 5 5.1l79.92-25.4a152.3 152.3 0 0 0 71.6 17.85c83.41 0 151.27-67.35 151.27-150.13C308 67.35 240.14 0 156.73 0zm0 269c-23.53 0-46.33-6.8-65.93-19.66a4 4 0 0 0-3.4-.47L47.35 261.6l12.92-38.13a4 4 0 0 0-.56-3.65 117.23 117.23 0 0 1-22.81-69.68c0-65.54 53.75-118.86 119.82-118.86S276.55 84.6 276.55 150.14c0 65.54-53.75 118.85-119.82 118.85z"/></svg>
						Chat on WhatsApp
					</a>
				</div>
			</template>
			<template v-if="stage === 'thank-you'">
				<p><strong>Message sent!</strong> Seamus will contact you today or during the next business day.</p>
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