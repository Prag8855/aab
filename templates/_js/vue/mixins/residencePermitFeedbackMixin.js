{% js %}
const residencePermitFeedbackMixin = {
	data: function () {
		return {
			department: null,
			residencePermitType: null,
			residencePermitTypes: {
				BLUE_CARD: {
					capitalized: "Blue Card",
					normal: "Blue Card",
				},
				FAMILY_REUNION_VISA: {
					capitalized: "Family reunion visa",
					normal: "family reunion visa",
				},
				FREELANCE_VISA: {
					capitalized: "Freelance visa",
					normal: "freelance visa",
				},
				PERMANENT_RESIDENCE: {
					capitalized: "Permanent residence",
					normal: "permanent residence",
				},
				STUDENT_VISA: {
					capitalized: "Student visa",
					normal: "student visa",
				},
				WORK_VISA: {
					capitalized: "Work visa",
					normal: "work visa",
				}
			},
		}
	},
	computed: {
		departments(){
			return {
				BLUE_CARD: {
					B1_B2_B3_B4: 'B1, B2, B3, B4 — Online application',
					B6: 'B6 — Business Immigration Service',
				},
				FAMILY_REUNION_VISA: {
					A1_A5: 'A1, A5 — Syria',
					A2_A3_A4: 'A2, A3, A4 — Asylum seekers',
					B1_B2_B3_B4: 'B1, B2, B3, B4 — Family of skilled workers',
					B6: 'B6 — Business Immigration Service',
					E1: 'E1 — Middle East',
					E2: 'E2 — Africa, America, Israel',
					E3: 'E3 — India, Turkey, etc.',
					E4: 'E4 — Asia, Australia, New Zealand, Russia',
					E5: 'E5 — Balkans, Belarus, Georgia, Ukraine',
					E6: 'E6 — Europe',
				},
				FREELANCE_VISA: {
					A1_A5: 'A1, A5 — Syria',
					A2_A3_A4: 'A2, A3, A4 — Asylum seekers',
					E1: 'E1 — Middle East',
					E2: 'E2 — Africa, America, Israel',
					E3: 'E3 — India, Turkey, etc.',
					E4: 'E4 — Asia, Australia, New Zealand, Russia',
					E5: 'E5 — Balkans, Belarus, Georgia, Ukraine',
					E6: 'E6 — Europe',
				},
				PERMANENT_RESIDENCE: {
					A1_A5: 'A1, A5 — Syria',
					A2_A3_A4: 'A2, A3, A4 — Asylum seekers',
					E1: 'E1 — Middle East',
					E2: 'E2 — Africa, America, Israel',
					E3: 'E3 — India, Turkey, etc.',
					E4: 'E4 — Asia, Australia, New Zealand, Russia',
					E5: 'E5 — Balkans, Belarus, Georgia, Ukraine',
					E6: 'E6 — Europe',
				},
				STUDENT_VISA: {
					B1_B2_B3_B4: 'B1, B2, B3, B4 — Students',
				},
				WORK_VISA: {
					B1_B2_B3_B4: 'B1, B2, B3, B4 — Skilled workers',
					B6: 'B6 — Business Immigration Service',
				},
			}[this.residencePermitType] || {
				A1_A5: 'A1, A5 — Syria',
				A2_A3_A4: 'A2, A3, A4 — Asylum seekers',
				B1_B2_B3_B4: 'B1, B2, B3, B4 — Students, workers, researchers',
				B6: 'B6 — Business Immigration Service',
				E1: 'E1 — Middle East',
				E2: 'E2 — Africa, America, Israel',
				E3: 'E3 — India, Turkey, etc.',
				E4: 'E4 — Asia, Australia, New Zealand, Russia',
				E5: 'E5 — Balkans, Belarus, Georgia, Ukraine',
				E6: 'E6 — Europe',
			};
		}
	},
	methods: {
		formatLongDate(date){
			if(date) {
				const dateObj = (date instanceof Date) ? date : dateFromString(date);
				return dateObj.toLocaleDateString("en-US", {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				});
			}
			return '';
		}
	},
	watch: {
		residencePermitType(newType){
			// Auto select department if it's the only available option
			if(Object.keys(this.departments).length === 1){
				this.department = Object.keys(this.departments)[0];
			}
			// Deselect department if it's not a valid option
			else if(this.department && !(this.department in this.departments)){
				this.department = null;
			}
		}
	}
}
{% endjs %}