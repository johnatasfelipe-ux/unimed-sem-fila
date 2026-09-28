const slides = [...document.querySelectorAll('.carousel-slide')];
const dotsBox = document.getElementById('carouselDots');
let current = 0;
let timer;

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Ir para o slide ${i+1}`);
  dot.addEventListener('click', ()=> goTo(i, true));
  dotsBox.appendChild(dot);
});
function renderCarousel(){
  slides.forEach((s,i)=> s.classList.toggle('active', i===current));
  [...dotsBox.children].forEach((d,i)=> d.classList.toggle('active', i===current));
}
function goTo(i, restart=false){
  current = (i + slides.length) % slides.length;
  renderCarousel();
  if(restart) startAuto();
}
function startAuto(){ clearInterval(timer); timer=setInterval(()=>goTo(current+1), 6000); }
document.getElementById('carouselPrev').onclick=()=>goTo(current-1,true);
document.getElementById('carouselNext').onclick=()=>goTo(current+1,true);
renderCarousel(); startAuto();

const panel = document.getElementById('chatbotPanel');
document.getElementById('chatbotLaunch').onclick = ()=> panel.classList.remove('hidden');
document.getElementById('chatbotClose').onclick = ()=> panel.classList.add('hidden');
function handleAction(action){
  if(action==='agendamento') window.location.href='agendamento.html';
  else if(action==='boleto') window.open('https://www.unimed.coop.br/site/web/divinopolis','_blank','noopener');
  else if(action==='intercambio') window.location.href='agendamento.html?origem=intercambio';
  else if(action==='guia') window.open('https://www.unimed.coop.br/site/web/divinopolis/guia-medico','_blank','noopener');
}
document.querySelectorAll('.chat-suggestion').forEach(btn=> btn.onclick=()=> handleAction(btn.dataset.action));
document.getElementById('chatbotSendVisual').onclick = ()=> handleAction('agendamento');
