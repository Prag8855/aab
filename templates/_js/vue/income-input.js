{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('income-input', {
	props: ['value'],
	methods: {
		parsedValue(val) {
			let parsed = parseFloat(val);
			return isNaN(parsed) ? val : parsed;
		}
	},
	template: `
		<input class="income-input"
			type="number"
			inputmode="numeric"
			pattern="[0-9]*"
			placeholder="0"
			min="0"
			step="1"
			:value="value"
			v-on:input="$emit('input', parsedValue($event.target.value))">
	`,
});
{% endraw %}{% endjs %}