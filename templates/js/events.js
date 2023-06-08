{% js %}
/* Creates plausible() function */
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
  /* Fixes align-items: baseline bug in Safari */
  document.querySelectorAll('input, textarea').forEach((input) => {
    input.placeholder = input.placeholder || ' ';
  });

  /* Reviewers */
  document.querySelectorAll('.post-reviewers a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      link.classList.toggle('expanded');
      document.getElementById('reviewers').classList.toggle('hidden');
    });
  });

  /* Open footnotes when clicking on a footnote link */
  document.querySelectorAll('.footnote-ref').forEach(link => {
    link.addEventListener('click', e => {
      document.getElementById('footnotes').setAttribute("open", "true"); 
    });
  });

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
});

{% include "js/currency.js" %}
{% endjs %}