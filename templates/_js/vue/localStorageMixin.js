{% include '_js/utils.js' %}
{% js %}
const localStorageMixin = {
	mounted(){
		const availableKeys = new Set(Object.keys(this.$data));
		const desiredStringKeys = new Set([
			'church',
			'countryOfResidence',
			'email',
			'healthInsuranceType',
			'modificationKey',
			'nationality',
			'occupation',
			'state',
		]);

		const desiredNumberKeys = new Set([
			'age',
			'childrenCount',
			'yearlyIncome',
		]);

		const desiredBooleanKeys = new Set([
			'isMarried',
			'useMonthlyIncome',
		]);

		availableKeys.intersection(desiredStringKeys).forEach(key => {
			this[key] = getDefault(key, this.key);
			this.$watch(key, function (newVal) {
				setDefault(key, newVal);
			})
		});

		availableKeys.intersection(desiredNumberKeys).forEach(key => {
			this[key] = getDefaultNumber(key, this.key);
			this.$watch(key, function (newVal) {
				setDefaultNumber(key, newVal);
			})
		});

		availableKeys.intersection(desiredBooleanKeys).forEach(key => {
			this[key] = getDefaultBoolean(key, this.key);
			this.$watch(key, function (newVal) {
				setDefaultBoolean(key, newVal);
			})
		});
	},
}
{% endjs %}