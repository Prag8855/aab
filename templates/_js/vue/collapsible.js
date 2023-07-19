{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('collapsible', {
  props: {
    static: Boolean,
  },
  template: `
    <details class="collapsible" v-cloak :open="static">
      <summary :hidden="static">
        <slot name="header"></slot>
      </summary>
      <slot></slot>
    </details>
  `,
});
{% endraw %}{% endjs %}