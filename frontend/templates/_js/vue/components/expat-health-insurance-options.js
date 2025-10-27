{% include '_js/vue.js' %}
{% include '_js/vue/mixins/healthInsuranceOptionsMixin.js' %}

{% js %}{% raw %}
Vue.component('expat-health-insurance-options', {
    mixins: [healthInsuranceOptionsMixin],
    template: `
        <div class="health-insurance-options">
            <h2>Expat health insurance options</h2>
            <p>These options are valid for a <glossary>National Visa</glossary> application.</p>
            <ul class="buttons list">
                <li>
                    <a href="/out/feather-expats" target="_blank" class="recommended">
                        {% endraw %}{% include "_css/icons/health-insurance/logo-feather.svg" %}{% raw %}
                        <div>
                            <h3>Feather</h3>
                            <p>An English-speaking insurer from Berlin. They sell public, private and expat health insurance.</p>
                        </div>
                        <output>
                            <eur :amount="optionPrice('expat', 'feather-basic')"></eur> <small>/ month</small>
                        </output>
                    </a>
                </li>
                <li>
                    <a href="/out/hansemerkur-expats" target="_blank">
                        {% endraw %}{% include "_css/icons/health-insurance/logo-hansemerkur.svg" %}{% raw %}
                        <div>
                            <h3>HanseMerkur</h3>
                            <p>Their expat health insurance works for a <glossary>National Visa</glossary> application.</p>
                        </div>
                        <output>
                            <eur :amount="optionPrice('expat', 'hansemerkur-basic')"></eur> <small>/ month</small>
                        </output>
                    </a>
                </li>
                <li>
                    <a href="/out/ottonova-expats" target="_blank">
                        {% endraw %}{% include "_css/icons/health-insurance/logo-ottonova.svg" %}{% raw %}
                        <div>
                            <h3>Ottonova</h3>
                            <p>Their expat health insurance works for a <glossary>National Visa</glossary> application.</p>
                        </div>
                        <output>
                            <eur :amount="optionPrice('expat', 'ottonova-expat')"></eur> <small>/ month</small>
                        </output>
                    </a>
                </li>
            </ul>
        </div>
    `
});
{% endraw %}{% endjs %}
