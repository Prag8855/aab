{% include '_js/vue.js' %}
{% include '_js/vue/collapsible.js' %}
{% include '_js/vue/country-input.js' %}
{% include '_js/vue/date-picker.js' %}
{% include '_js/vue/email-input.js' %}
{% include '_js/vue/mixins/multiStageMixin.js' %}
{% include '_js/vue/mixins/residencePermitFeedbackMixin.js' %}
{% include '_js/vue/mixins/trackedStagesMixin.js' %}
{% include '_js/vue/mixins/uniqueIdsMixin.js' %}
{% include '_js/vue/mixins/userDefaultsMixin.js' %}
{% js %}{% raw %}
Vue.component('feedback-residence-permit', {
	props: {
		residencePermitType: {
			type: String,
			default: null,
		}
	},
	mixins: [residencePermitFeedbackMixin, userDefaultsMixin, uniqueIdsMixin, multiStageMixin, trackedStagesMixin],
	data() {
		return {
			showResidencePermitField: true,
			isLoading: false,

			// The primary key of the Feedback item, plus a two-letter prefix denoting the residencePermitType
			modificationKey: userDefaults.modificationKey,

			notes: '',
			email: userDefaults.email,

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
				pickup: {
					dateFieldTitle: "Pick-up date",
					completed: null,
					date: null,
				},
			},

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
		// The residence permit type can be pre-selected with the data-type attribute
		if(this.$el.dataset.type){
			this.showResidencePermitField = false;
			this.residencePermitType = this.$el.dataset.type;
		}

		// Load the key from the URL hash
		const keyFromHash = (new URLSearchParams(window.location.hash.substring(1))).get('feedbackKey');
		if(keyFromHash){
			this.modificationKey = keyFromHash;
			history.replaceState(null, null, ' '); // Remove the hash
		}

		// Set the residencePermitType from the modificationKey, but don't override a hard-coded type
		if(this.modificationKey && !this.residencePermitType){
			this.residencePermitType = this.modificationKey.split('~')[1];
		}

		if(this.modificationKey && this.modificationKeyMatchesResidencePermitType){
			const response = await fetch(this.apiEndpoint);
			if(!response.ok){
				this.modificationKey = null;
				return;
			}
			responseJson = await response.json();

			this.steps.application.date = responseJson.application_date;
			this.steps.application.completed = !!responseJson.application_date;

			this.steps.response.date = responseJson.first_response_date;
			this.steps.response.completed = !!responseJson.first_response_date;

			this.steps.appointment.date = responseJson.appointment_date;
			this.steps.appointment.completed = !!responseJson.appointment_date;

			this.steps.pickup.date = responseJson.pick_up_date;
			this.steps.pickup.completed = !!responseJson.pick_up_date;

			this.email = responseJson.email || this.email;
			this.department = responseJson.department;
			this.notes = responseJson.notes;
		}
	},
	computed: {
		modificationKeyMatchesResidencePermitType(){
			return (
				this.residencePermitType
				&& this.modificationKey
				&& this.modificationKey.endsWith(this.residencePermitType)
			);
		},
		apiEndpoint(){
			if(this.modificationKeyMatchesResidencePermitType){
				return `/api/forms/residence-permit-feedback/${this.modificationKey.split('~')[0]}`
			}
			return '/api/forms/residence-permit-feedback';
		},
		trackAs(){
			return `Feedback (${this.residencePermitType})`;
		},
		ariaLabel(){
			return `Feedback form: ${this.residencePermitName} processing time`;
		},
		residencePermitName(){
			const rp = this.residencePermitTypes[this.residencePermitType];
			return rp ? rp.normal : "residence permit";
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
						method: this.modificationKeyMatchesResidencePermitType ? 'PUT' : 'POST',
						keepalive: true,
						headers: {'Content-Type': 'application/json; charset=utf-8',},
						body: JSON.stringify({
							application_date: this.steps.application.date,
							appointment_date: (this.steps.appointment.completed ? this.steps.appointment.date : null),
							email: emailAddress,
							first_response_date: (this.steps.response.completed ? this.steps.response.date : null),
							department: this.department,
							notes: this.notes,
							pick_up_date: (this.steps.pickup.completed ? this.steps.pickup.date : null),
							residence_permit_type: this.residencePermitType,
						}),
					}
				);
				this.isLoading = false;
				if(response.ok){
					this.nextStage();
					const responseJson = await response.json();
					
					// No need to modify complete feedback, so the key gets cleared
					this.modificationKey = this.feedbackComplete ? null : `${responseJson.modification_key}~${this.residencePermitType}`;
				}
				else{
					this.goToStage('error');
				}
			}
		},
		stepName(key){
			return {
				application: "I have applied in Berlin",
				response: "The Ausländerbehörde has replied",
				appointment: "I got an appointment",
				pickup: `I got my ${this.residencePermitName}`,
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
				How is your <span class="no-mobile">{{ residencePermitName }}</span> application going?
			</template>
			<template v-if="stage === 'start'">
				<div class="steps">
					<div class="step" v-for="(step, key, index) in steps" :key="key">
						<input :id="uid('checkbox' + key)" type="checkbox" v-model="step.completed" @change="onStepCompletionChange(key)">
						<label :for="uid('checkbox' + key)" class="description" v-text="stepName(key)"></label>
						<div class="duration form-group required" v-if="step.completed">
							<label :for="uid(key) + '-date-day'" v-text="step.dateFieldTitle"></label>
							<date-picker :min="minimumStepDate(step)" v-model="step.date" :id="uid(key) + '-date'" required></date-picker>
						</div>
					</div>
				</div>
				<template v-if="!showRestOfForm">
					<hr>
					<div class="icon-paragraph">
						{% endraw %}{% include "_css/icons/helper.svg" %}{% raw %}
						<div>
							<p>
								Your feedback helps others plan their {{ residencePermitName }} application.
							</p>
							<p>
								<strong><a class="internal-link" target="_blank" href="/guides/auslanderbehorde-wait-times">See other people's feedback</a></strong>
							</p>
						</div>
					</div>
				</template>
				<template v-if="showRestOfForm">
					<hr>
					<div class="form-group required" v-if="showResidencePermitField">
						<label :for="uid('residencePermitType')">Residence permit</label>
						<select :id="uid('residencePermitType')" v-model="residencePermitType" :class="{placeholder: !residencePermitType}" required>
							<option disabled hidden default :value="null">Choose a residence permit</option>
							<option v-for="(name, key) in residencePermitTypes" :key="key" :value="key" v-text="name.capitalized"></option>
						</select>
						<span class="input-instructions">
							Which residence permit did you apply for?
						</span>
					</div>
					<div class="form-group required">
						<label :for="uid('department')">Department</label>
						<select :id="uid('department')" v-model="department" :class="{placeholder: !department}" required>
							<option disabled hidden default :value="null">Choose a department</option>
							<option v-for="(name, key) in departments" :value="key" :key="key" v-text="name"></option>
						</select>
						<span class="input-instructions">
							<a target="_blank" href="/guides/immigration-office#departments">Find your Ausländerbehörde department.</a> Don't choose a random department.
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
				<p>Can you complete your feedback when you get your {{ residencePermitName }}? I can remind you by email.</p>
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
						@click="submitFeedback">{{ modificationKeyMatchesResidencePermitType ? 'Update' : 'Send' }} feedback</button>
					<button class="button primary" v-if="stage === 'email'" @click="submitFeedback">Remind me</button>
				</div>
			</template>
		</collapsible>
	`
});
{% endraw %}{% endjs %}