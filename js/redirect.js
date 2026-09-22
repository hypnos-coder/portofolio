// Keep the site root working while the portfolio pages live in html/.
const destination = new URL('html/index.html', window.location.href);
destination.search = window.location.search;
destination.hash = window.location.hash;
window.location.replace(destination.href);
