{% js %}
function formatPercent(num, addSymbol=true) {
	const formattedNum = num.toLocaleString('en-GB', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 3,
	});
	return addSymbol ? `${formattedNum}%` : formattedNum;
}

function formatTimeDelta(date1, date2){
	const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
	const differenceInMilliseconds = date2.getTime() - date1.getTime();
	const weekCount = Math.round(differenceInMilliseconds / millisecondsPerWeek);
	if(weekCount > 8){
		const years = date2.getFullYear() - date1.getFullYear();
		const months = date2.getMonth() - date1.getMonth();
		const monthCount = (years * 12 + months);
		return monthCount + (monthCount === 1 ? ' month' : ' months');
	}
	else if(weekCount === 0){
		return 'a few days';
	}
	else if(weekCount < 0){
		return 'an unknown time';
	}
	return weekCount + (weekCount === 1 ? ' week' : ' weeks');
}
{% endjs %}