{% js %}
function formatPercent(num, addSymbol=true) {
	const formattedNum = num.toLocaleString('en-GB', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 3,
	});
	return addSymbol ? `${formattedNum}%` : formattedNum;
}
{% endjs %}