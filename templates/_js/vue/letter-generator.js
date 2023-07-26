{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('letter-generator', {
	props: {
		static: Boolean,
		trackAs: String,
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
	watch: {
		stage() {
			Vue.nextTick(() => {
				this.$refs.collapsible.scrollIntoView({ block: 'start', behavior: 'auto' });
				if(!this.trackedStages.has(this.stage)) {
					if(this.trackAs){
						plausible(this.trackAs, { props: { stage: this.stage }});
					}
					this.trackedStages.add(this.stage);
				}
			});
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
			<template v-if="stage === 'start'">
				<hr>
				<div class="buttons no-print">
					<button class="button primary" @click="stage = 'edit'">
						Customize and print <i class="icon right"></i>
					</button>
				</div>
			</template>
			<template v-if="stage === 'edit'">
				<p>Fill the missing information to get a printable letter.</p>
				<hr>
				<slot name="form" :language="language" :stage="stage"></slot>
				<hr>
				<div class="buttons no-print">
					<button class="button" @click="stage = 'start'">
						<i class="icon left"></i> Back
					</button>
					<button class="button primary" @click="language = 'de'; stage = 'printPreview'">
						Preview and print <i class="icon right"></i>
					</button>
				</div>
			</template>
		</details>
	`,
});
{% endraw %}{% endjs %}