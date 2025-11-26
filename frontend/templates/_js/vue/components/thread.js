{% include '_js/vue.js' %}
{% include '_js/vue/components/comment.js' %}
{% js %}{% raw %}
Vue.component('thread', {
    props: ['id'],
    data() {
        return {
            comments: [],
        };
    },
    async mounted(){
        const response = await fetch(`/api/discussion/thread/${this.id}/`);
        if(!response.ok){ return; }
        r = await response.json();
        this.comments = (r.results);
        console.log(r)
    },
    template: `
        <ol class="comments">
            <comment :comment="c" v-for="c in comments" :key="c.id"></comment>
        </ol>
    `,
});
{% endraw %}{% endjs %}