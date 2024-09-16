{% include '_js/vue.js' %}
{% include '_js/vue/trackedStagesMixin.js' %}
{% js %}{% raw %}
Vue.component('letter-generator', {
	mixins: [trackedStagesMixin],
	props: {
		static: Boolean,
		trackAs: String,
		printable: {
			type: Boolean,
			default: true,
		}
	},
	data() {
		return {
			language: 'en',
			stage: 'start',
			trackedStages: new Set(),
		};
	},
	computed: {
	},
	methods: {
		print() {
			const printWindow = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
			printWindow.document.write(`
				<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="utf-8">
						<title>${document.title}</title>
						<link rel="stylesheet" href="/css/style.css">
					</head>
					<body class="letter-template">${this.$refs.template.innerHTML}</body>
				</html>
			`);
			printWindow.document.querySelector('head link').onload = function() {
				printWindow.document.close();
				printWindow.focus();
				printWindow.print();
				printWindow.close();
				if(this.trackAs){
					plausible(this.trackAs, { props: { stage: 'print' }});
				}
			}
		},
	},
	template: `
		<details class="collapsible" ref="collapsible" :open="static" v-cloak>
			<summary :hidden="static">
				<small>Letter generator</small>
				<slot name="header"></slot>
			</summary>
			<div class="buttons no-print" v-if="stage === 'printPreview'">
				<button class="button" @click="stage = 'edit'">
					<i class="icon left"></i> Customize
				</button>
				<div class="tabs">
					<button @click="language = 'en'" tabindex="0" :disabled="language === 'en'">
						English
					</button>
					<button @click="language = 'de'" tabindex="0" :disabled="language === 'de'">
						German
					</button>
				</div>
				<button class="button primary" @click="print">
					Print
				</button>
			</div>
			<div class="tabs language-picker no-print" v-if="stage === 'start'">
				<button @click="language = 'en'" tabindex="0" :disabled="language === 'en'">
					English
				</button>
				<button @click="language = 'de'" tabindex="0" :disabled="language === 'de'">
					German
				</button>
			</div>
			<div v-if="stage === 'start' || stage === 'printPreview'" :class="{'letter-template': stage === 'printPreview'}" ref="template">
				<div class="letter-recipient-address only-print">
					<slot name="letter-recipient" :language="language" :stage="stage"></slot>
				</div>
				<div class="letter-details only-print">
					<slot name="letter-details" :language="language" :stage="stage"></slot>
				</div>
				<div class="letter-body">
					<slot name="letter-body" :language="language" :stage="stage"></slot>
				</div>
			</div>
			<p v-if="stage === 'printPreview'">
				If this tool helped you, <a href="/donate" target="_blank">donate a few euros</a> to support my work.
			</p>
			<template v-if="stage === 'start'">
				<hr>
				<div class="buttons no-print">
					<button class="button primary" @click="stage = 'edit'" >
						{{ printable ? "Customize and print" : "Customize" }} <i class="icon right"></i>
					</button>
				</div>
			</template>
			<template v-if="stage === 'edit'">
				<p v-if="printable">Fill the missing information to get a printable letter.</p>
				<p v-if="!printable">Fill the missing information to get a message template.</p>
				<hr>
				<slot name="form" :language="language" :stage="stage"></slot>
				<hr>
				<div class="buttons no-print">
					<button v-if="printable" class="button" @click="stage = 'start'">
						<i class="icon left"></i> Back
					</button>
					<button v-if="printable" class="button primary" @click="language = 'de'; stage = 'printPreview'">
						Preview and print <i class="icon right"></i>
					</button>
					<button v-if="!printable" class="button primary" @click="language = 'de'; stage = 'start'">
						<i class="icon left"></i> Preview
					</button>
				</div>
			</template>
		</details>
	`,
});
{% endraw %}{% endjs %}