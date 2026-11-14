(() => {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const minutes = t => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
  const clock = m => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
  const uuid = () => globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c => {const r = globalThis.crypto?.getRandomValues(new Uint8Array(1))[0] ?? Math.random()*256;return (c==='x' ? r%16 : (r%4)+8).toString(16);});
  const steps = ['Your details', 'Choose a branch', 'Your guests', 'Guest treatments', 'Guest add-ons', 'Date & time', 'Review & send'];
  document.querySelectorAll('.sb-app').forEach(async root => {
    let s, nonce, today, timezone, step = 0, activeGuest = 0, busy = false, result = null;
    const b = {name:'',email:'',phone:'',nationality:'',source:'',branch_id:'',pax:1,room:'Separate rooms',couple_rooms:0,single_rooms:1,date:'',time:'',notes:'',consent:false,website:'',request_key:uuid()};
    const emptyTreatment = () => ({category_id:'',treatment_id:'',variant_id:'',therapist_preference:'No preference',consultation_language:'English'});
    b.guests=[{treatments:[emptyTreatment()],addon_ids:[]}];
    const roomNotice = 'Couple rooms and single rooms depend on availability. Our front desk will inform you when confirming your booking request.';
    function normalizeRooms() {
      const pax=Number(b.pax);if(!Number.isInteger(pax)||pax<1||pax>Number(s.max_pax))return;
      b.couple_rooms=Math.max(0,Math.min(Math.floor(pax/2),Math.floor(Number(b.couple_rooms)||0)));
      b.single_rooms=pax-2*b.couple_rooms;
      b.room=b.couple_rooms===0?'Separate rooms':b.single_rooms>0?'Mixed rooms':pax===2?'Couple room':'Couple rooms';
    }
    const roomSummary = () => [b.couple_rooms?`${b.couple_rooms} couple room${b.couple_rooms===1?'':'s'} (${b.couple_rooms*2} guests)`:'',b.single_rooms?`${b.single_rooms} single room${b.single_rooms===1?'':'s'} (${b.single_rooms} guest${b.single_rooms===1?'':'s'})`:''].filter(Boolean).join(' + ');
    const item = (list,id) => list.find(v => v.id===id);
    const branch = () => item(s.branches,b.branch_id);
    const treatment = line => item(s.treatments,line.treatment_id);
    const isDoctor = line => (s.doctor_treatment_ids||[]).includes(line.treatment_id);
    const variant = line => treatment(line)?.variants.find(v => v.id===line.variant_id);
    function normalizeGuests() {
      const pax=Number(b.pax);if(!Number.isInteger(pax)||pax<1||pax>Number(s.max_pax))return;
      while(b.guests.length<pax)b.guests.push({treatments:[emptyTreatment()],addon_ids:[]});
      activeGuest=Math.min(activeGuest,pax-1);
    }
    const guests = () => b.guests.slice(0,Number(b.pax));
    const guestAddons = guest => s.addons.filter(a=>guest.addon_ids.includes(a.id));
    const guestDuration = guest => guest.treatments.reduce((sum,line)=>sum+Number(variant(line)?.duration||0),0)+guestAddons(guest).reduce((sum,a)=>sum+Number(a.duration),0);
    const guestCents = guest => guest.treatments.reduce((sum,line)=>sum+Math.round(Number(variant(line)?.price||0)*100),0)+guestAddons(guest).reduce((sum,a)=>sum+Math.round(Number(a.price)*100),0);
    const duration = () => Math.max(0,...guests().map(guestDuration));
    const price = () => guests().reduce((sum,guest)=>sum+guestCents(guest),0)/100;
    const complete = guest => guest.treatments.length>0 && guest.treatments.every(line=>variant(line)&&['No preference','Male therapist','Female therapist'].includes(line.therapist_preference));
    const money = n => `${s.currency} ${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const maxDate = () => {const d = new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+Number(s.advance_days));return d.toISOString().slice(0,10);};
    async function api(action, data={}) {const response = await fetch(root.dataset.endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action,...data})});let json;try {json=await response.json();} catch {throw new Error('The booking service is unavailable. Please try again.');}if(!json.success)throw new Error(json.data?.message || 'Could not complete the request.');return json.data;}
    const field = (label,name,type='text',extra='') => `<label class="sb-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(b[name])}" ${extra}></label>`;
    const radio = (name,value,title,detail,selected) => `<label class="sb-choice ${selected?'is-selected':''}"><input type="radio" name="${name}" value="${esc(value)}" ${selected?'checked':''} required><span><strong>${esc(title)}</strong>${detail?`<small>${esc(detail)}</small>`:''}</span><span class="sb-check" aria-hidden="true"></span></label>`;
    function slots() {
      if (!b.date || !branch()) return [];
      const day = new Date(`${b.date}T12:00:00Z`).getUTCDay();const h=branch().hours[day];if(!h || h.closed) return [];
      const arr=[];for(let m=minutes(h.open);m+Math.max(5,duration())<=minutes(h.close);m+=Number(s.slot_interval)){
        let valid=true;
        for(const guest of guests()){
          let offset=0;
          for(const line of guest.treatments){
            const start=m+offset, end=start+Number(variant(line)?.duration||0);
            if(isDoctor(line)?(start<600||end>1110):(start>1170))valid=false;
            offset+=Number(variant(line)?.duration||0);
          }
        }
        if(valid)arr.push(clock(m));
      }return arr;
    }
    function body() {
      if(step===0) return `<p class="sb-intro">A few details to make your visit feel personal.</p><div class="sb-grid">${field('Full name','name','text','required autocomplete="name" maxlength="160"')}${field('Email address','email','email','required autocomplete="email" maxlength="190"')}${field('Phone number','phone','tel','required autocomplete="tel" placeholder="+ country code and number" pattern="[+0-9() .\\-]{7,30}" maxlength="30"')}${field('Nationality','nationality','text','required placeholder="e.g. Malaysian" maxlength="100"')}</div><label class="sb-field"><span>Where did you find us?</span><select name="source" required><option value="">Select a source</option>${s.sources.map(v=>`<option ${b.source===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label class="sb-honey" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><label class="sb-consent"><input type="checkbox" name="consent" ${b.consent?'checked':''} required><span>I agree that my details will be stored and used to handle this booking request.${s.privacy_url?` <a href="${esc(s.privacy_url)}" target="_blank" rel="noopener noreferrer">Privacy policy</a>`:''}</span></label>`;
      if(step===1) return `<p class="sb-intro">Find your space to unwind.</p><div class="sb-choices">${s.branches.map(v=>`<div>${radio('branch_id',v.id,v.name,v.address,b.branch_id===v.id)}${v.google_url?`<a class="sb-google" href="${esc(v.google_url)}" target="_blank" rel="noopener noreferrer">View Google Business page ↗</a>`:''}</div>`).join('')}</div>`;
      if(step===2) return `<p class="sb-intro">Come on your own, or share the experience.</p>${field('How many guests?','pax','number',`required min="1" max="${s.max_pax}" step="1"`)}<p class="sb-label">Room preference</p>${Number(b.pax)>2?`<label class="sb-field"><span>How many couple rooms would you prefer?</span><select name="couple_rooms" required>${Array.from({length:Math.min(Math.floor(Number(b.pax)/2),Math.floor(Number(s.max_pax)/2))+1},(_,i)=>`<option value="${i}" ${b.couple_rooms===i?'selected':''}>${i===0?'No couple rooms — all single rooms':`${i} couple room${i===1?'':'s'} · ${i*2} guests`}</option>`).join('')}</select></label><p class="sb-hint">Each couple room accommodates two guests. Remaining guests are assigned single rooms.</p><p class="sb-room-plan" role="status">Requested: <strong>${esc(roomSummary())}</strong></p>`:`<div class="sb-choices">${radio('room','Separate rooms','Single rooms','A private space for each guest.',b.room==='Separate rooms')}${Number(b.pax)===2?radio('room','Couple room','Couple room','Enjoy your treatments together.',b.room==='Couple room'):''}</div>`}<p class="sb-room-notice">${roomNotice}</p><p class="sb-hint">Next, choose one or more treatments individually for each guest. If you reduce the guest count, hidden guest selections are excluded from this booking and restored if you increase it again.</p>`;
      if(step===3) {
        const guest=guests()[activeGuest];
        return `<p class="sb-intro">A personal wellness journey for every guest. Choose up to 10 treatments per guest.</p><div class="sb-guest-tabs" role="group" aria-label="Choose guest">${guests().map((g,i)=>`<button type="button" class="sb-guest-tab ${i===activeGuest?'is-selected':''}" data-guest="${i}" aria-pressed="${i===activeGuest}">Guest ${i+1}<small>${complete(g)?'✓ Selections ready':'Choose treatments'}</small></button>`).join('')}</div><section class="sb-guest-panel" aria-label="Guest ${activeGuest+1} treatments"><h3>Guest ${activeGuest+1}</h3>${guest.treatments.map((line,i)=>{
          const prefix=`g${activeGuest}_t${i}_`;
          const select=(key,title,options)=>`<label class="sb-field"><span>${title}</span><select name="${prefix+key}" required><option value="">Select ${title.toLowerCase()}</option>${options.map(v=>`<option value="${esc(v.id)}" ${line[key]===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label>`;
          return `<article class="sb-treatment-card"><div class="sb-card-heading"><h4>Treatment ${i+1}</h4>${guest.treatments.length>1?`<button type="button" class="sb-back" data-remove="${i}" aria-label="Remove treatment ${i+1} from Guest ${activeGuest+1}">Remove</button>`:''}</div>${select('category_id','Category',s.categories)}${line.category_id?select('treatment_id','Treatment',s.treatments.filter(t=>t.category_id===line.category_id)):''}${treatment(line)?`<p class="sb-hint">${esc(treatment(line).description)}</p>${isDoctor(line)?`<p class="sb-hint"><strong>Consultation hours:</strong> 10:00 AM–6:30 PM. Languages: English, Sinhala; Japanese guests can use Translator apps.</p><label class="sb-field"><span>Preferred consultation language</span><select name="${prefix}consultation_language">${['English','Sinhala','Japanese (Translator apps)'].map(v=>`<option value="${esc(v)}" ${line.consultation_language===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`:''}${select('variant_id','Duration / variant',treatment(line).variants.map(v=>({...v,name:`${v.name} · ${v.duration} min · ${money(v.price)}`})))}${isDoctor(line)?`<div class="sb-doctor-card"><span class="sb-doctor-label">Your consulting doctor</span><a href="https://lk.linkedin.com/in/harshana-niriella" target="_blank" rel="noopener noreferrer">Dr. Harshana Niriella ↗</a><small>Ayurvedic Physician · B.A.M.S. (Hons.)</small></div>`:`<label class="sb-field"><span>Therapist preference for this treatment</span><select name="${prefix}therapist_preference">${['No preference','Male therapist','Female therapist'].map(v=>`<option ${line.therapist_preference===v?'selected':''}>${v}</option>`).join('')}</select></label>`}`:''}</article>`;
        }).join('')}${guest.treatments.length<10?'<button type="button" class="sb-secondary" data-add-treatment>+ Add another treatment</button>':''}<p class="sb-guest-total">Guest ${activeGuest+1}: ${money(guestCents(guest)/100)} · ${guestDuration(guest)} minutes</p></section><p class="sb-hint">Choose each guest above before continuing. Therapist preferences depend on availability for spa treatments. Doctor consultations are conducted by Dr. Harshana Niriella.</p>`;
      }
      if(step===4) return `<p class="sb-intro">Add a finishing touch for each guest. All add-ons are optional.</p>${guests().map((guest,i)=>`<section class="sb-guest-panel"><h3>Guest ${i+1} · Add-ons</h3><div class="sb-choices">${s.addons.map(a=>`<label class="sb-choice ${guest.addon_ids.includes(a.id)?'is-selected':''}"><input type="checkbox" name="g${i}_addons" value="${esc(a.id)}" ${guest.addon_ids.includes(a.id)?'checked':''}><span><strong>${esc(a.name)}</strong><small>${money(a.price)}${a.duration?` · +${a.duration} min`:''}</small></span><span class="sb-check" aria-hidden="true"></span></label>`).join('')||'<p class="sb-hint">No add-ons available.</p>'}</div><p class="sb-guest-total">Guest ${i+1} subtotal: ${money(guestCents(guest)/100)} · ${guestDuration(guest)} minutes</p></section>`).join('')}<label class="sb-field"><span>Anything you’d like us to know?</span><textarea name="notes" rows="3" maxlength="1000" placeholder="Preferences or special requests. Please avoid sensitive medical details.">${esc(b.notes)}</textarea></label>`;
      if(step===5) return `<p class="sb-intro">Choose a moment that works for you.</p><p class="sb-hint">Doctor consultations: 10:00 AM–6:30 PM. Spa treatments: last appointment starts by 7:30 PM, subject to duration and closing hours.</p>${field('Preferred date','date','date',`required min="${today}" max="${maxDate()}"`)}<p class="sb-label">Preferred arrival time <small>(${esc(timezone)})</small></p><div class="sb-slots">${slots().map(v=>`<label class="sb-slot"><input type="radio" name="time" value="${v}" ${b.time===v?'checked':''} required><span>${v}</span></label>`).join('')||'<p class="sb-hint">Choose a date to see times. If no times fit your treatments, try another date or contact our team.</p>'}</div><p class="sb-hint">Longest guest itinerary: ${duration()} minutes. Times assume guests start together, with each guest’s treatments performed in sequence. Our front desk will confirm rooms, therapists and start times.</p>`;
      const pairs=[['Name',b.name],['Phone',b.phone],['Email',b.email],['Guests',b.pax],['Date & time',`${b.date} at ${b.time} (${timezone})`],['Branch',branch()?.name],['Room preference',roomSummary()],['Room availability',roomNotice],['Notes',b.notes||'None'],['Nationality',b.nationality],['Found us via',b.source]];
      return `<p class="sb-intro">Your next moment of calm, all in one place.</p><dl class="sb-review">${pairs.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${guests().map((guest,i)=>`<section class="sb-guest-panel"><h3>Guest ${i+1}</h3><ol class="sb-itinerary">${guest.treatments.map(line=>`<li><strong>${esc(treatment(line)?.name)} · ${esc(variant(line)?.name)}</strong><span>${variant(line)?.duration} min · ${money(variant(line)?.price)}${isDoctor(line)?`<br>Doctor: Dr. Harshana Niriella<br>Language: ${esc(line.consultation_language||'English')}`:`<br>Therapist: ${esc(line.therapist_preference)}`}</span></li>`).join('')}</ol><p>Add-ons: ${guestAddons(guest).map(a=>`${esc(a.name)} (${money(a.price)})`).join(', ')||'None'}</p><p class="sb-guest-total">${guestDuration(guest)} minutes · ${money(guestCents(guest)/100)}</p></section>`).join('')}<div class="sb-total"><span>Estimated total <small>Sum of all guest selections</small></span><strong>${money(price())}</strong></div><p class="sb-hint">Sending saves your request with a timestamp. WhatsApp and email open a prepared message for you to send. Your appointment is confirmed only after our team replies. For a long itinerary, use the saved summary’s copy button if your messaging app cannot open the full link.</p><div class="sb-send">${(branch()?.whatsapp||s.whatsapp)?'<button type="button" data-send="whatsapp" class="sb-primary">Send via WhatsApp ↗</button>':''}${(branch()?.email||s.email)?'<button type="button" data-send="email" class="sb-secondary">Send via email ↗</button>':''}<button type="button" data-send="copy" class="sb-secondary">Save & copy booking summary</button></div>`;
    }
    function capture() {
      const form=root.querySelector('form');if(!form)return;const data=new FormData(form);
      const common=['name','email','phone','nationality','source','branch_id','pax','room','couple_rooms','date','time','notes','website'];
      for(const [key,value] of data){
        if(common.includes(key))b[key]=value;
        const match=/^g(\d+)_t(\d+)_(category_id|treatment_id|variant_id|therapist_preference|consultation_language)$/.exec(key);
        if(match)b.guests[Number(match[1])].treatments[Number(match[2])][match[3]]=value;
      }
      if(step===0)b.consent=data.has('consent');
      if(step===4)guests().forEach((guest,i)=>{guest.addon_ids=data.getAll(`g${i}_addons`);});
      if(step===2&&data.has('room'))b.couple_rooms=data.get('room')==='Couple room'?1:0;
      normalizeRooms();normalizeGuests();
    }
    function valid() {
      const form=root.querySelector('form');if(!form.reportValidity())return false;
      if(step===1&&!branch())return error('Please choose a branch.');
      if(step===3){const missing=guests().findIndex(g=>!complete(g));if(missing!==-1){activeGuest=missing;render(true);return error(`Please complete every treatment for Guest ${missing+1}.`);}}
      if(step===5&&(!b.date||!slots().includes(b.time)))return error('Please select a date and a valid time.');
      return true;
    }
    function error(msg) {const el=root.querySelector('.sb-error');el.textContent=msg;el.hidden=false;el.focus();return false;}
    function render(focus=false) {
      if(result) {renderSuccess();return;}
      root.innerHTML=`<div class="sb-shell"><aside class="sb-sidebar"><a class="sb-brand" href="#">${esc(s.business_name)}</a><span class="sb-eyebrow">A LITTLE TIME FOR YOU</span><h2>Your wellbeing.<br>Your moment.</h2><p>A thoughtful experience,<br>from the very first step.</p><ol class="sb-progress" aria-label="Booking progress">${steps.map((title,i)=>`<li class="${i===step?'is-current':i<step?'is-complete':''}" ${i===step?'aria-current="step"':''}><span>${i<step?'✓':String(i+1).padStart(2,'0')}</span>${title}</li>`).join('')}</ol><div class="sb-sidebar-foot">Take a breath. We’ll take care of the rest.</div></aside><main class="sb-main"><div class="sb-topline"><span>YOUR VISIT, YOUR WAY</span><span>Step ${step+1} of ${steps.length}</span></div><div class="sb-mobile-progress" aria-hidden="true"><span style="width:${(step+1)/steps.length*100}%"></span></div><h2 tabindex="-1">${steps[step]}</h2><form><div class="sb-error" role="alert" tabindex="-1" hidden></div>${body()}<div class="sb-nav">${step>0?'<button type="button" class="sb-back">← Back</button>':'<span></span>'}${step<6?'<button class="sb-primary" type="submit">Continue <span aria-hidden="true">→</span></button>':''}</div></form><footer class="sb-footer">Booking request · Availability confirmed by our team</footer></main></div>`;
      root.querySelector('.sb-brand').addEventListener('click',e=>e.preventDefault());
      root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();capture();if(valid()){step++;render(true);}});
      root.querySelector('.sb-back')?.addEventListener('click',()=>{capture();step--;render(true);});
      root.querySelector('form').addEventListener('change',e=>{capture();const name=e.target.name;
        if(name==='branch_id'){b.time='';render();}
        else if(name==='pax'){b.time='';render();}
        else if(name==='date'){b.time='';render();}
        else {
          const match=/^g(\d+)_t(\d+)_(category_id|treatment_id|variant_id|therapist_preference|consultation_language)$/.exec(name);
          if(match){const line=b.guests[Number(match[1])].treatments[Number(match[2])];if(['category_id','treatment_id'].includes(match[3])){if(match[3]==='category_id')line.treatment_id='';line.variant_id='';line.therapist_preference='No preference';}b.time='';render();}
          else if(/^g\d+_addons$/.test(name)){b.time='';render();}
          else if(['room','couple_rooms'].includes(name))render();
        }
      });
      root.querySelectorAll('[data-guest]').forEach(btn=>btn.addEventListener('click',()=>{capture();activeGuest=Number(btn.dataset.guest);render();}));
      root.querySelector('[data-add-treatment]')?.addEventListener('click',()=>{capture();const guest=b.guests[activeGuest];if(guest.treatments.length<10)guest.treatments.push(emptyTreatment());b.time='';render();});
      root.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{capture();const guest=b.guests[activeGuest];if(guest.treatments.length>1)guest.treatments.splice(Number(btn.dataset.remove),1);b.time='';render();}));
      root.querySelectorAll('[data-send]').forEach(btn=>btn.addEventListener('click',()=>submit(btn.dataset.send)));
      if(focus){root.querySelector('h2[tabindex]').focus();root.scrollIntoView({behavior:'smooth',block:'start'});}
    }
    async function copy() {
      try {await navigator.clipboard.writeText(result.summary);root.querySelector('.sb-copy-status').textContent='Booking summary copied.';}
      catch {const area=root.querySelector('.sb-summary');area.focus();area.select();root.querySelector('.sb-copy-status').textContent='Select and copy the summary below using your device’s copy command.';}
    }
    function renderSuccess() {
      root.innerHTML=`<main class="sb-success"><div class="sb-success-mark" aria-hidden="true">✓</div><span class="sb-eyebrow">YOUR REQUEST IS SAVED</span><h2>One step closer to feeling good.</h2><p>Booking request #${result.id}. Send the prepared message below; our team will reply to confirm your visit.</p><div class="sb-send">${result.whatsapp_url?`<a class="sb-primary" href="${esc(result.whatsapp_url)}" target="_blank" rel="noopener noreferrer">Open WhatsApp ↗</a>`:''}${result.email_url?`<a class="sb-secondary" href="${esc(result.email_url)}">Open email app ↗</a>`:''}<button class="sb-secondary sb-copy" type="button">Copy booking summary</button></div><p class="sb-copy-status" role="status"></p><label class="sb-field"><span>Timestamped booking summary</span><textarea class="sb-summary" rows="16" readonly>${esc(result.summary)}</textarea></label><button class="sb-back sb-new" type="button">Start another booking</button></main>`;
      root.querySelector('.sb-copy').addEventListener('click',copy);
      root.querySelector('.sb-new').addEventListener('click',()=>{result=null;step=0;b.request_key=uuid();render(true);});
    }
    async function submit(channel) {
      if(busy)return;
      if(!guests().every(complete)){step=3;render(true);error('Complete every guest’s treatment selections.');return;}
      if(!slots().includes(b.time)){step=5;render(true);error('Your treatment and add-ons no longer fit the selected time. Choose another time.');return;}
      busy=true;root.querySelectorAll('[data-send]').forEach(btn=>{btn.disabled=true;});
      try {result=await api('serene_submit',{nonce,booking:JSON.stringify({...b,guests:guests(),channel,pax:Number(b.pax)})});renderSuccess();
        if(channel==='copy')await copy();
        else {const url=channel==='whatsapp'?result.whatsapp_url:result.email_url;if(url)window.location.href=url;}
      } catch(e) {error(e.message);root.querySelectorAll('[data-send]').forEach(btn=>{btn.disabled=false;});}finally{busy=false;}
    }
    try {const data=await api('serene_bootstrap');({settings:s,nonce,today,timezone}=data);if(!s.branches.length||!s.treatments.length){root.innerHTML='<div class="sb-loading">Online booking will be available soon. Please contact our team to arrange your visit.</div>';return;}render();}
    catch(e) {root.innerHTML=`<div class="sb-loading" role="alert">${esc(e.message)} <button type="button" class="sb-secondary">Retry</button></div>`;root.querySelector('button').addEventListener('click',()=>window.location.reload());}
  });
})();
