{% js %}
const multiStageMixin = {
	data: function () {
		return {
			stages: [],
			stageIndex: 0,
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
}
{% endjs %}