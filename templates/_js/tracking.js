{% js %}
window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };

// Log frontend errors to the server
window.addEventListener('error', e => {
	try{
		if(e.message.includes('r["@context"]')){  // Safari JSON-LD parsing error
			return;
		}
		navigator.sendBeacon(
			'/api/error', 
			`${e.filename.replace('{{ site_url }}', '')}:${e.lineno}.${e.colno} - ${e.message}`
		);
		console.warn('An error occured. A brief, anonymous error report was sent to All About Berlin. No personal data was sent.')
	} catch(e) {
		console.error(e, e.stack);
	}
})

function getLinkEl(l) {
	while (l && (typeof l.tagName === 'undefined' || l.tagName.toLowerCase() !== 'a' || !l.href)) {
		l = l.parentNode
	}
	return l;
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
		|| url.startsWith('mailto:')
		|| (url.startsWith('http') && !url.startsWith('{{ site_url }}' || '/'))
	);
}

const middleMouse = 1;

function handleLinkClick(e) {
	if (e.type === 'auxclick' && e.button !== middleMouse) { return }
	const link = getLinkEl(e.target);
	if (link && shouldTrackUrl(link.href)) {
		return sendLinkClickEvent(e, link, 'Outbound Link: Click', { url: link.href });
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
		setTimeout(followLink, 1500);
		event.preventDefault();
	} else {
		plausible(eventName, { props: eventProps });
	}
}

document.addEventListener('click', handleLinkClick);
document.addEventListener('auxclick', handleLinkClick);
{% endjs %}