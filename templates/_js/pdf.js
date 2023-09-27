{% js %}{% raw %}
let pdfLibScriptPromise = null;

const pdf = {
	async fillAndSavePDF(pdfDoc, textFields, checkboxFields, outputFileName) {
		const pdfForm = pdfDoc.getForm();

		pdfDoc.getPage(0).drawText('Auf allaboutberlin.com ausgefüllt', { size: 9, x: 40, y: 20 });

		Object.entries(textFields || {}).forEach(([fieldName, value]) => {
			pdfForm.getTextField(fieldName).setText(value);
		});
		Object.entries(checkboxFields || {}).forEach(([fieldName, value]) => {
			if(value){
				pdfForm.getCheckBox(fieldName).check(value);
			}
			else {
				pdfForm.getCheckBox(fieldName).uncheck(value);
			}
		});

		const blob = new Blob(
			[new Uint8Array(await pdfDoc.save())],
			{type: "application/pdf"}
		);
		const link = document.createElement('a');
		link.href=window.URL.createObjectURL(blob);
		link.download=outputFileName;
		link.click();

		plausible(this.trackAs, { props: { stage: 'download' }});
	},
	loadPDFLib() {
		if(pdfLibScriptPromise) {
			return pdfLibScriptPromise;
		}

		pdfLibScriptPromise = new Promise(function(resolve, reject) {
			const script = document.createElement('script');
			let resolved = false;
			script.type = 'text/javascript';
			script.src = '/js/pdflib.js';
			script.async = true;
			script.onerror = function(err) {
				reject(err, s);
			};
			script.onload = script.onreadystatechange = function() {
				if (!resolved && (!this.readyState || this.readyState == 'complete')) {
					resolved = true;
					resolve();
				}
			};
			const t = document.getElementsByTagName('script')[0];
			t.parentElement.insertBefore(script, t);
		});
		return pdfLibScriptPromise;
	}
};
{% endraw %}{% endjs %}