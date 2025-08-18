{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('email-input', {
	props: ['value'],
	template: `
		<input type="email"
			class="email-input"
			:value="value"
			v-on:input="$emit('input', $event.target.value)"
			placeholder="contact@example.com"
			autocomplete="email"
			title="Email address">
	`,
});
{% endraw %}{% endjs %}