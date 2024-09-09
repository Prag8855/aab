{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('occupation-input', {
  props: ['value'],
  template: `
	<select :value="value" v-on:input="$emit('input', $event.target.value)">
		<optgroup label="Employee">
			<option value="employee">Employee</option>
			<option value="azubi">Apprentice (Azubi)</option>
		</optgroup>
		<optgroup label="Student">
			<option value="studentEmployee">Working student</option>
			<option value="studentSelfEmployed">Self-employed student</option>
			<option value="student">Unemployed student</option>
		</optgroup>
		<optgroup label="Other">
			<option value="selfEmployed">Self-employed / freelancer</option>
			<option value="unemployed">Unemployed</option>
		</optgroup>
	</select>
  `,
});
{% endraw %}{% endjs %}