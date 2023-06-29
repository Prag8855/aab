{% include '_js/constants.js' %}
{% include '_js/utils.js' %}
{% include '_js/vue.js' %}
{% include '_js/vue/eur.js' %}
{% js %}{% raw %}
Vue.component('health-insurance-question', {
  props: {
    occupation: String,
    age: Number,
    income: Number,
    isMarried: Boolean,
    hasChildren: Boolean,
  },
  data: function() {
    return {
      uniqueId: Math.floor(Math.random() * 10000),
      stage: 'contactInfo',
      minFreiwilligMonthlyIncome: healthInsurance.minFreiwilligMonthlyIncome * 12,

      question: '',
      fullName: '',
      emailAddress: '',
      phoneNumber: '',

      inputAge: this.age || getDefaultNumber('age', ''),
      inputOccupation: this.occupation || getDefault('occupation', 'employee'),
      incomeOverLimit: this.income >= (healthInsurance.minFreiwilligMonthlyIncome * 12),
    };
  },
  created(){
    this.question = '';

    if(!this.age || !this.occupation) {
      return;
    }

    const formattedIncome = `${formatCurrency(this.income, false, '€', false)} per year`;
    this.question += {
      employee: `I am an employee, and I make ${formattedIncome}.`,
      azubi: `I am an apprentice, and I make ${formattedIncome}.`,
      studentEmployee: `I am a working student, and I make ${formattedIncome}.`,
      studentSelfEmployed: `I am a self-employed student, and I make ${formattedIncome}.`,
      student: `I am a student, `,
      selfEmployed: `I am self-employed, and I make ${formattedIncome}.`,
      unemployed: `I am unemployed.`,
    }[this.occupation];

    this.question += ` I am ${this.age} years old,`;

    if(this.isMarried){
      if(this.hasChildren){
        this.question += " I am married and I have children.";
      }
      else {
        this.question += " I am married and I don't have children.";
      }
    }
    else{
      if(this.hasChildren){
        this.question += " and I am not married, but I have children.";
      }
      else {
        this.question += " I am not married and I don't have children.";
      }
    }

    this.question +=  ' Which health insurance should I choose?';
  },
  methods: {
    setStage(stage) {
      this.stage = stage;
      Vue.nextTick(() => scrollIntoViewIfNeeded(this.$refs.form));
      plausible('Health insurance question', { props: { stage: this.stage }});
    },
    submitForm() {
      if(validateForm(this.$refs.form)) {
        fetch(
          '/api/forms/health-insurance-question',
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=utf-8',},
            body: JSON.stringify({
              name: this.fullName,
              email: this.emailAddress,
              phone: this.phoneNumber || '',
              income: this.incomeOverLimit ? `Over ${this.minFreiwilligMonthlyIncome}€/year` : `Under ${this.minFreiwilligMonthlyIncome}€/year`,
              occupation: this.inputOccupation,
              dateOfBirth: `${this.inputAge} years old`,
              question: this.question,
            }),
          }
        ).then(() => {
          fetch(
          '/api/reminders/health-insurance-question-reminder',
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json; charset=utf-8',},
              body: JSON.stringify({
                name: this.fullName,
                email: this.emailAddress,
              }),
            }
          );
        });
        this.setStage('thank-you');
      }
    },
    makeId(id){
      return `${id}-${this.uniqueId}`;
    }
  },
  template: `
    <div ref="form" class="health-insurance-question">
      <template v-if="stage === 'contactInfo'">
        <div class="form-recipient">
          <img
            srcset="/experts/photos/bioLarge1x/dr-rob-schumacher-feather-insurance.jpg, /experts/photos/bioLarge2x/dr-rob-schumacher-feather-insurance.jpg 2x"
            alt="Dr. Rob Schumacher" width="125" height="125"
            sizes="125px">
          <p><strong>Dr. Rob Schumacher</strong> answers your questions for free. He is an independent insurance broker at <a href="/out/feather" target="_blank">Feather</a>. I work with him since 2018.</p>
        </div>
        <hr>
        <div class="form-group">
          <label :for="makeId('question')">Your question</label>
          <div class="input-group">
            <textarea v-model="question" :id="makeId('question')" required placeholder=" "></textarea>
            <span class="input-symbols"></span>
            <span class="input-instructions">If you are applying for a <glossary term="Aufenthaltstitel">residence permit</glossary>, mention it.</span>
          </div>
        </div>
        <hr>
        <div class="form-group" v-if="!occupation">
          <span class="label">Your occupation</span>
          <select v-model="inputOccupation">
            <option value="employee">Employee</option>
            <option value="selfEmployed">Self-employed</option>
            <option value="student">Student</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group" v-if="!income">
          <span class="label"></span>
          <div class="input-group">
            <label class="checkbox">
              <input type="checkbox" v-model="incomeOverLimit"> <span>I earn more than <eur :amount="minFreiwilligMonthlyIncome"></eur> per year</span>
            </label>
          </div>
        </div>
        <hr v-if="!income && !occupation">
        <div class="form-group">
          <label :for="makeId('name')">
            Name
          </label>
          <div class="input-group">
            <input v-model="fullName" type="text" :id="makeId('name')" required autocomplete="name">
            <span class="input-symbols"></span>
            {% endraw %}{% include "_blocks/formHoneypot.html" %}{% raw %}
          </div>
        </div>
        <div class="form-group">
          <label :for="makeId('email')">
            Email
          </label>
          <div class="input-group">
            <input v-model="emailAddress" type="email" :id="makeId('email')" required autocomplete="email">
            <span class="input-symbols"></span>
          </div>
        </div>
        <div class="form-group">
          <label :for="makeId('phone')">
            Phone number
          </label>
          <div class="input-group">
            <input v-model="phoneNumber" type="tel" :id="makeId('phone')" placeholder="+49..." autocomplete="tel" :aria-describedby="makeId('instructions-phone')">
            <span class="input-instructions" :id="makeId('instructions-phone')">Only if you prefer a phone call.</span>
          </div>
        </div>
        <hr>
        <div class="form-group" v-if="!age">
          <label :for="makeId('age')">
            Age
          </label>
          <label class="input-group">
            <age-input v-model="inputAge" :id="makeId('age')" required :aria-describedby="makeId('instructions-age')"></age-input>
            years old
            <span class="input-instructions" :id="makeId('instructions-age')">Your age affects your health insurance options.</span>
          </label>
        </div>
        <div class="buttons">
          <slot name="form-buttons"></slot>
          <button class="button primary no-print" @click="submitForm">Send question</button>
        </div>
      </template>
      <template v-if="stage === 'thank-you'">
        <p><strong>Message sent!</strong> Rob will contact you today or during the next business day. Expect an email from Feather Insurance.</p>
        <slot name="after-confirmation"></slot>
      </template>
    </div>
  `,
});
{% endraw %}{% endjs %}