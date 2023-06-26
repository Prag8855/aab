{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('age-input', {
  props: ['value'],
  template: `
    <input class="age-input"
      type="number"
      inputmode="numeric"
      pattern="[0-9]*"
      min="1"
      step="1"
      v-bind:value.number="value"
      v-on:input="$emit('input', $event.target.value)"
      @focus="$event.target.select()">
  `,
});
{% endraw %}{% endjs %}