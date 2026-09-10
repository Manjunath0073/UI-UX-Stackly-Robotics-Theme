/**
 * STACKLY Robotics - Homepage Interactions
 */

document.addEventListener('DOMContentLoaded', function () {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mainNav = document.getElementById('mainNav');

  // Mobile menu toggle
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function () {
      const isOpen = mainNav.classList.toggle('is-open');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking a nav link (mobile)
    const navLinks = mainNav.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (mainNav.classList.contains('is-open') &&
          !mainNav.contains(e.target) &&
          !mobileMenuToggle.contains(e.target)) {
        mainNav.classList.remove('is-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // FAQ accordion: only one item open at a time
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (otherItem) {
          if (otherItem !== item && otherItem.open) {
            otherItem.open = false;
          }
        });
      }
    });
  });

  // Header shadow on scroll
  const header = document.querySelector('.site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 20) {
      header.style.backgroundColor = '#ffffff';
      header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
    } else {
      header.style.backgroundColor = '#ffffff';
      header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });
});
