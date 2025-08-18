{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('full-name-input', {
	props: ['value'],
	template: `
		<input type="text"
			class="full-name-input"
			:value="value"
			v-on:input="$emit('input', $event.target.value)"
			placeholder="Alex Smith"
			autocomplete="name"
			title="Full name">
	`,
});
{% endraw %}{% endjs %}