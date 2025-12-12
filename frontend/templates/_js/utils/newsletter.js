{% js %}
function addNewsletterSubscriber(email) {
    return fetch('https://api.buttondown.com/v1/subscribers', {
        method: "POST",
        headers: {Authorization: "Token 8d5ff238-3a45-4e17-a129-0f1fcbe9b97f"},
        body: JSON.stringify({email_address: email}),
    });
}
{% endjs %}