{% include '/js/vue.js' %}
{% js %}{% raw %}
Vue.component('glossary', {
  data: {
    showTooltip,
  },
  props: {
    term: String,
  },
  computed: {
    url() {
      return `/glossary/${encodeURIComponent(this.term || this.$slots.default)}`;
    }
  },
  template: `
    <a target="_blank" :href="url" @click.prevent="showTooltip"><slot></slot></a>
  `,
});
{% endraw %}{% endjs %}