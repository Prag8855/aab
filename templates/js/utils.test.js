describe('formatCurrency', () => {
	const testCases = [
		{
			args: [1234567.89, true],
			output: '1,234,567.89 €',
		},
		{
			args: [1234567.89, true, '$'],
			output: '1,234,567.89 $',
		},
		{
			args: [1234567.89, true, null],
			output: '1,234,567.89',
		},
		{
			args: [1234567.89, false],
			output: '1,234,568 €',
		},
		{
			args: [1234567.89, false, '$'],
			output: '1,234,568 $',
		},
		{
			args: [567.89, false],
			output: '568 €',
		},
		{
			args: [567.89, true],
			output: '567.89 €',
		},
		{
			args: [4567.89, false],
			output: '4,568 €',
		},
		{
			args: [4567.89, true],
			output: '4,567.89 €',
		},
		{
			args: [1234567.89, false, null],
			output: '1,234,568',
		},
		{
			args: [7.84 + 4.28, true, null], // Floating error test
			output: '12.12',
		},
		{
			args: [-0.0002, true, null], // "-0.00" test
			output: '0.00',
		},
		{
			args: [-0.01, true, null],
			output: '-0.01',
		},
		{
			args: [-0.01, false, null],
			output: '0',
		},
	];

	testCases.forEach(testCase => {
		it(`calculates the correct values`, function() {
			const output = formatCurrency(...testCase.args);
			assert.equal(output, testCase.output);
		});
	});
});

describe('formatTimeDelta', () => {
	const testCases = [
		// Weeks, from start of month
		{
			args: [new Date('2020-03-01'), new Date('2020-04-26')],
			output: '8 weeks',  // exactly 8 weeks
		},
		{
			args: [new Date('2020-03-01'), new Date('2020-04-29')],
			output: '8 weeks',  // 8 weeks, 3 days
		},
		{
			args: [new Date('2020-03-01'), new Date('2020-04-30')],
			output: '1 month',  // 8 weeks, 4 days
		},
		{
			args: [new Date('2020-03-01'), new Date('2020-05-01')],
			output: '2 months',  // 2 months
		},
		{
			args: [new Date('2020-03-01'), new Date('2020-05-03')],
			output: '2 months',  // 9 weeks
		},

		// Weeks, from end of feb
		{
			args: [new Date('2021-02-28'), new Date('2021-04-26')],
			output: '8 weeks',  // exactly 8 weeks
		},
		{
			args: [new Date('2021-02-28'), new Date('2021-04-27')],
			output: '8 weeks',  // 8 weeks, 3 days
		},
		{
			args: [new Date('2021-02-28'), new Date('2021-04-28')],
			output: '8 weeks',  // 8 weeks, 4 days
		},
		{
			args: [new Date('2021-02-28'), new Date('2021-04-29')],
			output: '2 months',  // 8 weeks, 5 days
		},
		{
			args: [new Date('2021-02-28'), new Date('2021-04-30')],
			output: '2 months',  // 8 weeks, 6 days
		},


		{
			args: [new Date('2020-03-01'), new Date('2020-06-01')],
			output: '3 months',
		},
		{
			args: [new Date('2020-03-01'), new Date('2020-09-01')],
			output: '6 months',
		},
		{
			args: [new Date('2020-03-01'), new Date('2021-03-01')],
			output: '12 months',
		},
	];
	testCases.forEach(testCase => {
		it(`return the correct value`, function() {
			const output = formatTimeDelta(...testCase.args);
			assert.equal(output, testCase.output, testCase.args);
		});
	});
});