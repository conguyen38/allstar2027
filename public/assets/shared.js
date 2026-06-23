function toggleMobileMenu() {
  var menu = document.getElementById('mobile-menu');
  var h1 = document.getElementById('ham-1');
  var h2 = document.getElementById('ham-2');
  var h3 = document.getElementById('ham-3');
  var open = menu.classList.toggle('hidden');

  if (!open) {
    h1.style.transform = 'rotate(45deg) translate(4px,4px)';
    h2.style.opacity = '0';
    h3.style.transform = 'rotate(-45deg) translate(4px,-4px)';
    document.body.style.overflow = 'hidden';
  } else {
    h1.style.transform = '';
    h2.style.opacity = '';
    h3.style.transform = '';
    document.body.style.overflow = '';
  }
}
