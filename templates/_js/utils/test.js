{% js %}
function hasFlags(output, expectedFlags){
	const expectedFlagsSet = new Set(expectedFlags);
	const sameFlags = (expectedFlagsSet.size === output.flags.size) && [...output.flags].every(flag => expectedFlagsSet.has(flag));
	return assert(sameFlags, `Expected flags ${[...expectedFlagsSet]}, got ${[...output.flags]}`);
};
function hasFlag(output, flag){
	return () => assert(output.flags.has(flag), `Output has no "${flag}" flag. Flags are: ${[...output.flags].join(', ')}`);
};
function notHasFlag(output, flag){
	return () => assert(!output.flags.has(flag), `Output has unexpected "${flag}" flag`);
};
function yearsAgo(yearCount){
	return ((date) => date.setFullYear(date.getFullYear() - yearCount) && date)(new Date())
}
{% endjs %}