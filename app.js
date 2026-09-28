
const services = [
  {name:'Intercâmbio', sector:'Intercâmbio', icon:'↔', desc:'Orientações e demandas de beneficiários de outra Unimed', reasons:['Orientação sobre atendimento de intercâmbio','Pendência no atendimento de intercâmbio','Rede / direcionamento para atendimento','Outro assunto de intercâmbio'], needsPayment:false, interchangeOnly:true},
  {name:'Negociação', sector:'Financeiro', icon:'▤', desc:'Mensalidades, débitos e negociação financeira', reasons:['Negociação de débitos','Renegociação de parcelamento','Dúvida sobre cobrança / valores','Quitação / baixa de pagamento'], needsPayment:true, localOnly:true},
  {name:'Troca de plano', sector:'Cadastro', icon:'↻', desc:'Alterações, migração ou informações do plano', reasons:['Troca ou migração de plano','Inclusão de dependente','Exclusão de dependente','Alteração cadastral'], needsPayment:false, localOnly:true},
  {name:'Autorizações', sector:'Autorizações', icon:'✓', desc:'Exames, procedimentos e solicitações', reasons:['Solicitar autorização','Consultar autorização existente','Autorização negada','Enviar documentação'], needsPayment:false},
  {name:'Outros', sector:'Atendimento Geral', icon:'…', desc:'Demais dúvidas e solicitações', reasons:['Rede credenciada','Declarações e documentos','Dúvidas gerais','Outro assunto'], needsPayment:false}
];
const baseSlots = ['08:00','08:40','09:20','10:00','10:40','11:20','13:00','13:40','14:20','15:00','15:40','16:20'];
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const state = {recipient:'self', origin:'local', method:'card', user:null, service:null, reason:'', payment:'', wantsExtra:false, extraService:null, extraReason:'', date:'', time:'', editingId:null};
const presetOrigin = new URLSearchParams(location.search).get('origem');
if(presetOrigin==='intercambio') state.origin='interchange';

