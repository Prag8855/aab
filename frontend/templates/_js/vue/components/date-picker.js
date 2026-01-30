{% include '_js/utils/date.js' %}
{% js %}{% raw %}
Vue.component('date-picker', {
	// Mimics the date-input behaviour: The value is always a valid date or an
	// empty string
	props: {
		value: String,
		required: Boolean,
	},
	watch: {
		value() {
			// Update the field value, but not if the user is currently editing the date
			if(document.activeElement !== this.$el){
				this.$el.value = dateFromString(this.value) ? this.value : '';
			}
		},
	},
	methods: {
		onInput(e) {
			this.$emit('input', this.$el.checkValidity() ? this.$el.value : '');
		},
	},
	template: `
		<input
			type="date"
			:class="{required: required}"
			@input="onInput">
	`,
});
{% endraw %}{% endjs %}