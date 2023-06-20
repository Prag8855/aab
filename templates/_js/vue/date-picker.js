{% js %}{% raw %}
Vue.component('date-picker', {
  props: {
    id: String,
    value: String,
    autocomplete: String,
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
        if(Number('20' + this.year) > new Date().getFullYear()){
          return '19' + this.year;
        }
      }
      return this.year;
    },
    yearValid() {
      const year = Number(this.cleanYear);
      return !isNaN(year) && year > 1900 && year <= new Date().getFullYear();
    },
    monthValid() {
      const month = Number(this.cleanMonth);
      return !isNaN(month) && month > 0 && month <= 12;
    },
    dayValid() {
      const day = Number(this.cleanDay);
      const daysInMonth = new Date(
        this.yearValid ? this.year : new Date().getFullYear(),
        this.monthValid ? this.month : 1,
        0
      ).getDate();
      return !isNaN(day) && day > 0 && this.month <= daysInMonth;
    },
    valid() {
      return this.dayValid && this.monthValid && this.yearValid;
    },
  },
  methods: {
    onChange() {
      this.$refs.fieldset.setCustomValidity(this.valid ? '' : 'Invalid date');
      this.$refs.dayInput.setCustomValidity(this.dayValid ? '' : 'Invalid day');
      this.$refs.monthInput.setCustomValidity(this.monthValid ? '' : 'Invalid month');
      this.$refs.yearInput.setCustomValidity(this.yearValid ? '' : 'Invalid year');
      this.$emit('input', this.valid ? `${this.cleanYear}-${this.cleanMonth}-${this.cleanDay}` : '');
    },
    onInput(e) {
      const switchInput = (
        // Input is full
        e.target.value.length === e.target.maxLength
        // Adding another digit would make the month invalid
        || (e.target === this.$refs.dayInput && Number(e.target.value) > 3)
        || (e.target === this.$refs.monthInput && Number(e.target.value) > 2)
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
  },
  template: `
    <fieldset class="date-picker" :required="required" ref="fieldset">
      <input
        :autocomplete="autocomplete == 'bday' ? 'bday-day' : 'on'"
        :class="{required: required}"
        :id="id ? id + '-day' : null"
        :required="required"
        @blur="if(dayValid){day = cleanDay}"
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
        @blur="if(monthValid){month = cleanMonth}"
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
        @blur="if(yearValid){year = cleanYear}"
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