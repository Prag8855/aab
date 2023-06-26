{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('income-input', {
  props: ['value'],
  template: `
    <input class="income-input"
      type="number"
      inputmode="numeric"
      pattern="[0-9]*"
      placeholder="0"
      min="0"
      step="1"
      v-bind:value.number="value"
      v-on:input="$emit('input', $event.target.value)">
  `,
});
{% endraw %}{% endjs %}