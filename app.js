const services = [
  {name:'Negociação', sector:'Financeiro', icon:'▤', desc:'Negociação de débitos e acordos financeiros', reasons:['Negociação de débitos','Renegociação de parcelamento','Dúvida sobre cobrança / valores','Quitação / baixa de pagamento'], needsPayment:true},
  {name:'Troca de plano', sector:'Cadastro', icon:'↻', desc:'Alterações, migração ou informações do plano', reasons:['Troca ou migração de plano','Inclusão de dependente','Exclusão de dependente','Alteração cadastral'], needsPayment:false},
  {name:'Autorizações', sector:'Autorizações', icon:'✓', desc:'Exames, procedimentos e solicitações', reasons:['Solicitar autorização','Consultar autorização existente','Autorização negada','Enviar documentação'], needsPayment:false},
  {name:'Outros', sector:'Atendimento Geral', icon:'…', desc:'Demais dúvidas e solicitações', reasons:['Rede credenciada','Declarações e documentos','Dúvidas gerais','Outro assunto'], needsPayment:false}
];

const baseSlots = ['08:00','08:40','09:20','10:00','10:40','11:20','13:00','13:40','14:20','15:00','15:40','16:20'];
let state = {recipient:'self', method:'card', user:null, service:null, reason:'', payment:'', date:'', time:'', editingId:null};
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function store(){ return JSON.parse(localStorage.getItem('semfila_bookings_v3') || '[]'); }
function save(v){ localStorage.setItem('semfila_bookings_v3', JSON.stringify(v)); }
function show(id){ $$('.screen').forEach(x => x.classList.remove('active')); $('#' + id).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function brDate(iso){ if(!iso) return '—'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function dateISO(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function escapeHtml(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function formatCard(v){ const d=v.replace(/\D/g,'').slice(0,17); let o=d.slice(0,4); if(d.length>4)o+='.'+d.slice(4,8); if(d.length>8)o+='.'+d.slice(8,16); if(d.length>16)o+='-'+d.slice(16); return o; }
function formatCPF(v){ const d=v.replace(/\D/g,'').slice(0,11); let o=d.slice(0,3); if(d.length>3)o+='.'+d.slice(3,6); if(d.length>6)o+='.'+d.slice(6,9); if(d.length>9)o+='-'+d.slice(9,11); return o; }
function maskIdentity(identity, method){ const d=identity.replace(/\D/g,''); if(method==='cpf') return d.length===11 ? `***.${d.slice(3,6)}.${d.slice(6,9)}-**` : identity; return identity; }
function businessDates(n=10){ const out=[]; let d=new Date(); d.setHours(12,0,0,0); if(d.getHours()>=17) d.setDate(d.getDate()+1); while(out.length<n){ if(d.getDay()!==0 && d.getDay()!==6) out.push(new Date(d)); d.setDate(d.getDate()+1); } return out; }
function deterministicOccupied(date,time){ const sum=[...date+time].reduce((a,c)=>a+c.charCodeAt(0),0); return sum%5===0 || sum%11===0; }
function slotOccupied(date,time){ if(deterministicOccupied(date,time)) return true; return store().some(b=>b.date===date&&b.time===time&&b.status!=='Cancelado'&&b.id!==state.editingId); }
function bookingDateTime(b){ return new Date(`${b.date}T${b.time}:00`); }
function canCancel(b){ return bookingDateTime(b).getTime() - Date.now() >= 2*60*60*1000; }

$$('.recipient-card').forEach(btn => btn.addEventListener('click', () => {
  state.recipient = btn.dataset.recipient;
  $('#identificationKicker').textContent = state.recipient==='self' ? 'SEUS DADOS DE IDENTIFICAÇÃO' : 'DADOS DA PESSOA QUE SERÁ ATENDIDA';
  show('screen-identification');
}));
$('#backRecipient').onclick = () => show('screen-recipient');

$$('.id-tab').forEach(btn => btn.addEventListener('click', () => {
  state.method = btn.dataset.method;
  $$('.id-tab').forEach(x=>x.classList.toggle('active',x===btn));
  $('#cardFields').classList.toggle('hidden',state.method!=='card');
  $('#cpfFields').classList.toggle('hidden',state.method!=='cpf');
}));
$('#cardNumber').addEventListener('input', e => e.target.value=formatCard(e.target.value));
$('#cpfNumber').addEventListener('input', e => e.target.value=formatCPF(e.target.value));

$('#demoBtn').onclick = () => {
  if(state.method==='card') $('#cardNumber').value='0144.4295.00081234-6';
  else $('#cpfNumber').value='123.456.789-00';
  $('#birthDate').value='1998-12-29';
};

function hydrateUser(){
  const u=JSON.parse(localStorage.getItem('semfila_user_v3')||'null');
  if(!u) return;
  state.user=u; state.recipient=u.recipient; state.method=u.method;
  $('#headerUser').textContent=u.name.split(' ')[0];
  $('#welcomeName').textContent=u.name;
  $('#recipientLabel').textContent=u.recipient==='self'?'Agendamento para você':'Agendamento para outra pessoa';
  $('#identityTypeLabel').textContent=u.method==='cpf'?'CPF':'CARTEIRINHA';
  $('#homeIdentity').textContent=maskIdentity(u.identity,u.method);
  $('#homeBirth').textContent=brDate(u.birth);
  renderNext();
}

$('#loginBtn').onclick = () => {
  const identity = state.method==='card' ? $('#cardNumber').value.trim() : $('#cpfNumber').value.trim();
  const birth=$('#birthDate').value;
  const digits=identity.replace(/\D/g,'');
  const validIdentity = state.method==='card' ? digits.length>=12 : digits.length===11;
  if(!validIdentity || !birth){ toast(`Informe ${state.method==='card'?'a carteirinha':'o CPF'} e a data de nascimento.`); return; }
  if(birth > dateISO(new Date())){ toast('A data de nascimento não pode ser futura.'); return; }
  const sample = digits.includes('00081234') || digits==='12345678900';
  const name = sample ? 'Arthur Peixoto Militão' : 'Beneficiário identificado';
  state.user={identity,method:state.method,birth,name,recipient:state.recipient};
  localStorage.setItem('semfila_user_v3',JSON.stringify(state.user));
  hydrateUser(); show('screen-home');
};

$('#logoutBtn').onclick=()=>{localStorage.removeItem('semfila_user_v3');state.user=null;$('#headerUser').textContent='Visitante';show('screen-recipient');};

function renderServices(){
  const box=$('#serviceOptions'); box.innerHTML='';
  services.forEach(s=>{
    const b=document.createElement('button'); b.className='option'; b.type='button';
    b.innerHTML=`<span class="ico">${s.icon}</span><strong>${s.name}</strong><small>${s.desc}</small>`;
    b.onclick=()=>{
      state.service=s; state.reason=''; state.payment='';
      $$('.option').forEach(x=>x.classList.remove('selected')); b.classList.add('selected');
      const sel=$('#reasonSelect'); sel.innerHTML='<option value="">Selecione um motivo</option>'+s.reasons.map(r=>`<option>${escapeHtml(r)}</option>`).join('');
      $('#paymentArea').classList.toggle('hidden',!s.needsPayment);
      $$('.payment-option').forEach(x=>x.classList.remove('selected'));
      validateServiceStep();
    };
    box.appendChild(b);
  });
}
function validateServiceStep(){
  const ok=state.service && state.reason && (!state.service.needsPayment || state.payment);
  $('#toSchedule').disabled=!ok;
}
$('#reasonSelect').onchange=e=>{state.reason=e.target.value;validateServiceStep();};
$$('.payment-option').forEach(btn=>btn.addEventListener('click',()=>{
  state.payment=btn.dataset.payment;
  $$('.payment-option').forEach(x=>x.classList.toggle('selected',x===btn));
  validateServiceStep();
}));

function startSchedule(){
  state.service=null;state.reason='';state.payment='';state.date='';state.time='';state.editingId=null;
  renderServices();$('#reasonSelect').innerHTML='<option value="">Escolha primeiro um assunto</option>';$('#paymentArea').classList.add('hidden');$('#toSchedule').disabled=true;show('screen-service');
}
$('#startSchedule').onclick=startSchedule;
$('#openMy').onclick=()=>{renderMy();show('screen-my');};
$$('.backHome').forEach(b=>b.onclick=()=>{renderNext();show('screen-home');});

$('#toSchedule').onclick=()=>{
  if($('#toSchedule').disabled) return;
  $('#scheduleContext').textContent=`${state.service.name} · Setor ${state.service.sector}`;
  renderDates(); show('screen-schedule');
};

function renderDates(){
  const ds=businessDates(10),strip=$('#dateStrip');strip.innerHTML='';
  const names=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
  const months=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  ds.forEach((d,i)=>{
    const iso=dateISO(d),b=document.createElement('button');b.type='button';
    b.className='date-btn'+((state.date?state.date===iso:i===0)?' selected':'');
    b.innerHTML=`<b>${names[d.getDay()]}</b><strong>${String(d.getDate()).padStart(2,'0')}</strong><small>${months[d.getMonth()]}</small>`;
    b.onclick=()=>{state.date=iso;state.time='';$$('.date-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');renderSlots();};
    strip.appendChild(b); if(!state.date&&i===0) state.date=iso;
  });
  renderSlots();
}
function renderSlots(){
  const box=$('#slots');box.innerHTML='';$('#toReview').disabled=true;
  const d=new Date(`${state.date}T12:00:00`);
  $('#dateCaption').textContent=`Horários disponíveis para ${d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}`;
  baseSlots.forEach(t=>{
    const b=document.createElement('button');b.className='slot';b.type='button';b.textContent=t;
    const occ=slotOccupied(state.date,t);
    if(occ){b.classList.add('occupied');b.disabled=true;b.title='Horário ocupado';}
    else b.onclick=()=>{state.time=t;$$('.slot').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('#toReview').disabled=false;};
    box.appendChild(b);
  });
}
$('#backService').onclick=()=>show('screen-service');
$('#toReview').onclick=()=>{if(!state.time)return;renderSummary('#reviewSummary');show('screen-review');};
$('#backSchedule').onclick=()=>show('screen-schedule');

function renderSummary(target){
  const rows=[
    ['Beneficiário',state.user.name],
    ['Agendamento',state.user.recipient==='self'?'Para o próprio beneficiário':'Para outra pessoa'],
    ['Atendimento',state.service.name],['Setor',state.service.sector],['Motivo',state.reason]
  ];
  if(state.service.needsPayment) rows.push(['Preferência de pagamento',state.payment]);
  rows.push(['Data',brDate(state.date)],['Horário',state.time],['Modalidade','Atendimento online']);
  $(target).innerHTML=rows.map(([a,b])=>`<div class="summary-row"><span>${escapeHtml(a)}</span><b>${escapeHtml(b)}</b></div>`).join('');
}
function protocol(){return 'SF-'+Date.now().toString().slice(-9);}
$('#confirmBtn').onclick=()=>{
  let list=store(); const p=protocol(); if(state.editingId) list=list.filter(b=>b.id!==state.editingId);
  const booking={id:p,protocol:p,user:state.user.name,identity:state.user.identity,method:state.user.method,recipient:state.user.recipient,service:state.service.name,sector:state.service.sector,reason:state.reason,payment:state.payment||'—',date:state.date,time:state.time,status:'Agendado',created:new Date().toISOString()};
  list.push(booking);save(list);$('#protocol').textContent=p;renderSummary('#successSummary');show('screen-success');
};
$('#newSchedule').onclick=startSchedule;
$('#goMy').onclick=()=>{renderMy();show('screen-my');};

function currentUserBookings(){
  if(!state.user)return[];
  return store().filter(b=>b.identity===state.user.identity).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
}
function renderNext(){
  const b=currentUserBookings().filter(x=>x.status!=='Cancelado'&&bookingDateTime(x)>=new Date())[0],box=$('#nextAppointment');
  if(!b){box.className='empty-box';box.innerHTML='Nenhum atendimento agendado no momento.';return;}
  box.className='panel-card next-card';box.innerHTML=`<div><strong>${escapeHtml(b.service)}</strong><div class="helper">${escapeHtml(b.reason)} · ${brDate(b.date)} às ${escapeHtml(b.time)}</div></div><button class="btn btn-secondary" id="seeMyNow">Ver</button>`;
  $('#seeMyNow').onclick=()=>{renderMy();show('screen-my');};
}
function renderMy(){
  const box=$('#myAppointments'),list=currentUserBookings();
  if(!list.length){box.innerHTML='<div class="empty-box">Você ainda não possui agendamentos neste protótipo.</div>';return;}
  box.innerHTML='';
  list.forEach(b=>{
    const allowed=canCancel(b),c=document.createElement('div');c.className='panel-card appointment-card';
    const ruleText=allowed?'Cancelamento disponível até 2h antes.':'Prazo de cancelamento online encerrado.';
    c.innerHTML=`<div class="appointment-top"><div><small class="sector-label">${escapeHtml(b.sector)}</small><h3>${escapeHtml(b.service)}</h3><div class="helper">${escapeHtml(b.reason)}${b.payment&&b.payment!=='—'?` · Pagamento: ${escapeHtml(b.payment)}`:''}<br>${brDate(b.date)} às ${escapeHtml(b.time)} · Protocolo ${escapeHtml(b.protocol)}</div></div><span class="badge ${b.status==='Cancelado'?'red':'green'}">${escapeHtml(b.status)}</span></div>${b.status!=='Cancelado'?`<div class="appointment-rule ${allowed?'':'closed'}">${ruleText}</div><div class="actions-row compact-actions"><button class="btn btn-secondary rebook" data-id="${b.id}">Reagendar</button><button class="btn btn-secondary cancel" data-id="${b.id}" ${allowed?'':'disabled'}>Cancelar</button></div>`:''}`;
    box.appendChild(c);
  });
  $$('.cancel').forEach(btn=>btn.onclick=()=>{
    const list=store(),x=list.find(b=>b.id===btn.dataset.id);if(!x)return;
    if(!canCancel(x)){toast('O cancelamento online exige no mínimo 2 horas de antecedência.');return;}
    x.status='Cancelado';x.cancelledAt=new Date().toISOString();save(list);renderMy();renderNext();toast('Agendamento cancelado. A vaga foi liberada.');
  });
  $$('.rebook').forEach(btn=>btn.onclick=()=>{
    const b=store().find(x=>x.id===btn.dataset.id);if(!b)return;
    state.editingId=b.id;state.service=services.find(s=>s.name===b.service)||services[3];state.reason=b.reason;state.payment=b.payment==='—'?'':b.payment;state.date='';state.time='';
    $('#scheduleContext').textContent=`Reagendamento · ${state.service.sector}`;renderDates();show('screen-schedule');
  });
}

$$('.bottom-nav [data-go]').forEach(btn=>btn.onclick=()=>{
  if(!state.user){show('screen-recipient');return;}
  const go=btn.dataset.go;if(go==='home'){renderNext();show('screen-home');}if(go==='schedule')startSchedule();if(go==='my'){renderMy();show('screen-my');}
});

renderServices();
const existing=JSON.parse(localStorage.getItem('semfila_user_v3')||'null');
if(existing){hydrateUser();if(location.hash==='#meus'){renderMy();show('screen-my');}else show('screen-home');}
