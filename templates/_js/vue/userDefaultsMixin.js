{% js %}

const userDefaults = {  // Percentages are stored as full amounts, unlike elsewhere
	age: 25,
	childrenCount: 0,
	church: 'other',
	customZusatzbeitrag: 1.5,
	dateOfBirth: null,
	email: null,
	fullName: null,
	isMarried: false,
	modificationKey: null,
	occupation: 'employee',
	phone: null,
	germanState: 'be-east',
	useMonthlyIncome: false,
	yearlyIncome: Math.round({{ MEDIAN_INCOME_GERMANY }}/100) * 100,
	healthInsuranceType: 'unknown',
	privateHealthInsuranceCost: 550, // € per month
	publicHealthInsuranceZusatzbeitrag: {{ GKV_ZUSATZBEITRAG_AVERAGE }}, // %
	religion: null,
	taxClass: 1,
};

const userDefaultsMixin = {
	mounted(){
		const availableKeys = new Set(Object.keys(this.$data));
		const desiredStringKeys = new Set([
			'church',
			'countryOfResidence',
			'dateOfBirth',  // YYYY-MM-DD string
			'email',
			'fullName',
			'germanState',
			'healthInsuranceType',
			'modificationKey',
			'nationality',
			'occupation',
			'phone',
			'religion',
		]);

		const desiredNumberKeys = new Set([
			'age',
			'childrenCount',
			'privateHealthInsuranceCost',
			'publicHealthInsuranceZusatzbeitrag',
			'taxClass',
			'yearlyIncome',
		]);

		const desiredBooleanKeys = new Set([
			'isMarried',
			'useMonthlyIncome',
		]);

		availableKeys.intersection(desiredStringKeys).forEach(key => {
			this[key] = this.getDefault(key, this.key);
			this.$watch(key, function (newVal) {
				this.setDefault(key, newVal);
			})
		});

		availableKeys.intersection(desiredNumberKeys).forEach(key => {
			this[key] = this.getDefaultNumber(key, this.key);
			this.$watch(key, function (newVal) {
				this.setDefaultNumber(key, newVal);
			})
		});

		availableKeys.intersection(desiredBooleanKeys).forEach(key => {
			this[key] = this.getDefaultBoolean(key, this.key);
			this.$watch(key, function (newVal) {
				this.setDefaultBoolean(key, newVal);
			})
		});
	},
	methods: {
		getDefault(key, fallback){
			try {
				const value = localStorage.getItem(key)
				return value === null ? userDefaults[key] : value;
			} catch (e) {}
			return fallback;
		},
		getDefaultNumber(key, fallback){
			return +this.getDefault(key, fallback)
		},
		getDefaultBoolean(key, fallback){
			const storedValue = this.getDefault(key); // localStorage stores strings, so "true" or "false"
			return storedValue ? storedValue === 'true' : !!fallback;
		},
		setDefault(key, value) {
			if(value === null || value === undefined){
				return;
			}
			try {
				localStorage.setItem(key, value);
				userDefaults[key] = value;
				return true;
			} catch (e) {}
			return false;
		},
		setDefaultNumber(key, value) {
			this.setDefault(key, +value)
		},
		setDefaultBoolean(key, value) {
			this.setDefault(key, !!value)
		},
	}
}
{% endjs %}