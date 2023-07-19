{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('age-input', {
	props: ['value'],
	methods: {
		parsedValue(val) {
			let parsed = parseFloat(val);
			return isNaN(parsed) ? val : parsed;
		}
	},
	template: `
		<input class="age-input"
			type="number"
			inputmode="numeric"
			pattern="[0-9]*"
			placeholder="18"
			min="1"
			step="1"
			:value.number="value"
			v-on:input="$emit('input', parsedValue($event.target.value))"
			@focus="$event.target.select()">
	`,
});
{% endraw %}{% endjs %}