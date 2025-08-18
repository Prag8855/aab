	methods: {
		whatSeamusWillDo(firstPerson=true){
			const youOrMe = firstPerson ? 'me' : 'you';
			return {
				barmer: `get ${youOrMe} insured with Barmer`,
				tk: `get ${youOrMe} insured with Techniker Krankenkasse`,
				public: `help ${youOrMe} choose the best public health insurance`,
				private: `help ${youOrMe} choose the best private health insurance`,
			}[this.desiredService] || `help ${youOrMe} choose the right health insurance`;
		},
		personSummary(firstPerson=true){
			const facts = [];

			if(!this.occupation){ // "It's complicated" or direct contact form
				return;
			}

			const youOrI = firstPerson ? 'I' : 'you';
			const iAm = firstPerson ? 'I am' : 'you are';

			if(this.age !== undefined){
				facts.push(`${iAm} ${this.age} years old`);
			}

			const cleanOccupation = {
				azubi: 'an apprentice',
				employee: 'employed',
				selfEmployed: 'self-employed',
				studentEmployee: 'a student',
				studentSelfEmployed: 'a self-employed student',
				studentUnemployed: 'an unemployed student',
				unemployed: 'unemployed',
			}[this.occupation];
			if(cleanOccupation){
				facts.push(`${iAm} ${cleanOccupation}`);
			}
			if(occupations.isStudent(this.occupation) && this.worksOver20HoursPerWeek){
				facts.push(`${youOrI} work more than 20 hours per week`);
			}
			if(this.yearlyIncome !== undefined){
				facts.push(`${youOrI} earn ${formatCurrency(this.yearlyIncome)} per year`);
			}
			if(this.isEUCitizen !== undefined){
				facts.push(`${iAm} ${this.isEUCitizen ? '' : 'not '}a EU citizen`);
			}
			if(this.isMarried !== undefined){
				facts.push(`${iAm} ${this.isMarried ? '' : 'not '}married`);
			}

			if(this.childrenCount !== undefined){
				if(this.childrenCount === 0){
					facts.push(`${youOrI} don't have children`);
				}
				else if(this.childrenCount === 1){
					facts.push(`${youOrI} have a child`);
				}
				else {
					facts.push(`${youOrI} have ${this.childrenCount} children`);
				}
			}

			if(this.currentInsurance){
				facts.push(`${youOrI} have ${this.currentInsurance} health insurance`);
			}

			if(facts.length === 0){
				return;
			}

			if(firstPerson){
				// I am ..., I am ... and I am ...
				return new Intl.ListFormat('en-US', {style: 'long', type: 'conjunction'}).format(facts) + '.';
			}

			return facts;
		},
	},