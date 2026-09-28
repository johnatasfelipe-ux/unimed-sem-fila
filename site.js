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

const widget = document.getElementById('chatbotWidget');
const panel = document.getElementById('chatbotPanel');
const launch = document.getElementById('chatbotLaunch');
const closeBtn = document.getElementById('chatbotClose');
const input = document.getElementById('chatbotInput');
const sendBtn = document.getElementById('chatbotSend');
const conversation = document.getElementById('chatbotConversation');
const pfBtn = document.getElementById('pfBtn');

function openPanel() {
  panel.classList.remove('hidden');
  widget.classList.add('open');
  input?.focus();
}
function closePanel() {
  panel.classList.add('hidden');
  widget.classList.remove('open');
}
function appendMessage(text, type = 'bot') {
  const div = document.createElement('div');
  div.className = `${type}-message`;
  if (type === 'bot') div.classList.add('large-bot-message');
  div.innerHTML = text;
  conversation.appendChild(div);
  conversation.scrollTop = conversation.scrollHeight;
}
function handleIntent(raw) {
  const text = raw.toLowerCase();
  if (text.includes('sair')) {
    appendMessage(raw, 'user');
    appendMessage('Atendimento encerrado. Se precisar, é só me chamar novamente.', 'bot');
    return;
  }
  if (text.includes('agend') || text.includes('horário') || text.includes('horario')) {
    appendMessage('Quero realizar um agendamento.', 'user');
    appendMessage('Perfeito! Vou encaminhar você para o <strong>Sem Fila</strong>. Se o beneficiário for de outra Unimed, escolha a opção de <strong>intercâmbio</strong> no início do fluxo.', 'bot');
    setTimeout(() => { window.location.href = 'agendamento.html'; }, 900);
    return;
  }
  if (text.includes('boleto') || text.includes('fatura')) {
    appendMessage('Preciso de 2ª via de boleto.', 'user');
    appendMessage('Esse caso pode ser resolvido sem reservar horário. Vou abrir o portal oficial para você continuar com a IVA.', 'bot');
    setTimeout(() => { window.open('https://www.unimed.coop.br/site/web/divinopolis', '_blank', 'noopener'); }, 900);
    return;
  }
  if (text.includes('intercâmbio') || text.includes('intercambio') || text.includes('outra unimed')) {
    appendMessage('Sou beneficiário de outra Unimed.', 'user');
    appendMessage('Certo! Vou direcionar você para o fluxo com identificação de <strong>intercâmbio</strong>.', 'bot');
    setTimeout(() => { window.location.href = 'agendamento.html?origem=intercambio'; }, 900);
    return;
  }
  if (text.includes('guia') || text.includes('médico') || text.includes('medico')) {
    appendMessage('Quero acessar o Guia Médico.', 'user');
    appendMessage('Sem problema. Vou abrir o Guia Médico da Unimed Divinópolis.', 'bot');
    setTimeout(() => { window.open('https://www.unimed.coop.br/site/web/divinopolis/guia-medico', '_blank', 'noopener'); }, 900);
    return;
  }
  appendMessage(raw, 'user');
  appendMessage('Posso ajudar com <strong>agendamento</strong>, <strong>boleto</strong>, <strong>intercâmbio</strong> e <strong>Guia Médico</strong>. Digite uma dessas opções para continuar.', 'bot');
}
if (launch) launch.addEventListener('click', openPanel);
if (closeBtn) closeBtn.addEventListener('click', closePanel);
if (pfBtn) pfBtn.addEventListener('click', () => {
  appendMessage('Pessoa Física (PF)', 'user');
  appendMessage('Perfeito. Agora me diga o que você precisa: <strong>agendamento</strong>, <strong>boleto</strong>, <strong>intercâmbio</strong> ou <strong>guia médico</strong>.', 'bot');
});
if (sendBtn) sendBtn.addEventListener('click', () => {
  const raw = (input?.value || '').trim();
  if (!raw) return;
  input.value = '';
  handleIntent(raw);
});
if (input) input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const raw = (input?.value || '').trim();
    if (!raw) return;
    input.value = '';
    handleIntent(raw);
  }
});
