{% include '_js/vue.js' %}
{% include '_js/utils/currency.js' %}
{% js %}{% raw %}
Vue.component('eur', {
	props: {
		amount: Number,
		cents: Boolean,
		noSymbol: Boolean,
		locale: String,
	},
	computed: {
		value() {
			return formatCurrency(this.amount, this.cents, false, false, this.locale);
		},
		tooltipText() {
			return (this.value === '0' ? null : getCurrencyTooltipText(this.value));
		},
	},
	template: `
		<span>{{ noSymbol ? '' : '€'}}<span class="currency" :data-currencies="tooltipText">{{ value }}</span></span>
	`,
});
{% endraw %}{% endjs %}