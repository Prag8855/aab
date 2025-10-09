{% js %}{% raw %}
Vue.component('date-input', {
	props: {
		id: String,
		value: String,
		autocomplete: String,
		min: String,
		max: String,
		required: Boolean,
	},
	data(){
		return {
			day: '',
			month: '',
			year: '',
		}
	},
	computed: {
		cleanDay() {
			return this.day.padStart(2, '0');
		},
		cleanMonth() {
			return this.month.padStart(2, '0');
		},
		cleanYear() {
			if(this.year && this.year.length === 2){ // 90 to 1990, 10 to 2010
				if(parseInt('20' + this.year, 10) > (new Date().getFullYear() + 10)){
					return '19' + this.year;
				}
			}
			return this.year;
		},
		cleanDate(){
			return `${this.cleanYear}-${this.cleanMonth}-${this.cleanDay}`;
		},
		yearValid() {
			const year = parseInt(this.cleanYear, 10);
			return !isNaN(year) && year > 1900;
		},
		monthValid() {
			const month = parseInt(this.cleanMonth, 10);
			return !isNaN(month) && month > 0 && month <= 12;
		},
		dayValid() {
			const day = parseInt(this.cleanDay, 10);
			const daysInMonth = new Date(
				this.yearValid ? this.year : new Date().getFullYear(),
				this.monthValid ? this.month : 1,
				0
			).getDate();
			return !isNaN(day) && day > 0 && this.month <= daysInMonth;
		},
		dateTooSmall(){
			return this.dayValid && this.monthValid && this.yearValid && this.min && this.cleanDate < this.min;
		},
		dateTooBig(){
			return this.dayValid && this.monthValid && this.yearValid && this.max && this.cleanDate > this.max;
		},
		valid() {
			return this.dayValid && this.monthValid && this.yearValid && !this.dateTooSmall && !this.dateTooBig;
		},
	},
	mounted() {
		if(this.value && this.value.match(/\d\d\d\d-\d\d-\d\d/)){
			[this.year, this.month, this.day] = this.value.split('-');
		}
	},
	methods: {
		onChange() {
			this.$refs.fieldset.setCustomValidity(this.valid ? '' : 'Invalid date');
			this.$refs.dayInput.setCustomValidity(this.dayValid ? '' : 'Invalid day');
			this.$refs.monthInput.setCustomValidity(this.monthValid ? '' : 'Invalid month');
			this.$refs.yearInput.setCustomValidity(this.yearValid ? '' : 'Invalid year');
			if(this.dateTooSmall){
				this.$refs.fieldset.setCustomValidity(`Date must be after ${this.min}`);
				this.$refs.dayInput.setCustomValidity(`Date must be after ${this.min}`);
				this.$refs.monthInput.setCustomValidity(`Date must be after ${this.min}`);
				this.$refs.yearInput.setCustomValidity(`Date must be after ${this.min}`);
			}
			if(this.dateTooBig){
				this.$refs.fieldset.setCustomValidity(`Date must be before ${this.max}`);
				this.$refs.dayInput.setCustomValidity(`Date must be before ${this.max}`);
				this.$refs.monthInput.setCustomValidity(`Date must be before ${this.max}`);
				this.$refs.yearInput.setCustomValidity(`Date must be before ${this.max}`);
			}
			this.$emit('input', this.valid ? this.cleanDate : '');
		},
		onInput(e) {
			const switchInput = (
				// Input is full
				e.target.value.length === e.target.maxLength
				// Adding another digit would make the month invalid
				|| (e.target === this.$refs.dayInput && (parseInt(e.target.value, 10) > 3))
				|| (e.target === this.$refs.monthInput && (parseInt(e.target.value, 10) > 2))
			);

			if(switchInput){
				this.focusNextInput(e.target);
			}
		},
		onKeyup(e) {
			if(e.key === "Backspace" && e.target.value.length === 0) {
				this.focusPreviousInput(e.target, false);
			}
		},
		onDayBlur(e) {
			if(this.dayValid){
				this.day = this.cleanDay;
			}
		},
		onMonthBlur(e){
			if(this.monthValid){
				this.month = this.cleanMonth;
			}
		},
		onYearBlur(e){
			if(this.yearValid){
				this.year = this.cleanYear;
			}
		},
		focusPreviousInput(el){
			if(el === this.$refs.monthInput) {
				this.$refs.dayInput.focus();
			}
			else if(el === this.$refs.yearInput) {
				this.$refs.monthInput.focus();
			}
		},
		focusNextInput(el){
			if(el === this.$refs.dayInput) {
				this.$refs.monthInput.focus();
				this.$refs.monthInput.select();
			}
			else if(el === this.$refs.monthInput) {
				this.$refs.yearInput.focus();
				this.$refs.yearInput.select();
			}
		}
	},
	watch: {
		day() { this.onChange() },
		month() { this.onChange() },
		year() { this.onChange() },
		min() { this.onChange() },
		max() { this.onChange() },
	},
	template: `
		<fieldset class="date-input" :required="required" ref="fieldset">
			<input
				:autocomplete="autocomplete == 'bday' ? 'bday-day' : 'on'"
				:class="{required: required}"
				:id="id ? id + '-day' : null"
				:required="required"
				@focus="$event.target.select()"
				@blur="onDayBlur"
				@input="onInput"
				class="day-input"
				inputmode="numeric"
				maxlength="2"
				pattern="[0-9]*"
				placeholder="DD"
				ref="dayInput"
				title="Day of the month"
				type="text"
				v-model="day">/
			<input
				:autocomplete="autocomplete == 'bday' ? 'bday-month' : 'on'"
				:class="{required: required}"
				:required="required"
				@focus="$event.target.select()"
				@blur="onMonthBlur"
				@input="onInput"
				@keyup="onKeyup"
				class="short-month-input"
				inputmode="numeric"
				maxlength="2"
				placeholder="MM"
				ref="monthInput"
				title="Month"
				type="text"
				v-model="month">/
			<input
				:autocomplete="autocomplete == 'bday' ? 'bday-year' : 'on'"
				:class="{required: required}"
				:required="required"
				@focus="$event.target.select()"
				@blur="onYearBlur"
				@keyup="onKeyup"
				class="year-input"
				inputmode="numeric"
				maxlength="4"
				placeholder="YYYY"
				ref="yearInput"
				title="Year"
				type="text"
				v-model="year">
		</fieldset>
	`,
});
{% endraw %}{% endjs %}