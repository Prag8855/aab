{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('blank', {
	props: {
		placeholder: String,
	},
	template: `<output :class="{'placeholder': !$slots.default[0].text.trim()}" v-html="$slots.default[0].text.trim() || placeholder"></output>`,
});
{% endraw %}{% endjs %}