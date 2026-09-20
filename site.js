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

// Chatbot demonstrativo guiado
const widget = document.getElementById('chatbotWidget');
const panel = document.getElementById('chatbotPanel');
const launch = document.getElementById('chatbotLaunch');
const closeBtn = document.getElementById('chatbotClose');
const input = document.getElementById('chatbotInput');
const sendBtn = document.getElementById('chatbotSend');
const conversation = document.getElementById('chatbotConversation');
const quickActions = document.getElementById('chatbotQuickActions');

function openPanel() {
  panel.classList.remove('hidden');
  widget.classList.add('open');
}
function closePanel() {
  panel.classList.add('hidden');
  widget.classList.remove('open');
}
function botMessage(text){
  const p=document.createElement('div');
  p.className='bot-message';
  p.textContent=text;
  conversation.appendChild(p);
  conversation.scrollTop=conversation.scrollHeight;
}
function userMessage(text){
  const p=document.createElement('div');
  p.className='user-message';
  p.textContent=text;
  conversation.appendChild(p);
  conversation.scrollTop=conversation.scrollHeight;
}
function setActions(actions){
  quickActions.innerHTML='';
  actions.forEach(a=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='chat-chip'+(a.primary?' chat-chip-primary':'');
    b.textContent=a.label;
    b.onclick=a.onClick;
    quickActions.appendChild(b);
  });
}
function initialActions(){
  setActions([
    {label:'Agendamento online',primary:true,onClick:()=>handleAction('schedule')},
    {label:'2ª via de boleto',onClick:()=>handleAction('boleto')},
    {label:'Guia Médico',onClick:()=>handleAction('guide')},
    {label:'Autorizações',onClick:()=>handleAction('authorization')},
    {label:'Outros canais',onClick:()=>handleAction('channels')}
  ]);
}
function handleAction(action){
  if(action==='schedule'){
    userMessage('Agendamento online');
    botMessage('Claro. Você pode reservar data e horário pelo Sem Fila. Se o beneficiário for de outra Unimed, também há opção de atendimento de intercâmbio.');
    setActions([
      {label:'Agendar — Unimed Divinópolis',primary:true,onClick:()=>location.href='agendamento.html'},
      {label:'Agendar — outra Unimed (intercâmbio)',onClick:()=>location.href='agendamento.html?origem=intercambio'},
      {label:'Meus agendamentos',onClick:()=>location.href='agendamento.html#meus'},
      {label:'Voltar',onClick:initialActions}
    ]);
  }
  if(action==='boleto'){
    userMessage('2ª via de boleto');
    botMessage('A 2ª via pode ser resolvida pela IVA, sem necessidade de reservar um horário de atendimento.');
    setActions([
      {label:'Continuar no portal oficial',primary:true,onClick:()=>window.open('https://www.unimed.coop.br/site/web/divinopolis','_blank','noopener')},
      {label:'Voltar',onClick:initialActions}
    ]);
  }
  if(action==='guide'){
    userMessage('Guia Médico');
    botMessage('Posso encaminhar você ao Guia Médico da Unimed Divinópolis.');
    setActions([
      {label:'Abrir Guia Médico',primary:true,onClick:()=>window.open('https://www.unimed.coop.br/site/web/divinopolis/guia-medico','_blank','noopener')},
      {label:'Voltar',onClick:initialActions}
    ]);
  }
  if(action==='authorization'){
    userMessage('Autorizações');
    botMessage('Se precisar conversar com a equipe sobre uma autorização, você pode agendar um atendimento.');
    setActions([
      {label:'Agendar atendimento',primary:true,onClick:()=>location.href='agendamento.html'},
      {label:'Voltar',onClick:initialActions}
    ]);
  }
  if(action==='channels'){
    userMessage('Outros canais');
    botMessage('Você também pode consultar os demais canais de atendimento disponíveis no portal oficial.');
    setActions([
      {label:'Ver canais de atendimento',primary:true,onClick:()=>window.open('https://www.unimed.coop.br/site/web/divinopolis/canais-de-atendimento','_blank','noopener')},
      {label:'Voltar',onClick:initialActions}
    ]);
  }
}
if (launch) launch.addEventListener('click', openPanel);
if (closeBtn) closeBtn.addEventListener('click', closePanel);
document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>handleAction(btn.dataset.action)));

function sendChat() {
  const raw=(input?.value||'').trim();
  const text=raw.toLowerCase();
  if(!text) return;
  userMessage(raw);
  input.value='';
  if(text.includes('agend') || text.includes('horário') || text.includes('horario')) return handleAction('schedule');
  if(text.includes('boleto') || text.includes('fatura')) return handleAction('boleto');
  if(text.includes('médico') || text.includes('medico') || text.includes('guia')) return handleAction('guide');
  if(text.includes('autoriza')) return handleAction('authorization');
  if(text.includes('intercâmbio') || text.includes('intercambio') || text.includes('outra unimed')){
    botMessage('Para beneficiário de outra Unimed, use o fluxo de intercâmbio.');
    return setActions([
      {label:'Agendar atendimento de intercâmbio',primary:true,onClick:()=>location.href='agendamento.html?origem=intercambio'},
      {label:'Voltar',onClick:initialActions}
    ]);
  }
  botMessage('Posso ajudar com agendamento online, 2ª via de boleto, Guia Médico, autorizações ou outros canais.');
  initialActions();
}
if(sendBtn) sendBtn.addEventListener('click',sendChat);
if(input) input.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});
