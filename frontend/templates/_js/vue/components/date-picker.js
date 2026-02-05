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
			// Only emit the value if it's a valid date
			// Do not rely on $el.checkValidity() because the parent element can set it to false with setCustomValidity
			const parsedDate = dateFromString(e.target.value);
			this.$emit('input', parsedDate ? isoDay(parsedDate) : '');
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