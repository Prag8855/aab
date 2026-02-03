{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('gender-input', {
	props: {
		'value': String,
		'autocomplete': {
			type: String,
			default: 'off',  // honorific-prefix otherwise
		}
	},
	template: `
		<select class="gender-input" :value="value" :autocomplete="autocomplete" @input="$emit('input', $event.target.value)">
			<option value="man">Mister</option>
			<option value="woman">Madam</option>
			<option value="other">Other</option>
		</select>
	`,
});
{% endraw %}{% endjs %}