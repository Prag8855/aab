{% include '/js/vue.js' %}
{% include '/js/currency.js' %}
{% js %}{% raw %}
Vue.component('eur', {
  props: {
    amount: Number,
    cents: Boolean,
    noSymbol: Boolean,
  },
  computed: {
    value() {
      return formatCurrency(this.amount, this.cents, false, false);
    },
    tooltipText() {
      return getCurrencyTooltipText(this.value);
    },
  },
  template: `
    <template v-if="noSymbol">
      <span class="currency" :data-currencies="tooltipText">{{ value }}</span>
    </template>
    <template v-else>
      <span><span class="currency" :data-currencies="tooltipText">{{ value }}</span>&nbsp;€</span>
    </template>
  `,
});
{% endraw %}{% endjs %}