{% js %}
const healthInsuranceOptionsMixin = {
    props: {
        age: Number,
        childrenCount: Number,
        hasGermanPublicHealthInsurance: Boolean,
        hasEUPublicHealthInsurance: Boolean,
        hoursWorkedPerWeek: Number,
        isApplyingForFirstVisa: Boolean,
        isMarried: Boolean,
        monthlyIncome: Number,
        occupation: String,
        customZusatzbeitrag: Number,
    },
    computed: {
        results() {
            return getHealthInsuranceOptions({
                ...this.$props,
                sortByPrice: true
            });
        },
    },
    methods: {
        selectOption(option){
            this.$emit('select', option);
        },
        optionPrice(type, id){
            return this.results[type].options.find(o => o.id === id).total.personalContribution;
        },
    },
};
{% endjs %}