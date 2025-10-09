{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('full-name-input', {
	props: ['value'],
	template: `
		<input type="text"
			class="full-name-input"
			placeholder="Alex Smith"
			autocomplete="name"
			title="Full name"
			:value="value"
			@input="$emit('input', $event.target.value)">
	`,
});
{% endraw %}{% endjs %}