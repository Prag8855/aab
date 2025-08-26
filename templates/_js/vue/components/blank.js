{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('blank', {
	props: {
		placeholder: String,
	},
	computed: {
		content() {
			return this.$slots && this.$slots.default && this.$slots.default[0].text.trim();
		}
	},
	template: `<output :class="{placeholder: !content}" :title="content ? '' : 'This information is required'" v-html="content || placeholder"></output>`,
});
{% endraw %}{% endjs %}