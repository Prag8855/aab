{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('postalcode-input', {
	props: ['value'],
	template: `
		<input
			class="postalcode-input"
			v-model="newPostCode"
			placeholder="12345"
			type="text"
			inputmode="numeric"
			pattern="[0-9]{5}"
			minlength="5"
			maxlength="5"
			autocomplete="postal-code"
			:value="value"
			title="Postal code (Postleitzahl)"
			v-on:input="$emit('input', $event.target.value)">
	`,
});
{% endraw %}{% endjs %}