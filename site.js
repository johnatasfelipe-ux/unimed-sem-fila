const slides=[...document.querySelectorAll('.carousel-slide')];
const dotsBox=document.getElementById('carouselDots');
let current=0,timer;
slides.forEach((_,i)=>{const d=document.createElement('button');d.type='button';d.setAttribute('aria-label',`Ir para o slide ${i+1}`);d.onclick=()=>goTo(i,true);dotsBox.appendChild(d)});
function renderCarousel(){slides.forEach((s,i)=>s.classList.toggle('active',i===current));[...dotsBox.children].forEach((d,i)=>d.classList.toggle('active',i===current))}
function goTo(i,restart=false){current=(i+slides.length)%slides.length;renderCarousel();if(restart)startAuto()}
function startAuto(){clearInterval(timer);timer=setInterval(()=>goTo(current+1),6500)}
document.getElementById('carouselPrev').onclick=()=>goTo(current-1,true);
document.getElementById('carouselNext').onclick=()=>goTo(current+1,true);
renderCarousel();startAuto();

const chat=document.getElementById('ivaChat');
const messages=document.getElementById('ivaMessages');
const topics=document.getElementById('ivaTopics');
const input=document.getElementById('ivaInput');
const send=document.getElementById('ivaSend');
const emojiBtn=document.getElementById('emojiBtn');
const emojiPicker=document.getElementById('emojiPicker');
const emojiGrid=document.getElementById('emojiGrid');
const fileInput=document.getElementById('fileInput');
const attachmentList=document.getElementById('ivaAttachmentList');
const headTitle=document.getElementById('ivaHeadTitle');
const headSubtitle=document.getElementById('ivaHeadSubtitle');
const toast=document.getElementById('siteToast');
let botActivated=false;

function showToast(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
function initialInfoCard(){return `<div class="chat-message bot intro-card">Você já conhece os serviços disponibilizados pelo WhatsApp? Adicione o nosso contato (37) 3229-5200. Você terá acesso a várias opções como: autorização de guias, 2ª via de boleto, extrato de utilização, orçamento de exames e acesso ao guia médico. Vamos conversar? Digite um “Oi” para iniciar nossa conversa...</div>`}
function resetChatOpening(){
  botActivated=false;
  headTitle.innerHTML='Vamos<br>conversar?';
  headSubtitle.style.display='block';
  headSubtitle.innerHTML='Bem vindo ao nosso Chat.<br>Eu sou a Iva. Estou aqui<br>para ajudá-lo.';
  messages.innerHTML=initialInfoCard();
  topics.classList.add('hidden');
  attachmentList.innerHTML='';
  input.value='';
  input.style.height='auto';
  updateSendState();
}
function openChat(){if(chat.classList.contains('hidden')) resetChatOpening();chat.classList.remove('hidden');input.focus()}
function closeChat(){chat.classList.add('hidden');emojiPicker.classList.add('hidden')}
document.getElementById('ivaLaunch').onclick=openChat;
document.getElementById('ivaClose').onclick=closeChat;

function addMessage(text,type='bot'){
  const el=document.createElement('div');el.className=`chat-message ${type}`;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;
}
function activateBot(){
  if(botActivated)return;botActivated=true;
  headTitle.innerHTML='Você está sendo atendido<br>pelo nosso ChatBot';
  headSubtitle.style.display='none';
  addMessage('Olá, tudo bem? 😄 Sou a Iva, assistente virtual da Unimed Divinópolis, estou aqui pra te ajudar com suas dúvidas!');
  addMessage('Escolha um dos assuntos abaixo ou continue digitando sua mensagem.');
  topics.classList.remove('hidden');
}
function waitingThenActivate(){
  if(botActivated)return;
  headTitle.innerHTML='Já iremos atendê-lo<br>Aguarde ...';
  headSubtitle.style.display='none';
  const dots=document.createElement('div');dots.className='typing-dots';dots.textContent='•••';messages.appendChild(dots);messages.scrollTop=messages.scrollHeight;
  setTimeout(()=>{dots.remove();activateBot()},700);
}
function processMessage(raw){
  const text=raw.trim();if(!text)return;
  addMessage(text,'user');input.value='';input.style.height='auto';updateSendState();
  if(!botActivated){waitingThenActivate();return}
  const low=text.toLowerCase();
  if(low.includes('agend')){addMessage('O Agendamento Online está disponível no Sem Fila. Você pode clicar no botão destacado abaixo para escolher assunto, data e horário.');topics.classList.remove('hidden');return}
  if(low.includes('boleto')||low.includes('fatura')){addMessage('Para 2ª via de boleto, utilize os canais digitais sem reservar um horário de atendimento.');return}
  if(low.includes('interc')){addMessage('Para beneficiário de outra Unimed, o Sem Fila possui identificação de intercâmbio no início do agendamento.');return}
  addMessage('Entendi. Você pode continuar digitando sua dúvida ou escolher um dos assuntos abaixo.');
}
function sendCurrent(){processMessage(input.value)}
send.onclick=sendCurrent;
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCurrent()}});
input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,92)+'px';updateSendState()});
function updateSendState(){send.classList.toggle('ready',input.value.trim().length>0)}

const emojis=['😀','😃','😄','😁','😊','😉','😍','🥰','😎','🤗','🤔','😕','😢','😭','😡','👍','👎','👏','🙏','✅','❤️','💚','📎','📄','📅','⏰','💬'];
emojis.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=()=>{input.value+=e;input.focus();emojiPicker.classList.add('hidden');updateSendState()};emojiGrid.appendChild(b)});
emojiBtn.onclick=e=>{e.stopPropagation();emojiPicker.classList.toggle('hidden')};
emojiPicker.onclick=e=>e.stopPropagation();
document.addEventListener('click',e=>{if(!emojiPicker.classList.contains('hidden')&&!e.target.closest('.emoji-anchor'))emojiPicker.classList.add('hidden')});

document.getElementById('clipBtn').onclick=()=>fileInput.click();
fileInput.onchange=()=>{[...fileInput.files].forEach(f=>{const chip=document.createElement('span');chip.className='attachment-chip';chip.textContent=`📎 ${f.name}`;attachmentList.appendChild(chip)});if(fileInput.files.length)showToast(`${fileInput.files.length} arquivo(s) selecionado(s)`) };

document.querySelectorAll('.iva-topic').forEach(btn=>btn.onclick=()=>{
  const topic=btn.dataset.topic;
  if(topic==='agendamento'){window.location.href='agendamento.html';return}
  if(topic==='guia'){window.open('https://www.unimed.coop.br/site/web/divinopolis/guia-medico','_blank','noopener');return}
  if(topic==='finalizar'){addMessage('Atendimento finalizado. Quando precisar, a Iva continua disponível para ajudar.');topics.classList.add('hidden');return}
  addMessage(btn.textContent.replace('Novo','').trim(),'user');
  if(topic==='financeiro')addMessage('Para negociação financeira, você pode utilizar o Agendamento Online. Para 2ª via de boleto, prefira os canais digitais.');
  else addMessage('Certo. Para este protótipo, você pode continuar pelo canal correspondente ou seguir no Agendamento Online quando precisar.');
});

document.getElementById('assistiveBtn').onclick=()=>{document.body.classList.toggle('high-contrast');showToast(document.body.classList.contains('high-contrast')?'Contraste reforçado ativado':'Contraste reforçado desativado')};
document.getElementById('librasBtn').onclick=()=>showToast('Recurso de Libras demonstrativo neste protótipo.');
