// Postać z monetą nad stopką strony startowej. Kliknięcie lub Enter zabiera monetę (leci za kursorem), drugie oddaje.
(() => {
  const root = document.getElementById('znalazles');
  const slot = root.querySelector('.slot');
  const bubble = root.querySelector('.zn-bubble');
  const img = root.querySelector('.held-logo');

  // moneta, która leci za kursorem po zabraniu
  const stolen = document.createElement('div');
  stolen.className = 'zn-stolen zn-no-logo';
  stolen.innerHTML = '<div class="zn-c-layer zn-c-front"></div>';
  document.body.appendChild(stolen);

  const apply = src => {
    img.setAttribute('href', src);
    [root, stolen].forEach(el => { el.style.setProperty('--coin-logo', `url("${src}")`); el.classList.remove('zn-no-logo'); });
  };
  const m = getComputedStyle(root).getPropertyValue('--coin-logo').match(/url\(["']?(.*?)["']?\)/);
  const logo = root.dataset.logo || (m && m[1]);
  if (logo) apply(logo);

  const CALM = 'Znalazłeś już?';
  const ANGRY = ['Oddawaj monetę!', 'Zapłacisz mi za to!'];
  let taken = false, timer, n = 0, calmTimer;

  const move = e => {
    const p = e.touches ? e.touches[0] : e;
    stolen.style.transform = `translate(${p.clientX}px, ${p.clientY}px)`;
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('touchmove', move, {passive:true});

  function toggle(e){
    taken = !taken;
    clearInterval(timer); clearTimeout(calmTimer);
    root.classList.toggle('taken', taken);
    stolen.classList.toggle('on', taken);
    if (taken){
      if (e && e.clientX !== undefined) move(e);
      n = 0; bubble.textContent = ANGRY[0];
      timer = setInterval(() => bubble.textContent = ANGRY[++n % ANGRY.length], 1800);
      slot.setAttribute('aria-label', 'Oddaj mu monetę');
    } else {
      bubble.textContent = 'No ja myślę.';
      calmTimer = setTimeout(() => bubble.textContent = CALM, 1600);
      slot.setAttribute('aria-label', 'Zabierz mu monetę');
    }
  }
  slot.addEventListener('click', toggle);
  slot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
})();
