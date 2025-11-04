{% include '_js/vue.js' %}
{% include '_js/vue/components/price.js' %}
{% include '_js/vue/mixins/healthInsuranceOptionsMixin.js' %}

{% js %}{% raw %}
Vue.component('expat-health-insurance-options', {
    mixins: [healthInsuranceOptionsMixin],
    computed: {
        isExpatOnlyOption() {
            return this.results.asList[0].id === 'expat' && this.results.asList.length === 1;
        },
    },
    template: `
        <div class="health-insurance-options">
            <h2 v-if="!isExpatOnlyOption">Expat health insurance options</h2>
            <p v-if="!isExpatOnlyOption">
                These options are valid for a <glossary>National Visa</glossary> application.
                <template v-if="occupation === 'selfEmployed'">It's rarely accepted when you <a target="_blank" href="/guides/renew-german-freelance-visa">renew your freelance visa</a>.</template>
            </p>
            <ul class="buttons list">
                <li>
                    <a href="/out/feather-expats" target="_blank" class="recommended">
                        {% endraw %}{% include "_css/icons/health-insurance/logo-feather.svg" %}{% raw %}
                        <div>
                            <h3>Feather</h3>
                            <p>An English-speaking insurer from Berlin.</p>
                        </div>
                        <price :amount="optionPrice('expat', 'feather-basic')" per-month></price>
                    </a>
                </li>
                <li>
                    <a href="/out/hansemerkur-expats" target="_blank">
                        {% endraw %}{% include "_css/icons/health-insurance/logo-hansemerkur.svg" %}{% raw %}
                        <h3>HanseMerkur</h3>
                        <price :amount="optionPrice('expat', 'hansemerkur-basic')" per-month></price>
                    </a>
                </li>
                <li>
                    <a href="/out/ottonova-expats" target="_blank">
                        {% endraw %}{% include "_css/icons/health-insurance/logo-ottonova.svg" %}{% raw %}
                        <h3>Ottonova</h3>
                        <price :amount="optionPrice('expat', 'ottonova-expat')" per-month></price>
                    </a>
                </li>
            </ul>
        </div>
    `
});
{% endraw %}{% endjs %}
