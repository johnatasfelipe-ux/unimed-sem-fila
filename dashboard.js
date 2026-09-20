const $=s=>document.querySelector(s);
function dateISO(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
const sectors=['Financeiro','Cadastro','Autorizações','Atendimento Geral'];
function saved(){return JSON.parse(localStorage.getItem('semfila_bookings_v3')||'[]')}
function seeded(date){
  const names=['Mariana Souza','Carlos Henrique','Joana Lima','Rafael Martins','Bianca Alves','Paulo César','Fernanda Ribeiro','Lucas Rocha','Camila Mendes','Ricardo Nunes'];
  const reasons={
    'Financeiro':['Negociação de débitos','Renegociação de parcelamento','Dúvida sobre cobrança / valores'],
    'Cadastro':['Troca ou migração de plano','Inclusão de dependente','Alteração cadastral'],
    'Autorizações':['Solicitar autorização','Consultar autorização existente','Enviar documentação'],
    'Atendimento Geral':['Rede credenciada','Declarações e documentos','Dúvidas gerais']
  };
  const times=['08:00','08:40','09:20','10:00','10:40','11:20','13:00','13:40','14:20','15:00','15:40','16:20'];
  let arr=[];
  for(let i=0;i<28;i++){
    const s=sectors[i%4],status=i%13===0?'Cancelado':i%9===0?'Falta':i%3===0?'Concluído':'Agendado';
    arr.push({id:'D'+i,user:names[i%names.length],sector:s,service:s==='Financeiro'?'Negociação':s==='Cadastro'?'Troca de plano':s==='Autorizações'?'Autorizações':'Outros',reason:reasons[s][i%reasons[s].length],payment:s==='Financeiro'?(i%2===0?'Boleto':'Cartão'):'—',recipient:i%5===0?'other':'self',date,time:times[i%times.length],status,duration:18+(i%6)*3});
  }
  return arr;
}
function allFor(date){return [...seeded(date),...saved().filter(b=>b.date===date)]}
function pct(a,b){return b?Math.round(a/b*100):0}
function render(){
  const date=$('#dashDate').value,filter=$('#sectorFilter').value;let data=allFor(date);if(filter!=='Todos')data=data.filter(x=>x.sector===filter);
  const active=data.filter(x=>x.status!=='Cancelado'),concluded=data.filter(x=>x.status==='Concluído'),noShow=data.filter(x=>x.status==='Falta').length,cancelled=data.filter(x=>x.status==='Cancelado').length;
  const capacity=filter==='Todos'?48:12,occupation=Math.min(100,pct(active.length,capacity));
  const avgDuration=concluded.length?Math.round(concluded.reduce((a,b)=>a+(b.duration||24),0)/concluded.length):0;
  const avgWait=Math.max(3,Math.round(16-occupation/10));
  const kpis=[
    ['Agendamentos',active.length,'no dia selecionado','good'],
    ['Ocupação',occupation+'%','da capacidade aberta',occupation>90?'warn':'good'],
    ['Concluídos',concluded.length,pct(concluded.length,active.length)+'% do total','good'],
    ['Faltas',pct(noShow,active.length)+'%',noShow+' no-show(s)',noShow>2?'bad':'warn'],
    ['Cancelamentos',cancelled,'vagas liberadas','warn'],
    ['Duração média',avgDuration+' min','atendimentos concluídos','good'],
    ['Espera média',avgWait+' min','estimativa operacional',avgWait>15?'bad':'good'],
    ['Regra de 2h','100%','cancelamento online bloqueado após o prazo','good']
  ];
  $('#kpis').innerHTML=kpis.map(k=>`<article class="kpi ${k[3]}"><span>${k[0]}</span><strong>${k[1]}</strong><small>${k[2]}</small></article>`).join('');
  renderSector(data);renderStatus(data);renderHours(data);renderPayments(data);renderTrend();renderRecipient(data);renderTable(data);
}
function renderSector(data){const counts=Object.fromEntries(sectors.map(s=>[s,data.filter(x=>x.sector===s).length])),max=Math.max(1,...Object.values(counts));$('#sectorBars').innerHTML=sectors.map(s=>`<div class="bar-row"><span>${s}</span><div class="bar-track"><div class="bar-fill" style="width:${counts[s]/max*100}%"></div></div><b>${counts[s]}</b></div>`).join('')}
function renderStatus(data){const sts=[['Agendados',data.filter(x=>x.status==='Agendado').length,'blue'],['Concluídos',data.filter(x=>x.status==='Concluído').length,'green'],['Faltas',data.filter(x=>x.status==='Falta').length,'red'],['Cancelados',data.filter(x=>x.status==='Cancelado').length,'gray']];$('#statusGrid').innerHTML=sts.map(x=>`<div class="status-card"><span>${x[0]}</span><strong>${x[1]}</strong><br><em class="badge ${x[2]}">${x[0]}</em></div>`).join('')}
function renderHours(data){const bands=[['08–10h',0],['10–12h',0],['13–15h',0],['15–17h',0]];data.forEach(x=>{const h=parseInt(x.time);if(h<10)bands[0][1]++;else if(h<12)bands[1][1]++;else if(h<15)bands[2][1]++;else bands[3][1]++});const max=Math.max(1,...bands.map(x=>x[1]));$('#hourBars').innerHTML=bands.map(x=>`<div class="bar-row"><span>${x[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${x[1]/max*100}%"></div></div><b>${x[1]}</b></div>`).join('')}
function renderPayments(data){const fin=data.filter(x=>x.sector==='Financeiro'),boleto=fin.filter(x=>x.payment==='Boleto').length,cartao=fin.filter(x=>x.payment==='Cartão').length,total=Math.max(1,boleto+cartao);$('#paymentChart').innerHTML=`<div class="payment-donut" style="--boleto:${Math.round(boleto/total*100)}"><div><strong>${boleto+cartao}</strong><span>negociações</span></div></div><div class="payment-legend"><span><i class="legend-box boleto"></i>Boleto <b>${boleto}</b></span><span><i class="legend-box cartao"></i>Cartão <b>${cartao}</b></span></div>`}
function renderTrend(){const vals=[18,23,21,28,32,25,30],days=['SEG','TER','QUA','QUI','SEX','SÁB','HOJ'],max=Math.max(...vals);$('#trendChart').innerHTML=vals.map((v,i)=>`<div class="trend-col"><div class="trend-bar" style="height:${v/max*135}px" title="${v} atendimentos"></div><small>${days[i]}</small></div>`).join('')}
function renderRecipient(data){const own=data.filter(x=>(x.recipient||'self')==='self').length,other=data.length-own;$('#recipientGrid').innerHTML=`<div class="status-card"><span>Para si próprio</span><strong>${own}</strong><br><em class="badge green">${pct(own,data.length)}%</em></div><div class="status-card"><span>Para outra pessoa</span><strong>${other}</strong><br><em class="badge blue">${pct(other,data.length)}%</em></div>`}
function renderTable(data){const order={Agendado:0,Concluído:1,Falta:2,Cancelado:3};data=[...data].sort((a,b)=>a.time.localeCompare(b.time)||order[a.status]-order[b.status]);$('#appointmentsTable').innerHTML=data.slice(0,20).map(x=>`<tr><td><b>${x.time}</b></td><td>${x.user}</td><td>${x.sector}</td><td>${x.reason}</td><td>${x.payment||'—'}</td><td><span class="badge ${x.status==='Agendado'?'blue':x.status==='Concluído'?'green':x.status==='Cancelado'?'gray':'red'}">${x.status}</span></td></tr>`).join('')}
$('#dashDate').value=dateISO(new Date());$('#dashDate').onchange=render;$('#sectorFilter').onchange=render;render();
