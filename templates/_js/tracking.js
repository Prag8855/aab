{% js %}

const plausibleFallback = function() { (window.plausible.q = window.plausible.q || []).push(arguments) };
window.plausible = window.plausible || plausibleFallback;

function getLinkEl(l) {
	while (l && (typeof l.tagName === 'undefined' || l.tagName.toLowerCase() !== 'a' || !l.href)) {
		l = l.parentNode
	}
	return l;
}

function getNearestHeading(el){
	const articleBody = document.querySelector('.article-body');
	if(articleBody && articleBody.contains(el)){
		return Array.from(articleBody.querySelectorAll(':scope > :is(h2,h3,h4)'))
			.findLast(h => el.compareDocumentPosition(h) === Node.DOCUMENT_POSITION_PRECEDING);
	}
}

function openLinkAfterTracking(e, link) {
	// If default has been prevented by an external script, Plausible should not intercept navigation.
	if (e.defaultPrevented) { return false }
	const targetsCurrentWindow = !link.target || link.target.match(/^_(self|parent|top)$/i);
	const isRegularClick = !(e.ctrlKey || e.metaKey || e.shiftKey) && e.type === 'click';
	return targetsCurrentWindow && isRegularClick;
}

function shouldTrackUrl(url){
	return (
		url.startsWith('/out/')
		|| url.startsWith('{{ site_url }}/out/')
		|| url.startsWith('{{ site_url }}/donate')
		|| url.startsWith('mailto:')
		|| (url.startsWith('http') && !url.startsWith('{{ site_url }}' || '/'))
	);
}

const middleMouse = 1;

function handleLinkClick(e) {
	if (e.type === 'auxclick' && e.button !== middleMouse) { return }
	const link = getLinkEl(e.target);
	if (link && shouldTrackUrl(link.href)) {
		const nearestHeading = getNearestHeading(link);
		return sendLinkClickEvent(e, link, 'Outbound Link: Click', { url: link.href, pageSection: nearestHeading ? `#${nearestHeading.id}` : null });
	}
}

function sendLinkClickEvent(event, link, eventName, eventProps) {
	let followedLink = false;
	function followLink() {
		if (!followedLink) {
			followedLink = true;
			window.location = link.href;
		}
	}
	if (openLinkAfterTracking(event, link)) {
		plausible(eventName, { props: eventProps, callback: followLink });

		// Redirect after 1.5s if tracking fails, 0s if plausible script was blocked
		setTimeout(followLink, window.plausible === plausibleFallback ? 0 : 1500);
		event.preventDefault();
	} else {
		plausible(eventName, { props: eventProps });
	}
}

document.addEventListener('click', handleLinkClick);
document.addEventListener('auxclick', handleLinkClick);
{% endjs %}