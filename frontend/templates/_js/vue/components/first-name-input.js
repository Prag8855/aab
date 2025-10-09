{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('first-name-input', {
	props: ['value'],
	template: `
		<input type="text"
			class="first-name-input"
			placeholder="Alex"
			autocomplete="given-name"
			title="First name"
			:value="value"
			@input="$emit('input', $event.target.value)">
	`,
});
{% endraw %}{% endjs %}