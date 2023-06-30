{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('occupation-input', {
  props: ['value'],
  template: `
    <select class="select" v-bind:value="value" v-on:input="$emit('input', $event.target.value)">
        <optgroup label="Employee">
            <option value="employee">Employee</option>
            <option value="azubi">Apprentice (Azubi)</option>
        </optgroup>
        <optgroup label="Student">
            <option value="studentEmployee">Student, with a job</option>
            <option value="studentSelfEmployed">Student, self-employed</option>
            <option value="student">Student, unemployed</option>
        </optgroup>
        <optgroup label="Other">
            <option value="selfEmployed">Self-employed / freelancer</option>
            <option value="unemployed">Unemployed</option>
        </optgroup>
    </select>
  `,
});
{% endraw %}{% endjs %}