{% include '_js/utils/constants.js' %}
{% js %}
const brokerMixin = {
	computed: {
		broker() {
			const brokers = [
				{
					id: 'seamus-wolf',
					name: 'Seamus',
					fullName: 'Seamus Wolf',
					phoneNumber: '+491626969454',
					phoneNumberPretty: '+49 162 6969454',
					he: 'he',
					him: 'him',
					his: 'his',
				},
				{
					id: 'christina-weber',
					name: 'Christina',
					fullName: 'Christina Weber',
					phoneNumber: '+493083792299',
					phoneNumberPretty: '+49 30 83792299',
					he: 'she',
					him: 'her',
					his: 'her',
				},
			];

			// Choose a broker at random
			let brokerId = localStorage.getItem('healthInsuranceBroker') || brokers[Math.random() < 0.8 ? 0 : 1].id;

			// Prefer Seamus for well-paid people
			if(this.mode === 'calculator' && this.yearlyIncome > healthInsurance.maxMonthlyIncome){
				brokerId = 'seamus-wolf';
			}
			localStorage.setItem('healthInsuranceBroker', brokerId);

			return brokers.find(b => b.id === brokerId) || brokers[0];
		},
	},
	methods: {
		capitalize(word){
			return word.charAt(0).toUpperCase() + word.slice(1);
		},
	}
};
{% endjs %}