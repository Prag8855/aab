{% js %}
function formatLongDate(date, includeSameYear=false){
	if(date) {
		const dateObj = (date instanceof Date) ? date : dateFromString(date);
		const yearParam = {};
		if(includeSameYear || dateObj.getFullYear() !== new Date().getFullYear()){
			yearParam.year = 'numeric';
		}
		return dateObj.toLocaleDateString("en-US", {
			...yearParam,
			month: 'long',
			day: 'numeric',
		});
	}
	return '';
}
{% endjs %}