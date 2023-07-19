{% js %}
window.addEventListener("DOMContentLoaded", function() {
	/* Sidebar */
	const main = document.querySelector('main');
	const articleBody = main.querySelector('.article-body');
	const bodyTableOfContents = articleBody && articleBody.querySelector('.table-of-contents');
	const sidebarTableOfContents = document.querySelector('.sidebar .table-of-contents');
	const sidebarLinks = Array.from(document.querySelectorAll('.sidebar .table-of-contents li a:not(.expand)'));
	sidebarLinks.forEach((link, index) => {
		link.addEventListener('click', (e) => {
			sidebarTableOfContents.classList.add('collapsed');
		});
	});
	const sectionHeaders = document.querySelectorAll('.article-body h2, .article-body h3');
	const headerMap = sidebarLinks.reduce((map, link) => {
		if(link.hash) {
			map[link.hash] = document.querySelector(link.hash);
		}
		return map;
	}, {});
	function onScroll() {
		const mainSectionIsInFocus = main.getBoundingClientRect().top <= 0;

		let highlightedLink = null;

		if(mainSectionIsInFocus) {
			highlightedLink = (
				// First visible header
				sidebarLinks.find(link => {
					const header = headerMap[link.hash];
					if(!header) { return false }
					const headerBoundingRect = header.getBoundingClientRect();
					const headerIsInView = headerBoundingRect.bottom > 0 && headerBoundingRect.top < window.innerHeight;
					return headerIsInView;
				})
				||
				// Nearest invisible header (for long sections)
				sidebarLinks
					.filter(link => {
						const header = headerMap[link.hash];
						if(!header) { return false }
						const hasScrolledPastHeader = header.getBoundingClientRect().bottom < 0;
						return hasScrolledPastHeader;
					})
					.sort((linkA, linkB) => {
						return linkB.getBoundingClientRect().top - linkA.getBoundingClientRect().top
					})[0]
			);
		}

		if(highlightedLink) {
			sidebarLinks.forEach(l => l.parentElement.classList.toggle('current', l === highlightedLink));

			const parentSection = highlightedLink.parentElement.parentElement.parentElement;
			if (parentSection && !parentSection.classList.contains('expanded')) {
				parentSection.classList.add('current');
			}
		}

		const tableOfContentsIsInView = (
			bodyTableOfContents
			&& bodyTableOfContents.getBoundingClientRect().bottom <= 0
		);
		if(sidebarTableOfContents) {
			sidebarTableOfContents.classList.toggle('visible', tableOfContentsIsInView);
		}
	};
	onScroll();
	window.addEventListener("scroll", function(e) { window.requestAnimationFrame(onScroll); });
});
{% endjs %}