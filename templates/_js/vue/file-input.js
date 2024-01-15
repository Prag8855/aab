{% include '_js/vue.js' %}
{% js %}{% raw %}
Vue.component('file-input', {
	props: {
		value: Array,
		accept: String,
		required: Boolean,
		type: {
			type: String,
			default: 'files',
		}
	},
	computed: {
		isValid(){
			return this.value.every(this.fileTypeIsValid);
		},
	},
	methods: {
		onFilesSelected(event){
			Array.from(event.target.files).forEach(f => {
				const fileExists = this.value.some(
					curr => {
						return f.name === curr.name && f.size === curr.size;
					}
				);

				if(!fileExists){
					this.value.push(f);
				}
			});
			event.target.value = null;
		},
		openFileInput(){
			this.$refs.fileInput.click();
		},
		removeFile(file){
			const fileIndex = this.value.indexOf(file);
			if (fileIndex !== -1) {
				this.value.splice(fileIndex, 1);
			}
		},
		fileImage(file){
			return URL.createObjectURL(file);
		},
		fileTypeIsValid(file){
			return this.accept
				.split(',')
				.map(t => t.trim())
				.some(t => {
					// t is a mimetype or an extension
					return file.type == t || file.name.endsWith(t);
				});
		}
	},
	watch: {
		files(newFiles){
			if(this.isValid){
				this.$emit('input', newFiles);
			}
		},
	},
	template: `
		<fieldset class="file-input">
			<ul v-if="value.length > 0">
				<li v-for="file in value" :class="{'error': !fileTypeIsValid(file)}">
					<div class="placeholder" v-if="file.type === 'application/pdf'">
						{% endraw %}{% include "_css/icons/pdf.svg" %}{% raw %}
					</div>
					<div class="placeholder" v-if="!fileTypeIsValid(file)">⚠</div>
					<img v-if="file.type.startsWith('image/')" :src="fileImage(file)">
					<div>
						{{ file.name }}
						<small class="input-error" v-if="!fileTypeIsValid(file)">This file type is not supported.</small>
					</div>
					<a class="icon close" href="#" @click.prevent="removeFile(file)" title="Remove this file"></a>
				</li>
			</ul>
			<div class="placeholder" v-if="value.length === 0"><slot></slot></div>
			<input ref="fileInput" type="file" multiple :accept="accept" @change="onFilesSelected">
			<div class="buttons">
				<button ref="button" class="button" :class="{primary: value.length === 0}" for="file-input" @click="openFileInput">
					<i class="icon add" aria-hidden="true"></i>
					{{ (value.length > 0 ? 'Add more ' : 'Add ') + type }}
				</button>
			</div>
		</fieldset>
	`,
});
{% endraw %}{% endjs %}

.file-input{
	margin: var(--l-relative) 0;

	> .placeholder{
		text-align: center;

		svg{
			display: block;
			margin: 0 auto var(--xs);
		}
	}
	ul{
		margin: 0;
		display: grid;
		align-items: center;
		gap: var(--s);
	}
	li{
		@include box-m;
		display: grid;
		grid-template-columns: var(--w-img-logo) 1fr auto;
		overflow: hidden;
		line-height: var(--line-height-label);
		align-items: center;

		img, .placeholder{
			margin: calc(var(--m) * -1) !important;
			width: 100%;
			height: var(--w-img-logo);
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--c-bg-image);
			border: none;
			border-right: var(--b-box);
			border-radius: 0;
			color: var(--c-text-light);
			object-fit: cover;
			object-position: top left;
		}

		.input-error{
			display: block;
		}

		&.error{
			.placeholder, .input-error{
				color: var(--c-text-error);
			}
		}

		a{
			color: var(--c-border-input);
			&:hover{
				color: var(--c-border-input-focused);
			}
		}

		@include only-phone{
			font-size: var(--f-s);
		}
	}
	input{
		display: none;
	}

	.buttons{
		margin-bottom: 0;
	}
}