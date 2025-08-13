{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('first-name-input', {
	props: ['value'],
	template: `
		<input type="text"
			class="first-name-input"
			:value="value"
			v-on:input="$emit('input', $event.target.value)"
			placeholder="Alex"
			autocomplete="given-name"
			title="First name">
	`,
});
{% endraw %}{% endjs %}