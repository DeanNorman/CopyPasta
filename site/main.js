// "How it works" step 2: the per-site on/off switch demo.
document.querySelectorAll('.switch').forEach((sw) => {
  sw.addEventListener('click', () => {
    sw.setAttribute('aria-pressed', String(sw.getAttribute('aria-pressed') !== 'true'));
  });
});
