{% js %}
/* Creates plausible() function */
const t0 = performance.now();
window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };

function validateForm(formElement) {
  let formIsValid = true;

  const honeypotField = formElement.querySelector('input[name="username"]');
  formElement.querySelectorAll('input, textarea, select').forEach(function(input) {
    if(input !== honeypotField && !input.checkValidity()) {
      formIsValid = false;
    }
  });
  if(honeypotField && honeypotField.value){
    formIsValid = false; // Rudimentary bot prevention
  }
  formElement.classList.add('show-errors', !formIsValid);
  return formIsValid;
}

window.addEventListener("DOMContentLoaded", function() {
  /* Top bar search*/
  let searchIndex = null;
  let searchDocuments = null;
  let searchResults = [];
  let selectedResultIndex = -1;
  const navSearchBox = document.getElementById('search-box');
  const navResults = document.querySelector('#main-nav .search-results');
  function updateSearchResults(){
    const query = navSearchBox.value.trim();
    if (searchIndex != null && searchDocuments != null && query != ''){
      searchResults = searchIndex.search(`${query}^100 ${query}*^10 ${query}~2`)
        .slice(0, 5).map(r => searchDocuments[r.ref]);
    }
    else {
      searchResults = [];
    }

    selectedResultIndex = -1;
    navResults.textContent = '';
    searchResults.forEach(result => {
      const el = document.createElement('a');
      el.href = result.url;
      el.innerText = result.short_title || result.title || result.german_term;
      navResults.appendChild(el);
    });
  }
  navSearchBox.addEventListener('focus', e => {
    if(searchIndex === null) {
      fetch('/search-index.json')
        .then((response) => response.json())
        .then((data) => {
          searchIndex = lunr.Index.load(data.index);
          searchDocuments = data.documents;
          updateSearchResults();
        });
    }
  });
  navSearchBox.addEventListener('input', e => updateSearchResults());
  navResults.addEventListener('mousedown', e => e.preventDefault());
  navSearchBox.addEventListener('keydown', e => {
    let handleEvent = false;
    if(e.key === "Enter"){
      if(selectedResultIndex === -1) {
        window.location = `{{ site_url }}/search?q=${encodeURIComponent(navSearchBox.value.trim())}`;
      }
      else {
        window.location = searchResults[selectedResultIndex].url;
      }
      handleEvent = true;
    }
    else if(e.key === "ArrowUp"){
      selectedResultIndex = Math.max(selectedResultIndex - 1, -1);
      handleEvent = true;
    }
    else if(e.key === "ArrowDown"){
      selectedResultIndex = Math.min(selectedResultIndex + 1, searchResults.length - 1);
      handleEvent = true;
    }
    else if(e.key === "Escape"){
      navSearchBox.blur();
      handled = true;
    }

    if(handleEvent){
      navResults.childNodes.forEach((el, index) => {
        el.classList.toggle('highlighted', index === selectedResultIndex);
      });
      e.preventDefault();
    }
  });

  /* Fixes align-items: baseline bug in Safari */
  document.querySelectorAll('input, textarea').forEach((input) => {
    input.placeholder = input.placeholder || ' ';
  });

  /* Reviewers */
  document.querySelectorAll('.reviewers-link').forEach(link => {
    link.classList.add('reviewers-collapsed');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      link.classList.toggle('reviewers-collapsed');
      link.classList.toggle('reviewers-expanded');
      document.getElementById('reviewers').classList.toggle('hidden');
    });
  });

  /* Collapsibles */
  document.querySelectorAll(".collapsible").forEach((collapsible, index) => {
    const header = collapsible.querySelector(":scope > .header");
    if(header) {
      // Set initial state and accessibility features
      const collapsibleBody = collapsible.querySelector('.body');
      let isCollapsed = collapsible.classList.contains('collapsed');
      if(collapsibleBody) collapsibleBody.hidden = isCollapsed;
      header.addEventListener('click', (e) => {
        isCollapsed = collapsible.classList.toggle('collapsed');
        if(collapsibleBody) collapsibleBody.hidden = isCollapsed;
      });
    }
  });

  /* Open footnotes when clicking on a footnote link */
  document.querySelectorAll('.footnote-ref').forEach(link => {
    link.addEventListener('click', e => {
      document.getElementById('footnotes').setAttribute("open", "true"); 
    });
  })

  /* Mobile sidebar */
  const sidebarTableOfContents = document.querySelector(".sidebar .table-of-contents")
  if(sidebarTableOfContents){
    const tableOfContentsHeader = sidebarTableOfContents.querySelector("h2");
    if(tableOfContentsHeader) {
      tableOfContentsHeader.addEventListener('click', (e) => {
        sidebarTableOfContents.classList.toggle('expanded');
      });
    }
  }

  /* Expandable lists */
  document.querySelectorAll(".expand").forEach((expandButton, index) => {
    expandButton.classList.remove('hidden');
    expandButton.addEventListener('click', (e) => {
      e.preventDefault();
      expandButton.parentNode.classList.toggle('collapsed');
    })
  });

  /* Outbound links */
  function handleOutRedirect(event) {
    var link = event.target;
    var middle = event.type == "auxclick" && event.which == 2;
    var click = event.type == "click";
      while(link && (typeof link.tagName == 'undefined' || link.tagName.toLowerCase() != 'a' || !link.href)) {
        link = link.parentNode
      }

      if (link && link.href && link.host && link.host === location.host && link.pathname && (link.pathname.startsWith('/out/') || link.pathname === '/donate')) {
        if (middle || click)
        plausible('Outbound Link: Click', {props: {url: link.href}})

        if(!link.target || link.target.match(/^_(self|parent|top)$/i)) {
          if (!(event.ctrlKey || event.metaKey || event.shiftKey) && click) {
            setTimeout(function() {
              location.href = link.href;
            }, 150);
            event.preventDefault();
          }
        }
      }
  }
  document.addEventListener('click', handleOutRedirect);
  document.addEventListener('auxclick', handleOutRedirect);

  /* Sidebar */
  const main = document.querySelector('main');
  const articleBody = main.querySelector('.article-body');
  const bodyTableOfContents = articleBody && articleBody.querySelector('.table-of-contents');
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

    sidebarLinks.forEach(l => l.parentElement.classList.toggle('current', l === highlightedLink));

    if(highlightedLink) {
      const parentSection = highlightedLink.parentElement.parentElement.parentElement;
      if (parentSection && parentSection.classList.contains('collapsed')) {
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

{% include "js/currency.js" %}
{% endjs %}