{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('glossary', {
  data() {
    return { showTooltip };
  },
  props: {
    term: String,
  },
  computed: {
    url() {
      return `/glossary/${encodeURIComponent(this.term || this.$slots.default[0].text )}`;
    }
  },
  template: `
    <a target="_blank" :href="url" @click.prevent="showTooltip"><slot></slot></a>
  `,
});
{% endraw %}{% endjs %}