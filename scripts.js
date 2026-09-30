(() => {
  'use strict';

  document.documentElement.classList.add('js');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-nav');
  const mobile = window.matchMedia('(max-width: 1080px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Trace the existing illustration once when it first enters view.
  const connectionArt = document.querySelector('.connection-art');
  if (connectionArt && !reducedMotion.matches && 'IntersectionObserver' in window) {
    const artObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      if (!reducedMotion.matches) connectionArt.classList.add('is-tracing');
      artObserver.disconnect();
    }, { threshold: .25 });
    artObserver.observe(connectionArt);
  }

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
  const expandLabel = expandAll?.querySelector('.expand-all-label');
  const expandIcon = expandAll?.querySelector('.icon-arrow');
  const roleStates = new Map(roles.map(role => [role, {
    summary: role.querySelector('summary'),
    body: role.querySelector('.role-body'),
    targetOpen: role.open,
    animation: null
  }]));
  if (expandAll) expandAll.hidden = false;
  const updateExpandLabel = () => {
    if (!expandAll) return;
    const allOpen = roles.every(role => roleStates.get(role).targetOpen);
    expandLabel.textContent = `${allOpen ? 'Collapse' : 'Expand'} all roles`;
    expandIcon.classList.toggle('icon-arrow-up', allOpen);
  };

  const finishRole = role => {
    const state = roleStates.get(role);
    if (state.animation) {
      state.animation.cancel();
      state.animation = null;
    }
    role.open = state.targetOpen;
    state.summary.setAttribute('aria-expanded', String(state.targetOpen));
    state.body.inert = false;
    role.classList.remove('is-animating', 'is-closing');
    updateExpandLabel();
  };

  const setRoleOpen = (role, shouldOpen, animate = true) => {
    const state = roleStates.get(role);
    if (animate && state.targetOpen === shouldOpen) return;
    state.targetOpen = shouldOpen;
    if (!shouldOpen && state.body.contains(document.activeElement)) {
      state.summary.focus({ preventScroll: true });
    }
    if (!animate || reducedMotion.matches || !state.body.animate) {
      finishRole(role);
      return;
    }

    // Measure the visible height before cancelling so rapid clicks reverse smoothly.
    const startHeight = role.open ? state.body.getBoundingClientRect().height : 0;
    const startPadding = role.open ? getComputedStyle(state.body).paddingBottom : '0px';
    if (state.animation) state.animation.cancel();
    role.open = true;
    const endHeight = shouldOpen ? state.body.getBoundingClientRect().height : 0;
    const endPadding = shouldOpen ? getComputedStyle(state.body).paddingBottom : '0px';
    state.summary.setAttribute('aria-expanded', String(shouldOpen));
    state.body.inert = !shouldOpen;
    role.classList.add('is-animating');
    role.classList.toggle('is-closing', !shouldOpen);
    const animation = state.body.animate([
      { height: `${startHeight}px`, paddingBottom: startPadding },
      { height: `${endHeight}px`, paddingBottom: endPadding }
    ], {
      duration: Math.min(320, Math.max(180, Math.abs(endHeight - startHeight) * .45)),
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'both'
    });
    state.animation = animation;
    animation.onfinish = () => {
      if (state.animation === animation) finishRole(role);
    };
    updateExpandLabel();
  };

  roles.forEach(role => {
    const state = roleStates.get(role);
    state.summary.setAttribute('aria-expanded', String(role.open));
    state.summary.addEventListener('click', event => {
      event.preventDefault();
      setRoleOpen(role, !state.targetOpen);
    });
    role.addEventListener('toggle', () => {
      if (!state.animation) {
        state.targetOpen = role.open;
        state.summary.setAttribute('aria-expanded', String(role.open));
      }
      updateExpandLabel();
    });
  });
  expandAll?.addEventListener('click', () => {
    const shouldOpen = !roles.every(role => roleStates.get(role).targetOpen);
    roles.forEach(role => setRoleOpen(role, shouldOpen));
  });

  // Release measured heights when the layout or motion preference changes.
  const finishRoleAnimations = () => {
    roles.forEach(role => {
      if (roleStates.get(role).animation) finishRole(role);
    });
  };
  window.addEventListener('resize', finishRoleAnimations);
  reducedMotion.addEventListener('change', () => {
    finishRoleAnimations();
    if (reducedMotion.matches && connectionArt) connectionArt.classList.remove('is-tracing');
  });

  // Keep the reader's place in the navigation as they move down the page.
  if ('IntersectionObserver' in window) {
    const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('#top, #about, #experience, #skills, #certifications, #contact').forEach(section => observer.observe(section));
  }

  // Print all experience details, then restore the reader's expanded roles.
  let beforePrintState;
  window.addEventListener('beforeprint', () => {
    beforePrintState = roles.map(role => roleStates.get(role).targetOpen);
    roles.forEach(role => setRoleOpen(role, true, false));
  });
  window.addEventListener('afterprint', () => {
    if (beforePrintState) roles.forEach((role, index) => setRoleOpen(role, beforePrintState[index], false));
    beforePrintState = null;
  });
})();
