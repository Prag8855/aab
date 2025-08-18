{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('recommended', {
	data() {
		return { showTooltip };
	},
	template: `
		<a target="_blank" class="recommended" aria-label="Recommended option" href="/glossary/Recommended" @click.prevent="showTooltip"></a>
	`,
});
{% endraw %}{% endjs %}