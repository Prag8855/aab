{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('city-input', {
	props: ['value'],
	template: `
		<input
			title="City"
			placeholder="Berlin"
			type="text"
			autocomplete="address-level2"
			:value="value"
			v-on:input="$emit('input', $event.target.value)">
	`,
});
{% endraw %}{% endjs %}