export const hasFlags = (output, expectedFlags) => {
	const expectedFlagsSet = new Set(expectedFlags);
	const sameFlags = (expectedFlagsSet.size === output.flags.size) && [...output.flags].every(flag => expectedFlagsSet.has(flag));
	return assert(sameFlags, `Expected flags ${[...expectedFlagsSet]}, got ${[...output.flags]}`);
};
export const hasFlag = (output, flag) => {
	return () => assert(output.flags.has(flag), `output has no "${flag}" flag`);
};
export const notHasFlag = (output, flag) => {
	return () => assert(!output.flags.has(flag), `output has unexpected "${flag}" flag`);
};
export function yearsAgo(yearCount) {
	return ((date) => date.setFullYear(date.getFullYear() - yearCount) && date)(new Date())
}
