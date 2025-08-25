{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('tabs', {
	props: {
		value: [Number, String, Boolean],
		options: Array,
		required: Boolean,
		id: String,
	},
	template: `
		<div class="tabs">
			<template v-for="option in options">
				<input
					type="radio"
					v-model="value"
					:id="id + option.value"
					:name="id"
					:required="required"
					:value="option.value"
					:key="id + option.value"
					@input="$emit('input', option.value)">
				<label
					:for="id + option.value"
					:key="id + option.value + '-label'"
					v-text="option.label"></label>
			</template>
		</div>
	`,
});
{% endraw %}{% endjs %}