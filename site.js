const slides = [...document.querySelectorAll('.carousel-slide')];
const dotsBox = document.getElementById('carouselDots');
let current = 0;
let timer;

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
  dot.addEventListener('click', () => goTo(i, true));
  dotsBox.appendChild(dot);
});

function render() {
  slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
  [...dotsBox.children].forEach((dot, i) => dot.classList.toggle('active', i === current));
}
function goTo(i, restart = false) {
  current = (i + slides.length) % slides.length;
  render();
  if (restart) startAuto();
}
function startAuto() {
  clearInterval(timer);
  timer = setInterval(() => goTo(current + 1), 6500);
}
document.getElementById('carouselPrev').addEventListener('click', () => goTo(current - 1, true));
document.getElementById('carouselNext').addEventListener('click', () => goTo(current + 1, true));
render();
startAuto();
