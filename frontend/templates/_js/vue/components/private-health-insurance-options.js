{% include '_js/vue.js' %}
{% include '_js/vue/mixins/healthInsuranceOptionsMixin.js' %}

{% js %}{% raw %}
Vue.component('private-health-insurance-options', {
    mixins: [healthInsuranceOptionsMixin],
    template: `
        <div class="health-insurance-options">
            <h2>Private health insurance options</h2>
            <p>Do not choose private health insurance yourself. Always ask an independent expert to compare options.</p>
        </div>
    `
});
{% endraw %}{% endjs %}
