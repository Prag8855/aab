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

function isoDay(date){
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');

	return `${yyyy}-${mm}-${dd}`;
}

function isoMonth(date){
	return isoDay(date).slice(0, 7);
}
{% endjs %}