function store(){ return JSON.parse(localStorage.getItem('semfila_bookings_v4') || '[]'); }
function save(v){ localStorage.setItem('semfila_bookings_v4', JSON.stringify(v)); }
function show(id){ $$('.screen').forEach(x=>x.classList.remove('active')); $('#'+id).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }
function brDate(iso){ if(!iso) return '—'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function dateISO(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function escapeHtml(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function formatCard(v){ const d=v.replace(/\D/g,'').slice(0,17); let o=d.slice(0,4); if(d.length>4)o+='.'+d.slice(4,8); if(d.length>8)o+='.'+d.slice(8,16); if(d.length>16)o+='-'+d.slice(16); return o; }
function formatCPF(v){ const d=v.replace(/\D/g,'').slice(0,11); let o=d.slice(0,3); if(d.length>3)o+='.'+d.slice(3,6); if(d.length>6)o+='.'+d.slice(6,9); if(d.length>9)o+='-'+d.slice(9,11); return o; }
function businessDates(n=10){ const out=[]; let d=new Date(); d.setHours(12,0,0,0); while(out.length<n){ if(d.getDay()!==0 && d.getDay()!==6) out.push(new Date(d)); d.setDate(d.getDate()+1);} return out; }
function protocol(){ return 'SF-'+String(Date.now()).slice(-8); }
function bookingDateTime(b){ return new Date(`${b.date}T${b.time}:00`); }
function canCancel(b){ return bookingDateTime(b).getTime() - Date.now() >= 2*60*60*1000; }
function getAvailableServices(){ return services.filter(s => state.origin==='interchange' ? !s.localOnly : !s.interchangeOnly); }
function getDurationBlocks(){ let blocks=1; if(state.wantsExtra && state.extraService) blocks += 1; return blocks; }
function getDurationMinutes(){ return getDurationBlocks()*40; }
function serviceLabel(){ return state.wantsExtra && state.extraService ? `${state.service.name} + ${state.extraService.name}` : state.service.name; }
function reasonsLabel(){ return state.wantsExtra && state.extraService && state.extraReason ? `${state.reason} | ${state.extraReason}` : state.reason; }
function paymentLabel(){ return state.service?.needsPayment ? (state.payment || '—') : '—'; }
function bookingOccupiedTimes(b){
  const start = baseSlots.indexOf(b.time); const blocks = b.blocks || 1;
  if(start<0) return [b.time];
  return baseSlots.slice(start, start + blocks);
}
function deterministicOccupied(date,time){ const sum=[...date+time].reduce((a,c)=>a+c.charCodeAt(0),0); return sum%5===0 || sum%11===0; }
function slotOccupied(date,time, excludeId=null){
  if(deterministicOccupied(date,time)) return true;
  return store().some(b=> b.date===date && b.status!=='Cancelado' && b.id!==excludeId && bookingOccupiedTimes(b).includes(time));
}
function slotCanStart(date,index){
  const blocks = getDurationBlocks();
  if(index + blocks > baseSlots.length) return false;
  for(let i=0;i<blocks;i++) if(slotOccupied(date, baseSlots[index+i], state.editingId)) return false;
  return true;
}
function maskIdentity(identity, method){ const d = identity.replace(/\D/g,''); return method==='cpf' ? (d.length===11 ? `***.${d.slice(3,6)}.${d.slice(6,9)}-**` : identity) : identity; }

// initial UI
if(presetOrigin==='intercambio'){
  state.origin='interchange';
}
$('#cardNumber').addEventListener('input', e=> e.target.value = formatCard(e.target.value));
$('#cpfNumber').addEventListener('input', e=> e.target.value = formatCPF(e.target.value));
$$('.id-tab').forEach(btn=> btn.onclick = ()=>{
  state.method = btn.dataset.method;
  $$('.id-tab').forEach(x=>x.classList.toggle('active', x===btn));
  $('#cardFields').classList.toggle('hidden', state.method!=='card');
  $('#cpfFields').classList.toggle('hidden', state.method!=='cpf');
});
$$('#recipientRow .choice-pill').forEach(btn=> btn.onclick = ()=>{
  state.recipient = btn.dataset.recipient;
  $$('#recipientRow .choice-pill').forEach(x=>x.classList.toggle('selected', x===btn));
  $('#identificationKicker').textContent = state.recipient==='self' ? 'SEUS DADOS DE IDENTIFICAÇÃO' : 'DADOS DA PESSOA QUE SERÁ ATENDIDA';
  $('#lgpdBox').classList.toggle('visible', state.recipient==='other');
});
$$('#originRow .choice-pill').forEach(btn=> btn.onclick = ()=>{
  state.origin = btn.dataset.origin;
  $$('#originRow .choice-pill').forEach(x=>x.classList.toggle('selected', x===btn));
  $('#originUnimedFields').classList.toggle('hidden', state.origin!=='interchange');
});
if(state.origin==='interchange'){
  $$('#originRow .choice-pill').forEach(x=>x.classList.toggle('selected', x.dataset.origin==='interchange'));
  $('#originUnimedFields').classList.remove('hidden');
}
$('#demoBtn').onclick = ()=>{
  if(state.method==='card') $('#cardNumber').value='0144.4295.00081234-6';
  else $('#cpfNumber').value='123.456.789-00';
  $('#birthDate').value='1998-12-29';
  if(state.origin==='interchange') $('#originUnimed').value='Unimed BH';
};

function setUserHeader(){ $('#headerUser').textContent = state.user ? state.user.name.split(' ')[0] : 'Visitante'; }
function hydrateUser(){ const u=JSON.parse(localStorage.getItem('semfila_user_v4') || 'null'); if(!u) return; state.user=u; setUserHeader(); }

$('#loginBtn').onclick = ()=>{
  const identity = state.method==='card' ? $('#cardNumber').value.trim() : $('#cpfNumber').value.trim();
  const birth = $('#birthDate').value;
  const originUnimed = state.origin==='interchange' ? $('#originUnimed').value.trim() : 'Unimed Divinópolis';
  const digits = identity.replace(/\D/g,'');
  const validIdentity = state.method==='card' ? digits.length>=12 : digits.length===11;
  if(!validIdentity || !birth){ toast(`Informe ${state.method==='card'?'a carteirinha':'o CPF'} e a data de nascimento.`); return; }
  if(state.origin==='interchange' && !originUnimed){ toast('Informe a Unimed de origem do beneficiário.'); return; }
  const sample = digits.includes('00081234') || digits==='12345678900';
  const name = sample ? 'Arthur Peixoto Militão' : 'Beneficiário identificado';
  state.user = {identity, method:state.method, birth, name, recipient:state.recipient, origin:state.origin, originUnimed};
  localStorage.setItem('semfila_user_v4', JSON.stringify(state.user));
  setUserHeader();
  startSchedule();
};
$('#logoutBtn').onclick = ()=>{ localStorage.removeItem('semfila_user_v4'); state.user=null; setUserHeader(); show('screen-identification'); };

function renderServices(){
  const box = $('#serviceOptions'); box.innerHTML='';
  getAvailableServices().forEach(s=>{
    const b=document.createElement('button'); b.type='button'; b.className='option';
    b.innerHTML=`<span class="ico">${s.icon}</span><strong>${s.name}</strong><small>${s.desc}</small>`;
    b.onclick=()=>{
      state.service=s; state.reason=''; state.payment='';
      $$('.option').forEach(x=>x.classList.remove('selected')); b.classList.add('selected');
      $('#reasonSelect').innerHTML='<option value="">Selecione um motivo</option>' + s.reasons.map(r=>`<option>${escapeHtml(r)}</option>`).join('');
      $('#paymentArea').classList.toggle('hidden', !s.needsPayment);
      $$('.payment-option').forEach(x=>x.classList.remove('selected'));
      populateExtraServices(); renderDuration(); validateServiceStep();
    };
    box.appendChild(b);
  });
}
function populateExtraServices(){
  const sel = $('#extraServiceSelect'); sel.innerHTML='<option value="">Selecione o segundo assunto</option>';
  if(!state.service) return;
  getAvailableServices().filter(s=>s.name!==state.service.name).forEach(s=>{
    const opt=document.createElement('option'); opt.value=s.name; opt.textContent=s.name; sel.appendChild(opt);
  });
  $('#extraReasonSelect').innerHTML='<option value="">Escolha o segundo motivo</option>';
  state.extraService=null; state.extraReason='';
}
function renderDuration(){ $('#durationHint').textContent = `Tempo estimado do atendimento: ${getDurationMinutes()} minutos`; }
function validateServiceStep(){
  const primaryOk = state.service && state.reason && (!state.service.needsPayment || state.payment);
  const extraOk = !state.wantsExtra || (state.extraService && state.extraReason);
  $('#toSchedule').disabled = !(primaryOk && extraOk);
}
$('#reasonSelect').onchange = e=>{ state.reason=e.target.value; validateServiceStep(); };
$$('.payment-option').forEach(btn=> btn.onclick = ()=>{ state.payment=btn.dataset.payment; $$('.payment-option').forEach(x=>x.classList.toggle('selected', x===btn)); validateServiceStep(); });
$$('#extraChoiceRow .choice-pill').forEach(btn=> btn.onclick = ()=>{
  state.wantsExtra = btn.dataset.extra==='yes';
  $$('#extraChoiceRow .choice-pill').forEach(x=>x.classList.toggle('selected', x===btn));
  $('#extraServiceArea').classList.toggle('hidden', !state.wantsExtra);
  if(!state.wantsExtra){ state.extraService=null; state.extraReason=''; $('#extraServiceSelect').value=''; $('#extraReasonSelect').innerHTML='<option value="">Escolha o segundo motivo</option>'; }
  renderDuration(); validateServiceStep();
});
$('#extraServiceSelect').onchange = e=>{
  const picked = getAvailableServices().find(s=>s.name===e.target.value) || null;
  state.extraService = picked; state.extraReason='';
  $('#extraReasonSelect').innerHTML = '<option value="">Escolha o segundo motivo</option>' + (picked ? picked.reasons.map(r=>`<option>${escapeHtml(r)}</option>`).join('') : '');
  renderDuration(); validateServiceStep();
};
$('#extraReasonSelect').onchange = e=>{ state.extraReason=e.target.value; validateServiceStep(); };

function startSchedule(){
  if(!state.user){ show('screen-identification'); return; }
  state.service=null; state.reason=''; state.payment=''; state.wantsExtra=false; state.extraService=null; state.extraReason=''; state.date=''; state.time=''; state.editingId=null;
  renderServices();
  $('#reasonSelect').innerHTML='<option value="">Escolha primeiro um assunto</option>';
  $('#paymentArea').classList.add('hidden');
  $('#extraServiceArea').classList.add('hidden');
  $$('#extraChoiceRow .choice-pill').forEach(x=>x.classList.toggle('selected', x.dataset.extra==='no'));
  $('#interchangeRouting').classList.toggle('hidden', state.user.origin!=='interchange');
  $('#boletoTip').classList.toggle('hidden', state.user.origin==='interchange');
  renderDuration(); validateServiceStep(); show('screen-service');
}
$('#backToId').onclick = ()=> show('screen-identification');
$('#toSchedule').onclick = ()=>{ if($('#toSchedule').disabled) return; renderDates(); $('#scheduleDuration').textContent = `Assuntos selecionados: ${serviceLabel()} • Tempo estimado: ${getDurationMinutes()} minutos`; show('screen-schedule'); };
$('#backService').onclick = ()=> show('screen-service');

function renderDates(){
  const strip=$('#dateStrip'); strip.innerHTML='';
  const names=['DOM','SEG','TER','QUA','QUI','SEX','SÁB']; const months=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const ds=businessDates(10);
  if(!state.date) state.date = dateISO(ds[0]);
  ds.forEach(d=>{
    const iso=dateISO(d), b=document.createElement('button'); b.type='button';
    b.className='date-btn'+(state.date===iso?' selected':'');
    b.innerHTML=`<b>${names[d.getDay()]}</b><strong>${String(d.getDate()).padStart(2,'0')}</strong><small>${months[d.getMonth()]}</small>`;
    b.onclick=()=>{ state.date=iso; state.time=''; $$('.date-btn').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); renderSlots(); };
    strip.appendChild(b);
  });
  renderSlots();
}
function renderSlots(){
  const box=$('#slots'); box.innerHTML=''; $('#toReview').disabled=true;
  const d=new Date(`${state.date}T12:00:00`);
  $('#dateCaption').textContent = `Horários disponíveis para ${d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}`;
  baseSlots.forEach((t,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='slot'; b.textContent=t;
    if(!slotCanStart(state.date, i)){ b.classList.add('occupied'); b.disabled=true; }
    else b.onclick=()=>{ state.time=t; $$('.slot').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); $('#toReview').disabled=false; };
    box.appendChild(b);
  });
}
$('#toReview').onclick = ()=>{ renderSummary('#reviewSummary'); show('screen-review'); };
$('#backSchedule').onclick = ()=> show('screen-schedule');

function renderSummary(target){
  const out = $(target);
  out.innerHTML = `
    <div class="summary-row"><span>Beneficiário</span><b>${escapeHtml(state.user.name)}</b></div>
    <div class="summary-row"><span>Identificação</span><b>${escapeHtml(maskIdentity(state.user.identity, state.user.method))}</b></div>
    <div class="summary-row"><span>Origem</span><b>${escapeHtml(state.user.origin==='interchange' ? state.user.originUnimed : 'Unimed Divinópolis')}</b></div>
    <div class="summary-row"><span>Assuntos</span><b>${escapeHtml(serviceLabel())}</b></div>
    <div class="summary-row"><span>Motivos</span><b>${escapeHtml(reasonsLabel())}</b></div>
    <div class="summary-row"><span>Pagamento</span><b>${escapeHtml(paymentLabel())}</b></div>
    <div class="summary-row"><span>Tempo estimado</span><b>${getDurationMinutes()} minutos</b></div>
    <div class="summary-row"><span>Data e horário</span><b>${brDate(state.date)} às ${escapeHtml(state.time)}</b></div>
  `;
}
$('#confirmBtn').onclick = ()=>{
  let list=store(); const p=protocol();
  const booking={
    id:p, protocol:p, user:state.user.name, identity:state.user.identity, method:state.user.method,
    recipient:state.user.recipient, origin:state.user.origin, originUnimed:state.user.originUnimed,
    service:serviceLabel(), sector:state.service.sector, reason:reasonsLabel(), payment:paymentLabel(),
    date:state.date, time:state.time, status:'Agendado', blocks:getDurationBlocks(), duration:getDurationMinutes(), created:new Date().toISOString()
  };
  list.push(booking); save(list); $('#protocol').textContent=p; renderSummary('#successSummary'); show('screen-success');
};
$('#newSchedule').onclick = startSchedule;
$('#goMy').onclick = ()=>{ renderMy(); show('screen-my'); };
$('#backMyToService').onclick = ()=> show(state.user ? 'screen-service' : 'screen-identification');

function currentUserBookings(){ if(!state.user) return []; return store().filter(b=>b.identity===state.user.identity).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)); }
function renderMy(){
  const box=$('#myAppointments'), list=currentUserBookings();
  if(!list.length){ box.innerHTML='<div class="empty-box">Você ainda não possui agendamentos neste protótipo.</div>'; return; }
  box.innerHTML='';
  list.forEach(b=>{
    const allowed=canCancel(b); const c=document.createElement('div'); c.className='appointment-card';
    c.innerHTML = `<div class="appointment-main"><strong>${escapeHtml(b.service)}</strong><small>${escapeHtml(b.reason)}</small><small>${brDate(b.date)} às ${escapeHtml(b.time)} • ${b.duration||40} min</small><small>Status: ${escapeHtml(b.status)}</small></div>
    <div class="appointment-actions"><button class="btn btn-secondary btn-small cancel-btn" ${(!allowed || b.status==='Cancelado')?'disabled':''}>Cancelar</button></div>`;
    c.querySelector('.cancel-btn').onclick=()=>{ if(!allowed || b.status==='Cancelado') return; const all=store().map(x=>x.id===b.id?{...x,status:'Cancelado'}:x); save(all); renderMy(); toast('Agendamento cancelado.'); };
    box.appendChild(c);
  });
}

$$('.bottom-nav button[data-go="home"]').forEach(btn=> btn.onclick=()=> show(state.user ? 'screen-service' : 'screen-identification'));
$$('.bottom-nav button[data-go="schedule"]').forEach(btn=> btn.onclick=()=> show(state.user ? 'screen-service' : 'screen-identification'));
$$('.bottom-nav button[data-go="my"]').forEach(btn=> btn.onclick=()=>{ renderMy(); show('screen-my'); });

hydrateUser();
if(state.user) setUserHeader();
