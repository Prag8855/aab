{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('first-name-input', {
	props: ['value'],
	data(){
		const mainLanguage = (navigator.languages || []).map(lang => lang.substring(0, 2))[0];
		console.log((navigator.languages || []).map(lang => lang.substring(0, 2)))
		const placeholder = {
			ar: 'Noor',
			bn: 'Kiran',
			fr: 'Maxime',
			hi: 'Aadi',
			it: 'Andrea',
			ja: 'Masami',
			nl: 'Sam',
			pl: 'Jan',
			ru: 'Sasha',
			tr: 'Eren',
			uk: 'Zhenya',
		}[mainLanguage] || 'Alex';
		return { placeholder }
	},
	template: `
		<input type="text"
			class="first-name-input"
			:value="value"
			v-on:input="$emit('input', $event.target.value)"
			:placeholder="placeholder"
			autocomplete="given-name"
			title="First name">
	`,
});
{% endraw %}{% endjs %}