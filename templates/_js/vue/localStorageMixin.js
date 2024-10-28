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
		])

		availableKeys.intersection(desiredStringKeys).forEach(key => {
			this[key] = getDefault(key, this.key);
			this.$watch(key, function (newVal) {
				setDefault(key, newVal);
			})
		})
	},
}
{% endjs %}