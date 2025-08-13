{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('last-name-input', {
	props: ['value'],
	template: `
		<input type="text"
			class="last-name-input"
			:value="value"
			v-on:input="$emit('input', $event.target.value)"
			placeholder="Smith"
			autocomplete="family-name"
			title="Last name">
	`,
});
{% endraw %}{% endjs %}