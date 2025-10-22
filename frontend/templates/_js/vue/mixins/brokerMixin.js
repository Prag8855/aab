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
            const brokerId = localStorage.getItem('healthInsuranceBroker') || brokers[Math.floor(Math.random() * brokers.length * 2/3)].id;
            localStorage.setItem('healthInsuranceBroker', brokerId);

            return brokers.find(b => b.id === brokerId) || brokers[0];
        },
    },
}