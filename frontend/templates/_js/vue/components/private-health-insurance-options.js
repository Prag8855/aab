{% include '_js/vue.js' %}
{% include '_js/vue/mixins/healthInsuranceOptionsMixin.js' %}

{% js %}{% raw %}
Vue.component('private-health-insurance-options', {
    mixins: [healthInsuranceOptionsMixin],
    computed: {
        visaBenefit() {
            return null; // TODO
        },
        totalCost() {
            return 550; // TODO
        },
        childrenCost() {
            return 125; // TODO
        },
        krankentagegeldPayout() {
            return 150; // TODO
        },
    },
    template: `
        <div class="health-insurance-options">
            <h2>Private health insurance options</h2>
            <hr>
            <div class="two-columns private-cost">
                <div>
                    <h3>Basic coverage</h3>
                    <ul class="pros">
                        <li v-if="visaBenefit" v-text="visaBenefit"></li>
                        <li>Covers all necessary healthcare</li>
                    </ul>
                    <ul class="cons">
                        <li>High <glossary term="Selbstbeteiligung">deductible</glossary></li>
                        <li>No <glossary term="Krankentagegeld">sickness allowance</glossary></li>
                    </ul>
                    <output>
                        <eur :amount="totalCost"></eur><small>/month</small>
                    </output>
                    <small v-if="childrenCount">+ <eur :amount="childrenCost"></eur> to cover your {{ childOrChildren }}</small>
                </div>
                <div>
                    <h3>Premium coverage</h3>
                    <ul class="pros">
                        <li v-if="visaBenefit" v-text="visaBenefit"></li>
                        <li>Covers the best available healthcare</li>
                        <li>Low <glossary term="Selbstbeteiligung">deductible</glossary></li>
                        <li>Generous <glossary term="Krankentagegeld">sickness allowance</glossary></li>
                    </ul>
                    <output>
                        <eur :amount="totalCost"></eur><small>/month</small>
                    </output>
                    <small v-if="childrenCount">+ <eur :amount="childrenCost"></eur> to cover your {{ childOrChildren }}</small>
                </div>
            </div>

            <details class="cost-explanation">
                <summary>Cost explanation</summary>
                <p>This shows two plans from Hallesche. There are hundreds of other options, but the prices will be similar.</p>
                <hr>
                <details>
                    <summary class="price">
                        Base cost
                        <output>
                            <eur :amount="550"></eur><small class="no-mobile">/month</small>
                        </output>
                    </summary>
                    <p>This is the basic cost of your private health insurance.</p>
                </details>
                <details>
                    <summary class="price">
                        Sickness allowance
                        <output>
                            <eur :amount="0"></eur><small class="no-mobile">/month</small>
                        </output>
                    </summary>
                    <p><glossary term="Krankentagegeld">Sickness allowance</glossary> is optional, but recommended. If you are too sick to work, you get <eur :amount="krankentagegeldPayout"></eur> per day. You can adjust this amount.</p>
                </details>
                <details>
                    <summary class="price">
                        Long-term care insurance
                        <output>
                            <eur :amount="0"></eur><small class="no-mobile">/month</small>
                        </output>
                    </summary>
                    <p>
                        This keeps health insurance prices low when you are older.
                    </p>
                </details>
            </details>

            <hr>

            <p>Do not choose private health insurance yourself. Let our insurance expert find the best option. It's 100% free.</p>
        </div>
    `
});
{% endraw %}{% endjs %}
