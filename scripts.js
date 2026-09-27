(() => {
  'use strict';

  document.documentElement.classList.add('js');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-nav');
  const mobile = window.matchMedia('(max-width: 800px)');

  const closeMenu = (returnFocus = false) => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuButton.focus();
  };

  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });

  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());

  const roles = Array.from(document.querySelectorAll('.role'));
  const expandAll = document.querySelector('.expand-all');
  const expandLabel = expandAll.querySelector('.expand-all-label');
  const expandIcon = expandAll.querySelector('.icon-arrow');
  expandAll.hidden = false;
  const updateExpandLabel = () => {
    const allOpen = roles.every(role => role.open);
    expandLabel.textContent = `${allOpen ? 'Collapse' : 'Expand'} all roles`;
    expandIcon.classList.toggle('icon-arrow-up', allOpen);
  };
  expandAll.addEventListener('click', () => {
    const shouldOpen = !roles.every(role => role.open);
    roles.forEach(role => { role.open = shouldOpen; });
    updateExpandLabel();
  });
  roles.forEach(role => role.addEventListener('toggle', updateExpandLabel));

  // Keep the reader's place in the navigation as they move down the page.
  if ('IntersectionObserver' in window) {
    const links = Array.from(navigation.querySelectorAll('a'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('#top, #about, #experience, #approach, #skills, #certifications, #contact').forEach(section => observer.observe(section));
  }

  // Print all experience details, then restore the reader's expanded roles.
  let beforePrintState;
  window.addEventListener('beforeprint', () => {
    beforePrintState = roles.map(role => role.open);
    roles.forEach(role => { role.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (beforePrintState) roles.forEach((role, index) => { role.open = beforePrintState[index]; });
  });
})();
