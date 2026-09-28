const $=s=>document.querySelector(s);

function dateISO(d){
  return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

function saved(){
  return JSON.parse(localStorage.getItem('semfila_bookings_v8')||'[]');
}

function savedDigital(){
  return JSON.parse(localStorage.getItem('semfila_digital_routes_v8')||'[]');
}

function seededDigital(date){
  const services=[
    ['2ª via de boleto','Financeiro','resolved','identificacao'],
    ['Autorização de guias','Autorizações','resolved','assuntos'],
    ['Guia Médico','Atendimento Geral','resolved','identificacao'],
    ['Extrato de utilização','Atendimento Geral','resolved','assuntos'],
    ['Orçamento de exames','Atendimento Geral','pending','assuntos'],
    ['2ª via de boleto','Financeiro','resolved','identificacao'],
    ['Guia Médico','Atendimento Geral','not_resolved','assuntos']
  ];
  return services.map((x,i)=>({
    id:'DG'+i,
    date,
    service:x[0],
    sector:x[1],
    status:x[2],
    source:x[3]
  }));
}
function digitalFor(date){
  return [
    ...seededDigital(date),
    ...savedDigital().filter(x=>x.date===date).map(x=>({...x,status:x.status||'pending'}))
  ];
}

function ageBand(age){
  if(age<18)return'0-17';
  if(age<30)return'18-29';
  if(age<45)return'30-44';
  if(age<60)return'45-59';
  return'60+';
}

function pct(a,b){
  return b?Math.round(a/b*100):0;
}

function sectorFromService(service=''){
  const s=String(service);
  const sectors=[];
  if(s.includes('Negociação')) sectors.push('Financeiro');
  if(s.includes('Troca de plano')) sectors.push('Cadastro');
  if(s.includes('Autorizações')) sectors.push('Autorizações');
  if(s.includes('Intercâmbio')) sectors.push('Intercâmbio');
  if(s.includes('Outros')) sectors.push('Atendimento Geral');
  return sectors.length ? sectors.join(' + ') : 'Atendimento Geral';
}

function seeded(date){
  const names=[
    'Mariana Souza','Carlos Henrique','Joana Lima','Rafael Martins',
    'Bianca Alves','Paulo César','Fernanda Ribeiro','Lucas Rocha',
    'Camila Mendes','Ricardo Nunes','Helena Duarte','Gustavo Alves'
  ];
  const ages=[15,22,27,34,41,48,56,62,68,31,73,44,18,59,36,66,25,52,61,39,12,29,46,70,33,54,64,23];
  const services=['Negociação','Autorizações','Troca de plano','Outros','Negociação + Autorizações','Intercâmbio'];
  const times=['08:00','08:20','08:40','09:00','09:20','09:40','10:00','10:20','10:40','11:00','11:20','11:40','13:00','13:20','13:40','14:00','14:20','14:40','15:00','15:20','15:40','16:00','16:20','16:40'];
  const arr=[];

  for(let i=0;i<28;i++){
    const age=ages[i%ages.length];
    const service=services[i%services.length];
    const sector=sectorFromService(service);
    const inter=service==='Intercâmbio'||i%9===0;
    const status=i%13===0?'Cancelado':i%10===0?'Falta':i%3===0?'Concluído':'Agendado';
    const duration=service.includes('+')?40:20;

    arr.push({
      id:'D'+i,
      user:names[i%names.length],
      age,
      birth:'',
      sector,
      origin:inter?'interchange':'local',
      originUnimed:inter?'Unimed de origem':'Unimed Divinópolis',
      service,
      reason:service,
      payment:service.includes('Negociação')?(i%2?'Cartão':'Boleto'):'—',
      date,
      time:times[i%times.length],
      duration,
      blocks:duration/20,
      status
    });
  }

  return arr;
}

function normalizeBooking(b){
  return {
    ...b,
    sector:b.sector || sectorFromService(b.service)
  };
}

function allFor(date){
  return [
    ...seeded(date),
    ...saved().filter(b=>b.date===date).map(normalizeBooking)
  ];
}

function render(){
  const date=$('#dashDate').value;
  const sector=$('#sectorFilter').value;
  let data=allFor(date);
  let digital=digitalFor(date);

  if(sector!=='Todos'){
    data=data.filter(x=>String(x.sector||'').includes(sector));
    digital=digital.filter(x=>String(x.sector||'').includes(sector));
  }

  renderKpis(data);
  renderDigital(digital);
  renderAge(data);
  renderProfile(data);
  renderServices(data);
  renderHours(data);
  renderCapacity(data);
  renderPayments(data);
  renderTable(data);
}

function renderKpis(data){
  const active=data.filter(x=>x.status!=='Cancelado');
  const multi=active.filter(x=>(x.duration||20)>20);
  const cancel=data.filter(x=>x.status==='Cancelado').length;
  const noShow=data.filter(x=>x.status==='Falta').length;
  const avg=active.length?Math.round(active.reduce((a,b)=>a+(b.duration||20),0)/active.length):0;

  const k=[
    ['Agendamentos',active.length,'no dia selecionado'],
    ['Ocupação',Math.min(100,Math.round(active.reduce((a,b)=>a+(b.blocks||1),0)/96*100))+'%','da capacidade estimada'],
    ['Múltiplos assuntos',pct(multi.length,active.length)+'%',multi.length+' atendimento(s)'],
    ['Tempo médio',avg+' min','tempo reservado'],
    ['Faltas',pct(noShow,active.length)+'%',noShow+' ocorrência(s)'],
    ['Cancelamentos',cancel,'vagas liberadas']
  ];

  $('#kpis').innerHTML=k.map(x=>`
    <article class="kpi-card">
      <span>${x[0]}</span>
      <strong>${x[1]}</strong>
      <small>${x[2]}</small>
    </article>
  `).join('');
}

function renderDigital(digital){
  const total=digital.length;
  const resolved=digital.filter(x=>x.status==='resolved').length;
  const notResolved=digital.filter(x=>x.status==='not_resolved').length;
  const pending=digital.filter(x=>x.status==='pending').length;
  const rate=pct(resolved,total);

  $('#digitalPerformance').innerHTML=`
    <div class="digital-metric featured">
      <span>Direcionamentos digitais</span>
      <strong>${total}</strong>
      <small>demandas encaminhadas aos canais online</small>
    </div>
    <div class="digital-metric success">
      <span>Resolvidas online</span>
      <strong>${resolved}</strong>
      <small>resoluções registradas</small>
    </div>
    <div class="digital-metric rate">
      <span>Taxa de resolução online</span>
      <strong>${rate}%</strong>
      <small>${resolved} de ${total} direcionamento(s)</small>
    </div>
    <div class="digital-metric neutral">
      <span>Sem confirmação de resolução</span>
      <strong>${pending+notResolved}</strong>
      <small>${pending} pendente(s) • ${notResolved} não resolvido(s)</small>
    </div>`;

  const serviceNames=['2ª via de boleto','Autorização de guias','Guia Médico','Extrato de utilização','Orçamento de exames'];
  const counts=serviceNames.map(name=>[name,digital.filter(x=>x.service===name).length]);
  const max=Math.max(1,...counts.map(x=>x[1]));

  $('#digitalServiceBars').innerHTML=counts.map(x=>`
    <div class="bar-row digital-bar-row">
      <span>${x[0]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x[1]/max*100}%"></div></div>
      <b>${x[1]}</b>
      <small>${pct(x[1],total)}%</small>
    </div>`).join('');

  const intro=digital.filter(x=>x.source==='identificacao').length;
  const subjects=digital.filter(x=>x.source==='assuntos').length;
  $('#digitalSourceGrid').innerHTML=[
    ['Antes da identificação',intro,pct(intro,total)],
    ['Na escolha do assunto',subjects,pct(subjects,total)]
  ].map(x=>`
    <div class="profile-card">
      <span>${x[0]}</span>
      <strong>${x[1]}</strong>
      <em>${x[2]}%</em>
    </div>`).join('');
}

function renderAge(data){
  const bands=[
    ['0–17','0-17'],
    ['18–29','18-29'],
    ['30–44','30-44'],
    ['45–59','45-59'],
    ['60+','60+']
  ];

  const counts=bands.map(([label,key])=>[
    label,
    data.filter(x=>ageBand(Number(x.age||0))===key).length
  ]);

  const max=Math.max(1,...counts.map(x=>x[1]));

  $('#ageBars').innerHTML=counts.map(x=>`
    <div class="bar-row">
      <span>${x[0]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x[1]/max*100}%"></div></div>
      <b>${x[1]}</b>
      <small>${pct(x[1],data.length)}%</small>
    </div>
  `).join('');
}

function renderProfile(data){
  const local=data.filter(x=>(x.origin||'local')==='local').length;
  const inter=data.length-local;

  $('#profileGrid').innerHTML=[
    ['Unimed Divinópolis',local,pct(local,data.length)],
    ['Intercâmbio',inter,pct(inter,data.length)]
  ].map(x=>`
    <div class="profile-card">
      <span>${x[0]}</span>
      <strong>${x[1]}</strong>
      <em>${x[2]}%</em>
    </div>
  `).join('');
}

function renderServices(data){
  const names=['Negociação','Autorizações','Troca de plano','Outros','Intercâmbio'];
  const counts=names.map(n=>[n,data.filter(x=>x.service.includes(n)).length]);
  const max=Math.max(1,...counts.map(x=>x[1]));

  $('#serviceBars').innerHTML=counts.map(x=>`
    <div class="bar-row">
      <span>${x[0]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x[1]/max*100}%"></div></div>
      <b>${x[1]}</b>
    </div>
  `).join('');
}

function renderHours(data){
  const bands=[['08–10h',0],['10–12h',0],['13–15h',0],['15–17h',0]];

  data.forEach(x=>{
    const h=parseInt(x.time);
    if(h<10)bands[0][1]++;
    else if(h<12)bands[1][1]++;
    else if(h<15)bands[2][1]++;
    else bands[3][1]++;
  });

  const max=Math.max(1,...bands.map(x=>x[1]));

  $('#hourBars').innerHTML=bands.map(x=>`
    <div class="bar-row">
      <span>${x[0]}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x[1]/max*100}%"></div></div>
      <b>${x[1]}</b>
    </div>
  `).join('');
}

function renderCapacity(data){
  const blocks=data.filter(x=>x.status!=='Cancelado').reduce((a,b)=>a+(b.blocks||1),0);
  const capacity=96;
  const occ=Math.min(100,pct(blocks,capacity));
  const free=Math.max(0,capacity-blocks);

  $('#capacityPanel').innerHTML=`
    <div class="capacity-meter"><div style="width:${occ}%"></div></div>
    <div class="capacity-stats">
      <div><span>Ocupação</span><b>${occ}%</b></div>
      <div><span>Blocos reservados</span><b>${blocks}</b></div>
      <div><span>Blocos livres</span><b>${free}</b></div>
    </div>
    <p>Indicador demonstrativo considerando blocos de 20 minutos e capacidade estimada da operação.</p>
  `;
}

function renderPayments(data){
  const fin=data.filter(x=>x.service.includes('Negociação'));
  const bol=fin.filter(x=>x.payment==='Boleto').length;
  const card=fin.filter(x=>x.payment==='Cartão').length;

  $('#paymentGrid').innerHTML=[
    ['Boleto',bol,pct(bol,Math.max(1,fin.length))],
    ['Cartão',card,pct(card,Math.max(1,fin.length))]
  ].map(x=>`
    <div class="profile-card">
      <span>${x[0]}</span>
      <strong>${x[1]}</strong>
      <em>${x[2]}%</em>
    </div>
  `).join('');
}

function renderTable(data){
  $('#appointmentsTable').innerHTML=[...data]
    .sort((a,b)=>a.time.localeCompare(b.time))
    .slice(0,20)
    .map(x=>`
      <tr>
        <td><b>${x.time}</b></td>
        <td>${x.user}</td>
        <td>${x.sector}</td>
        <td>${(x.origin||'local')==='interchange'?'Intercâmbio':'Divinópolis'}</td>
        <td>${x.service}</td>
        <td>${x.duration||20} min</td>
        <td><span class="status-pill ${x.status.toLowerCase().replace('í','i')}">${x.status}</span></td>
      </tr>
    `).join('');
}

$('#dashDate').value=dateISO(new Date());
$('#dashDate').onchange=render;
$('#sectorFilter').onchange=render;
render();
