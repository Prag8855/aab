{% include '_js/vue.js' %}
{% include '_js/utils/currency.js' %}
{% js %}{% raw %}
Vue.component('eur', {
	props: {
		amount: Number,
		cents: Boolean,
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
		<template v-if="!tooltipText">
			<span class="currency">€{{ value }}</span>
		</template>
		<template v-else>
			<span>€<span class="currency" :data-currencies="tooltipText">{{ value }}</span></span>
		</template>
	`,
});
{% endraw %}{% endjs %}