{% include '_js/utils/date.js' %}
{% js %}{% raw %}
Vue.component('date-picker', {
	// Mimics the date-input behaviour: The value is always a valid date or an
	// empty string
	props: {
		value: String,
		required: Boolean,
		min: String, // "YYYY-MM-DD"
		max: String, // "YYYY-MM-DD"
	},
	mounted(){
		this.onOutsideValueChange();
	},
	methods: {
		onInput(e) {
			// Only emit the value if it's a valid date
			// Do not rely on $el.checkValidity() because the parent element can set it to false with setCustomValidity
			const parsedDate = dateFromString(this.$el.value);
			this.$emit('input', parsedDate ? isoDay(parsedDate) : '');
		},
		onBlur(){
			// In case the external value has changed while the input had focus
			this.$el.value = this.value;
		},
		onOutsideValueChange(){
			// Update the field value, but not if the user is currently editing the date
			if(document.activeElement !== this.$el){
				this.$el.value = dateFromString(this.value) ? this.value : '';
			}
		}
	},
	watch: {
		min() { this.onChange() },
		max() { this.onChange() },
		value() {
			this.onOutsideValueChange();
		}
	},
	template: `
		<input
			type="date"
			:class="{required: required}"
			@blur="onBlur"
			@input="onInput">
	`,
});
{% endraw %}{% endjs %}