{% js %}
const trackedStagesMixin = {
	data: function () {
		return {
			trackedStages: new Set(),
		}
	},
	watch: {
		stage(newStage){
			Vue.nextTick(() => {
				console.assert(this.trackAs);
				this.$el.scrollIntoView({ block: 'start', behavior: 'auto' });
				if(!this.trackedStages.has(newStage)) {
					if(this.trackAs){
						plausible(this.trackAs, { props: { stage: newStage }});
					}
					this.trackedStages.add(newStage);
				}
			});
		},
	}
}
{% endjs %}