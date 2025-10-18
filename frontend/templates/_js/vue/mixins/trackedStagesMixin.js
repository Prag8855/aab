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
				// trackAs can be defined in props or in data. props have precendence.
				console.assert(this.trackAs);
				this.$el.scrollIntoView({ block: 'start', behavior: 'auto' });
				if(!this.trackedStages.has(newStage)) {
					if(this.trackAs){
						plausible(this.trackAs, { props: {
							stage: newStage,
							pageSection: getNearestHeadingId(this.$el),
							referrer: getReferrer(),
							...(this.trackedStagesExtraData || {}),
						}});
					}
					this.trackedStages.add(newStage);
				}
			});
		},
	}
}
{% endjs %}