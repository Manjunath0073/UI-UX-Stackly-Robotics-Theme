/**
 * STACKLY Robotics - Homepage Interactions
 */

document.addEventListener('DOMContentLoaded', function () {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mainNav = document.getElementById('mainNav');

  // Mobile menu toggle
  if (mobileMenuToggle && mainNav) {
    function openMenu() {
      mainNav.classList.add('is-open');
      mobileMenuToggle.classList.add('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      mainNav.classList.remove('is-open');
      mobileMenuToggle.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    mobileMenuToggle.addEventListener('click', function () {
      if (mainNav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu when clicking a nav link (mobile)
    const navLinks = mainNav.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (mainNav.classList.contains('is-open') &&
          !mainNav.contains(e.target) &&
          !mobileMenuToggle.contains(e.target)) {
        closeMenu();
      }
    });

    // Close menu with ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeMenu();
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

  // Footer newsletter form: validate email, then show success message
  const footerNewsForm = document.getElementById('footerNewsForm');
  if (footerNewsForm) {
    const emailInput = document.getElementById('footerNewsEmail');
    const success = document.getElementById('footerNewsSuccess');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    footerNewsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const value = emailInput ? emailInput.value.trim() : '';

      if (!value || !emailRe.test(value)) {
        if (emailInput) {
          emailInput.classList.add('has-error');
          emailInput.focus();
        }
        return;
      }

      if (emailInput) emailInput.classList.remove('has-error');
      if (emailInput) emailInput.value = '';

      if (success) {
        success.textContent = 'Subscribed. Welcome to the Stackly network.';
        success.classList.add('show');
        clearTimeout(success._t);
        success._t = setTimeout(function () {
          success.classList.remove('show');
        }, 3000);
      }
    });

    if (emailInput) {
      emailInput.addEventListener('input', function () {
        emailInput.classList.remove('has-error');
      });
    }
  }
});
