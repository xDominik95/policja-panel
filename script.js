const $ = s => document.querySelector(s);
const store = {
  vehicles: JSON.parse(localStorage.getItem('rp_vehicles') || '[]'),
  officers: JSON.parse(localStorage.getItem('rp_officers') || '[]'),
  docs: Number(localStorage.getItem('rp_docs') || 0)
};
function save(){ localStorage.setItem('rp_vehicles', JSON.stringify(store.vehicles)); localStorage.setItem('rp_officers', JSON.stringify(store.officers)); localStorage.setItem('rp_docs', store.docs); renderStats(); }
function uid(){ return Math.random().toString(36).slice(2,9); }

document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav,.view').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); $('#' + btn.dataset.view).classList.add('active');
}));
function renderStats(){ $('#statVehicles').textContent=store.vehicles.length; $('#statDocs').textContent=store.docs; $('#statOfficers').textContent=store.officers.length; }

$('#vehicleForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=new FormData(e.target);
  store.vehicles.push({id:uid(),model:f.get('model'),plate:f.get('plate'),code:f.get('code'),rows:[]}); e.target.reset(); save(); renderVehicles();
});
function renderVehicles(){
  $('#vehicleList').innerHTML = store.vehicles.map(v=>`<div class="list-item"><b>${v.model} ${v.plate}</b><span><button class="primary" onclick="showVehicle('${v.id}')">Otwórz</button> <button class="primary danger" onclick="deleteVehicle('${v.id}')">Usuń</button></span></div>`).join('') || 'Brak pojazdów.';
}
function deleteVehicle(id){ store.vehicles=store.vehicles.filter(v=>v.id!==id); save(); renderVehicles(); $('#vehicleCardArea').innerHTML=''; }
function showVehicle(id){
 const v=store.vehicles.find(x=>x.id===id); if(!v) return;
 $('#vehicleCardArea').innerHTML=`<div class="vehicle-card" id="printArea"><div class="vehicle-title"><h2>Karta pojazdu</h2><div class="car">${v.model} &nbsp; ${v.plate}</div><em>Kryptonim ${v.code||'—'}</em></div>
 <div class="actions"><button class="primary" onclick="addPatrol('${id}')">Dodaj patrol</button><button class="primary" onclick="downloadPdf('printArea','karta_pojazdu_${v.plate}.pdf')">Pobierz PDF</button></div>
 <table class="patrol-table"><tr><th colspan="7">Rozpoczęcie patrolu</th><th colspan="7">Zakończenie patrolu</th></tr><tr>${['Przebieg','Godzina','Data','Pobierający','% Paliwa','% Silnika','% Karoseria','Przebieg','Godzina','Data','Pobierający','% Paliwa','% Silnika','% Karoseria'].map(h=>`<td><b>${h}</b></td>`).join('')}</tr>
 ${v.rows.map((r,i)=>`<tr>${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(n=>`<td><input value="${r[n]||''}" onchange="updatePatrol('${id}',${i},${n},this.value)"></td>`).join('')}</tr>`).join('')}
 ${Array.from({length:Math.max(4,10-v.rows.length)},()=>`<tr>${Array.from({length:14},()=>'<td>&nbsp;</td>').join('')}</tr>`).join('')}</table></div>`;
}
function addPatrol(id){ const v=store.vehicles.find(x=>x.id===id); v.rows.push(Array(14).fill('')); save(); showVehicle(id); }
function updatePatrol(id,i,n,val){ store.vehicles.find(x=>x.id===id).rows[i][n]=val; save(); }

$('#officerForm').addEventListener('submit', e=>{e.preventDefault(); const f=new FormData(e.target); store.officers.push({id:uid(),rank:f.get('rank'),name:f.get('name'),badge:f.get('badge')}); e.target.reset(); save(); renderOfficers();});
function renderOfficers(){ $('#officerList').innerHTML=store.officers.map(o=>`<div class="list-item"><b>${o.rank} ${o.name}</b><span>${o.badge||''} <button class="primary danger" onclick="removeOfficer('${o.id}')">Usuń</button></span></div>`).join('') || 'Brak funkcjonariuszy.'; }
function removeOfficer(id){ store.officers=store.officers.filter(o=>o.id!==id); save(); renderOfficers(); }

const roadChecks=['Obszar zabudowany','Skrzyżowanie','Jezdnia','Przejście dla pieszych','Droga twarda','Nawierzchnia mokra','Światło dzienne','Noc - droga oświetlona','Opady deszczu','Zderzenie boczne','Najechanie na pojazd','Niedostosowanie prędkości'];
function openDoc(type){
 let html='';
 if(type==='road') html=`<div class="document" id="docPrint"><h2 class="doc-head">Karta zdarzenia drogowego</h2>${fields(['Jednostka Policji','Nr rejestru','Data zdarzenia','Godzina','Powiat','Gmina','Miejscowość','Ulica / nr drogi'])}<div class="doc-section"><h3>Miejsce i okoliczności</h3><div class="checkboxes">${roadChecks.map(x=>`<label><input type="checkbox"> ${x}</label>`).join('')}</div></div><div class="doc-section"><h3>Szkic / opis</h3><textarea placeholder="Opis zdarzenia, uczestnicy, szkic słowny..."></textarea></div>${sign()}`;
 if(type==='punish') html=`<div class="document" id="docPrint"><h2 class="doc-head">Wniosek o ukaranie</h2>${fields(['Miejscowość i data','Sąd Rejonowy w','Znak sprawy','Obwiniony','PESEL / dokument','Adres zamieszkania'])}<div class="doc-section"><h3>Opis czynu</h3><textarea placeholder="W dniu... około godziny... w miejscowości..."></textarea><label>Artykuł <input placeholder="np. art. 92 KW"></label></div><div class="doc-section"><h3>Wnioski dowodowe</h3><textarea placeholder="Świadkowie, dokumenty, nagrania..."></textarea></div>${sign()}`;
 if(type==='seize') html=`<div class="document" id="docPrint"><h2 class="doc-head">Pokwitowanie zatrzymania dokumentu</h2>${fields(['Data i godzina','Miejscowość','Wydający','Marka pojazdu','Nr rejestracyjny','VIN','Kierujący','PESEL','Seria i nr dokumentu','Powód zatrzymania'])}<div class="doc-section"><h3>Rodzaj dokumentu</h3><div class="checkboxes"><label><input type="checkbox"> dowód rejestracyjny</label><label><input type="checkbox"> prawo jazdy</label><label><input type="checkbox"> karta kierowcy</label></div></div>${sign()}`;
 $('#documentEditor').innerHTML=html+`<div class="actions"><button class="primary" onclick="store.docs++;save();downloadPdf('docPrint','dokument_rp.pdf')">Pobierz PDF</button><button class="primary" onclick="window.print()">Drukuj</button></div>`;
}
function fields(arr){return `<div class="doc-section"><h3>Dane</h3><div class="form-row">${arr.map(x=>`<label>${x}<input></label>`).join('')}</div></div>`}
function sign(){return `<div class="doc-section"><h3>Sporządzający</h3><div class="form-row"><label>Stopień<input></label><label>Imię i nazwisko<input></label><label>Podpis<input></label></div></div></div>`}
function downloadPdf(id, filename){
 const el=document.getElementById(id); if(!window.html2pdf){ alert('Biblioteka PDF jeszcze się ładuje. Spróbuj za chwilę.'); return; }
 html2pdf().set({margin:10,filename,image:{type:'jpeg',quality:.98},html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(el).save();
}
renderStats(); renderVehicles(); renderOfficers();
