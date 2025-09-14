{% js %}
function formatLongDate(date){
	if(date) {
		const dateObj = (date instanceof Date) ? date : dateFromString(date);
		return dateObj.toLocaleDateString("en-US", {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}
	return '';
}
{% endjs %}