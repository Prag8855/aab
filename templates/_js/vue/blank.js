{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('blank', {
  props: {
    placeholder: String,
  },
  template: `<output :class="{'placeholder': !$slots.default[0].text}" v-html="$slots.default[0].text || placeholder"></output>`,
});
{% endraw %}{% endjs %}