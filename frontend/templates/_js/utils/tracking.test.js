{% include '_js/libs/chai.js' %}
{% include '_js/libs/mocha.js' %}
{% include '_js/tracking.js' %}
{% js %}
describe('shouldTrackUrl', () => {
	it('Should track /out links', function() {
		assert.equal(shouldTrackUrl('/out/hello-world'), true);
	});
	it('Should track regular external links', function() {
		assert.equal(shouldTrackUrl('http://google.com/out/test'), true);
		assert.equal(shouldTrackUrl('https://google.com/out/test'), true);
		assert.equal(shouldTrackUrl('http://google.com/'), true);
		assert.equal(shouldTrackUrl('https://google.com/'), true);
		assert.equal(shouldTrackUrl('mailto:contact@allaboutberlin.com'), true);
	});
	it('Should not track internal links', function() {
		assert.equal(shouldTrackUrl('/guides/hello-world'), false);
		assert.equal(shouldTrackUrl('/'), false);
		assert.equal(shouldTrackUrl('https://allaboutberlin.com/guides/hello-world'), false);
		assert.equal(shouldTrackUrl('https://allaboutberlin.com/'), false);
	});
});
{% endjs %}