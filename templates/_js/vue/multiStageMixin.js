{% js %}
const multiStageMixin = {
	data: function () {
		return {
			stages: [],
			stageIndex: 0,
			inputsToFocus: {},
		}
	},
	computed: {
		stage(){
			return this.stages[this.stageIndex];
		},
	},
	methods: {
		nextStage(){
			if(validateForm(this.$el)){
				this.stageIndex += 1;
			}
		},
	},
	watch: {
		stageIndex(newStageIndex){
			Vue.nextTick(() => {
				// Focus on the first form item in the list when changing steps
				const inputToFocusFunction = this.inputsToFocus[this.stages[newStageIndex]];
				if(inputToFocusFunction){
					inputToFocusFunction().focus();
				}
			});
		},
	}
}
{% endjs %}