{% include '_js/vue.js' %}
{% include '_js/utils/currency.js' %}
{% js %}{% raw %}
Vue.component('price', {
    props: {
        from: Number,
        to: Number,
        cents: Boolean,
        amount: Number,
        perMonth: Boolean,
        locale: String,
    },
    computed: {
        showRange(){
            return this.to && this.value(this.from ?? this.amount) !== this.value(this.to)
        }
    },
    methods: { 
        value(amount) {
            return formatCurrency(amount, this.cents, false, false, this.locale);
        },
        tooltipText(amount) {
            return (this.value(amount) === '0' ? null : getCurrencyTooltipText(this.value(amount)));
        },
    },
    template: `
        <span class="price">
            €<span class="currency" :data-currencies="tooltipText(from ?? amount)">{{ value(from ?? amount) }}</span><template v-if="showRange">&ndash;<span class="currency" :data-currencies="tooltipText(to)">{{ value(to) }}</span></template><small v-if="perMonth">&nbsp;/&nbsp;month</small>
        </span>
    `,
});
{% endraw %}{% endjs %}