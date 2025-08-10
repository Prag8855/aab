{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('blank', {
	props: {
		placeholder: String,
		required: Boolean,  // Show in red if empty
	},
	computed: {
		content() {
			return this.$slots && this.$slots.default && this.$slots.default[0].text.trim();
		}
	},
	template: `<output :class="{placeholder: !content, error: required && !content}" :title="required && !content ? 'This information is required' : ''" v-html="content || placeholder"></output>`,
});
{% endraw %}{% endjs %}