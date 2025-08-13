{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('last-name-input', {
	props: ['value'],
	data(){
		const mainLanguage = (navigator.languages || []).map(lang => lang.substring(0, 2))[0];
		const placeholder = {
			bn: 'Ghosh',
			de: 'Mustermann',
			es: 'García',
			fr: 'Dupont',
			hi: 'Singh',
			it: 'Rossi',
			ja: 'Suzuki',
			nl: 'Jansen',
			pl: 'Nowak',
			pt: 'Silva',
			ru: 'Petrovich',
			tr: 'Yilmaz',
			uk: 'Melnyk',
		}[mainLanguage] || 'Alex';
		return { placeholder }
	},
	template: `
		<input type="text"
			class="last-name-input"
			:value="value"
			v-on:input="$emit('input', $event.target.value)"
			:placeholder="placeholder"
			autocomplete="family-name"
			title="Last name">
	`,
});
{% endraw %}{% endjs %}