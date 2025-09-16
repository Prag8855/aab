{% include '_js/vue.js' %}
{% include '_js/vue/components/collapsible.js' %}
{% include '_js/vue/components/date-input.js' %}
{% include '_js/vue/components/email-input.js' %}
{% include '_js/vue/mixins/multiStageMixin.js' %}
{% include '_js/vue/mixins/trackedStagesMixin.js' %}
{% include '_js/vue/mixins/uniqueIdsMixin.js' %}
{% include '_js/vue/mixins/userDefaultsMixin.js' %}
{% js %}{% raw %}
Vue.component('feedback-citizenship', {
	mixins: [userDefaultsMixin, uniqueIdsMixin, multiStageMixin, trackedStagesMixin],
	data() {
		return {
			isLoading: false,

			citizenshipModificationKey: userDefaults.empty,

			notes: '',
			email: userDefaults.empty,

			steps: {
				application: {
					dateFieldTitle: "Application date",
					completed: null,
					date: null,
				},
				response: {
					dateFieldTitle: "First response date",
					completed: null,
					date: null,
				},
				appointment: {
					dateFieldTitle: "Appointment date",
					completed: null,
					date: null,
				},
			},

			departments: {
				S1: 'S1 — Iran, Syria (last names from A to E)',
				S2: 'S2 — Irak, Syria (last names from F to Z)',
				S3: 'S3 — Asia',
				S4: 'S4 — Africa, America, Australia, Oceania',
				S5: 'S5 — Poland, Turkey, Ukraine',
				S6: 'S6 — Europe',
			},

			trackAs: 'Feedback (citizenship)',
			stages: [
				'start',
				'email',
				'finish',
				'error',
			],
			inputsToFocus: {
				email: () => this.$refs.emailInput.$el,
			},
		};
	},
	async mounted(){
		// Load the key from the URL hash
		const keyFromHash = (new URLSearchParams(window.location.hash.substring(1))).get('feedbackKey');
		if(keyFromHash){
			this.citizenshipModificationKey = keyFromHash;
			history.replaceState(null, null, ' '); // Remove the hash
		}

		if(this.citizenshipModificationKey){
			const response = await fetch(this.apiEndpoint);
			if(!response.ok){
				this.citizenshipModificationKey = null;
				return;
			}
			responseJson = await response.json();

			this.steps.application.date = responseJson.application_date;
			this.steps.application.completed = !!responseJson.application_date;

			this.steps.response.date = responseJson.first_response_date;
			this.steps.response.completed = !!responseJson.first_response_date;

			this.steps.appointment.date = responseJson.appointment_date;
			this.steps.appointment.completed = !!responseJson.appointment_date;

			this.email = responseJson.email || this.email;
			this.notes = responseJson.notes;
		}
	},
	computed: {
		apiEndpoint(){
			if(this.citizenshipModificationKey){
				return `/api/forms/citizenship-feedback/${this.citizenshipModificationKey}`
			}
			return '/api/forms/citizenship-feedback';
		},
		ariaLabel(){
			return `Feedback form: Citizenship processing time`;
		},
		showRestOfForm(){
			return this.steps.application.completed;
		},
		feedbackComplete(){
			return Object.values(this.steps).every(s => s.completed);
		},
	},
	methods: {
		async nextStage(){
			if(validateForm(this.$el)){
				if(this.stage === 'start'){
					this.goToStage(this.feedbackComplete ? 'finish' : 'email');
				}
				else{
					this.goToStage('finish');
				}
			}
		},
		onStepCompletionChange(key){
			const changedStepIndex = Object.keys(this.steps).indexOf(key);
			Object.values(this.steps).forEach((step, index) => {
				// Tick all previous steps
				if(index < changedStepIndex && this.steps[key].completed){
					step.completed = true;
				}

				// Untick all following steps
				if(index > changedStepIndex && !this.steps[key].completed){
					step.completed = false;
				}
			})
		},
		async submitFeedback(){
			if(validateForm(this.$el)){
				this.isLoading = true;

				// Don't set the email before the email stage, even if it's not empty
				const emailAddress = (this.stage === 'email' && this.email) ? this.email : null;

				const response = await fetch(
					this.apiEndpoint,
					{
						method: this.citizenshipModificationKey ? 'PUT' : 'POST',
						keepalive: true,
						headers: {'Content-Type': 'application/json; charset=utf-8',},
						body: JSON.stringify({
							application_date: this.steps.application.date,
							appointment_date: (this.steps.appointment.completed ? this.steps.appointment.date : null),
							email: emailAddress,
							first_response_date: (this.steps.response.completed ? this.steps.response.date : null),
							notes: this.notes,
						}),
					}
				);
				this.isLoading = false;
				if(response.ok){
					this.nextStage();
					const responseJson = await response.json();
					
					// No need to modify complete feedback, so the key gets cleared
					this.citizenshipModificationKey = this.feedbackComplete ? null : responseJson.modification_key;
				}
				else{
					this.goToStage('error');
				}
			}
		},
		stepName(key){
			return {
				application: "I have applied in Berlin",
				response: "I got a reply",
				appointment: "I got an appointment",
			}[key];
		},
		minimumStepDate(step){
			const stepList = Object.values(this.steps);
			const previousStep = stepList[stepList.indexOf(step) - 1];
			return previousStep ? previousStep.date : null;
		},
	},
	template: `
		<collapsible class="feedback-form" :aria-label="ariaLabel">
			<template v-slot:header>
				How is your <span class="no-mobile">citizenship</span> application going?
			</template>
			<template v-if="stage === 'start'">
				<div class="steps">
					<div class="step" v-for="(step, key, index) in steps" :key="key">
						<input :id="uid('checkbox' + key)" type="checkbox" v-model="step.completed" @change="onStepCompletionChange(key)">
						<label :for="uid('checkbox' + key)" class="description" v-text="stepName(key)"></label>
						<div class="duration form-group" v-if="step.completed">
							<label :for="uid(key) + '-date-day'" v-text="step.dateFieldTitle"></label>
							<date-input :min="minimumStepDate(step)" v-model="step.date" :id="uid(key) + '-date'" required></date-input>
						</div>
					</div>
				</div>
				<template v-if="!showRestOfForm">
					<hr>
					<div class="icon-paragraph">
						{% endraw %}{% include "_css/icons/helper.svg" %}{% raw %}
						<div>
							<p>
								Your feedback helps others plan their citizenship application.
							</p>
							<p>
								<strong><a class="internal-link" target="_blank" href="/guides/citizenship-wait-times">See other people's feedback</a></strong>
							</p>
						</div>
					</div>
				</template>
				<template v-if="showRestOfForm">
					<hr>
					<div class="form-group">
						<label :for="uid('department')">Department</label>
						<select :id="uid('department')" v-model="department" :class="{placeholder: !department}" required>
							<option disabled hidden default :value="null">Choose a department</option>
							<option v-for="(name, key) in departments" :value="key" :key="key" v-text="name"></option>
						</select>
						<span class="input-instructions">
							<a target="_blank" href="/guides/immigration-office#departments">Find the correct department.</a> Don't choose a random department.
						</span>
					</div>
					<div class="form-group optional">
						<label :for="uid('notes')">Notes and advice</label>
						<textarea placeholder=" " v-model="notes" :id="uid('notes')"></textarea>
						<span class="input-instructions">Add information about your situation and give advice to other people. Do not ask questions here.</span>
					</div>
				</template>
			</template>
			<template v-if="stage === 'email'">
				<p><strong>Thank you for your feedback!</strong> It will help a lot of people.</p>
				<p>Can you complete your feedback when you get your citizenship? I can remind you by email.</p>
				<div class="form-group">
					<label :for="uid('email')">Email address</label>
					<email-input ref="emailInput" v-model="email" :id="uid('email')" required></email-input>
					<span class="input-instructions">You will get a reminder in 2 months and in 6 months. Nothing else.</span>
				</div>
			</template>
			<template v-if="stage === 'finish'">
				<p><strong>Thank you for your feedback!</strong> This information will help a lot of people.</p>
				<p>If this tool helped you, consider <a href="/donate" target="_blank" title="Donate to All About Berlin">donating €10</a> to support my work.</p>
			</template>
			<template v-if="stage === 'error'">
				<p><strong>An error occured.</strong> If this keeps happening, <a target="_blank" href="/contact">contact me</a>.</p>
			</template>
			<template v-if="showRestOfForm && stage !== 'finish'">
				<hr>
				<div class="buttons bar" v-if="showRestOfForm && stage !== 'finish'">
					<button v-if="stage === 'email' || stage === 'error'" class="button" @click="goToStage('start')"><i class="icon left" aria-hidden="true"></i> Go back</button>
					<button
						class="button primary"
						v-if="stage === 'start'"
						:disabled="isLoading"
						:class="{loading: isLoading}"
						@click="submitFeedback">{{ citizenshipModificationKey ? 'Update' : 'Send' }} feedback</button>
					<button class="button primary" v-if="stage === 'email'" @click="submitFeedback">Remind me</button>
				</div>
			</template>
		</collapsible>
	`
});
{% endraw %}{% endjs %}