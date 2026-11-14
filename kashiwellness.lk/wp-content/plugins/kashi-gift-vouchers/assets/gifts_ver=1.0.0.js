(function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=value=>'LKR '+Number(value).toLocaleString(undefined,{maximumFractionDigits:0});
 const uuid=()=>globalThis.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint8Array(1))[0]%16:Math.floor(Math.random()*16);return(c==='x'?r:(r&3)|8).toString(16);});
 const methods={cash:'Cash in-store',card:'Card in-store',bank:'Online bank transfer'};
 const fulfillment={digital:'Digital delivery',pickup:'In-store collection',pickme:'PickMe Flash delivery'};
 document.querySelectorAll('.kgv-app').forEach(root=>{
  let config,nonce,step=0,busy=false,result=null,modalOpen=false;
  const fresh=()=>({amount:'',voucher_type:'digital',gift_box:false,name:'',phone:'',email:'',recipient_name:'',gift_message:'',branch_id:'',fulfillment:'digital',digital_channel:'whatsapp',digital_contact:'',delivery_address:'',delivery_phone:'',payment_method:'',terms_accepted:false,website:'',request_key:uuid()});
  let order=fresh();
  const branch=()=>config.branches.find(b=>b.id===order.branch_id);
  const quote=()=>window.KashiGiftRules.quote(Number(order.amount),order.voucher_type,order.gift_box,config);
  const safeQuote=()=>{try{return quote();}catch{return{amount:0,gift_fee:0,total:0,eligible:false};}};
  const choices=(name,value,title,detail,icon='')=>`<label class="kgv-choice ${String(order[name])===String(value)?'is-selected':''}"><input type="radio" name="${name}" value="${esc(value)}" ${String(order[name])===String(value)?'checked':''} required><span><span class="kgv-choice-icon" aria-hidden="true">${icon}</span><strong>${esc(title)}</strong>${detail?`<small>${esc(detail)}</small>`:''}</span><span class="kgv-check" aria-hidden="true">✓</span></label>`;
  const field=(label,name,type='text',extra='')=>`<label class="kgv-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(order[name])}" ${extra}></label>`;
  function giftBox(){
   if(order.voucher_type!=='physical')return'';
   const q=safeQuote();return `<fieldset><legend>Make it extra special</legend>${q.eligible?'<p class="kgv-notice">Your voucher qualifies for a complimentary gift box with a scented candle. Choose it below if you would like one.</p>':`<p class="kgv-hint">Add a gift box with a scented candle for ${money(config.gift_fee)}. Complimentary with physical vouchers valued at ${money(config.gift_threshold)} or more.</p>`}<div class="kgv-options">${choices('gift_box','false','Just the voucher','No gift box','◇')}${choices('gift_box','true','Gift box + scented candle',q.eligible?'Complimentary':'+ '+money(config.gift_fee),'✦')}</div></fieldset>`;
  }
  function review(){
   const q=quote(),b=branch(),rows=[['Voucher',order.voucher_type==='digital'?'E-voucher':'Physical voucher'],['Voucher value',money(q.amount)],['Gift box + scented candle',order.gift_box?(q.gift_fee===0?'Complimentary':money(q.gift_fee)):'Not requested'],['Branch',b?.name],['Delivery / collection',fulfillment[order.fulfillment]],['Payment',methods[order.payment_method]],['Your details',`${order.name}\n${order.phone}\n${order.email}`]];
   if(order.recipient_name)rows.push(['Recipient',order.recipient_name]);
   if(order.fulfillment==='digital')rows.push(['Digital delivery',`${order.digital_channel==='email'?'Email':'WhatsApp'}: ${order.digital_contact||(order.digital_channel==='email'?order.email:order.phone)}`]);
   if(order.fulfillment==='pickme')rows.push(['Delivery address',order.delivery_address],['Delivery contact',order.delivery_phone||order.phone]);
   if(order.gift_message)rows.push(['Gift message',order.gift_message]);
   return `<dl class="kgv-review">${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><div class="kgv-review-total"><span>Order total${order.fulfillment==='pickme'?'<small>PickMe Flash delivery fee is additional</small>':''}</span><strong>${money(q.total)}</strong></div>${order.fulfillment==='pickme'?'<p class="kgv-notice">You bear the PickMe Flash delivery fee. It is not included above; the branch will confirm the delivery arrangements and fee.</p>':''}${order.payment_method==='bank'?'<button type="button" class="kgv-text-button" data-bank>View bank transfer details ↗</button>':''}<details class="kgv-terms" open><summary>Terms & conditions</summary><div>${esc(config.terms).replace(/\n/g,'<br>')}</div></details><label class="kgv-consent"><input type="checkbox" name="terms_accepted" ${order.terms_accepted?'checked':''} required><span>I agree to the terms and consent to my order details being saved and included in the prepared WhatsApp message.</span></label><p class="kgv-hint">Your request will be saved, then WhatsApp opens with a message to ${esc(b?.name)}. Press Send there to complete the handoff. No payment is taken on this website.</p>`;
  }
  function body(){
   if(step===0)return `<p class="kgv-intro">A thoughtful gift, made personal.</p>${field('Voucher value (LKR)','amount','number','required min="1" max="1000000" step="1" inputmode="numeric" placeholder="e.g. 15000"')}<fieldset><legend>Choose your voucher</legend><div class="kgv-options">${choices('voucher_type','digital','E-voucher','Delivered by email or WhatsApp after payment confirmation','↗')}${choices('voucher_type','physical','Physical voucher','A beautifully presented gift to hold','✦')}</div></fieldset>${giftBox()}`;
   if(step===1)return `<p class="kgv-intro">Who is this lovely moment from?</p><div class="kgv-fields">${field('Your name','name','text','required maxlength="160" autocomplete="name"')}${field('Your phone (with country code)','phone','tel','required maxlength="30" autocomplete="tel" placeholder="+94 …"')}${field('Your email','email','email','required maxlength="190" autocomplete="email"')}${field('Recipient name (optional)','recipient_name','text','maxlength="160"')}</div><label class="kgv-field"><span>A personal message (optional)</span><textarea name="gift_message" rows="3" maxlength="500" placeholder="A few words from the heart…">${esc(order.gift_message)}</textarea></label><label class="kgv-honey" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>`;
   if(step===2)return `<p class="kgv-intro">Choose the branch that will take care of your gift.</p><fieldset><legend>${order.voucher_type==='physical'&&order.fulfillment==='pickup'?'Collection branch':'Handling branch'}</legend><div class="kgv-branch-options">${config.branches.map(b=>choices('branch_id',b.id,b.name,b.address,'⌁')).join('')}</div></fieldset>${order.voucher_type==='physical'?`<fieldset><legend>How would you like to receive it?</legend><div class="kgv-options">${choices('fulfillment','pickup','I’ll collect in-store','Collect from the selected branch. No delivery fee.','⌂')}${choices('fulfillment','pickme','PickMe Flash delivery','Delivery fee applies and is paid by you.','↗')}</div></fieldset>${order.fulfillment==='pickme'?`<p class="kgv-notice">PickMe Flash fees are separate from your voucher total and payable by you. The branch will confirm arrangements.</p><label class="kgv-field"><span>Full delivery address</span><textarea name="delivery_address" rows="3" required minlength="8" maxlength="500">${esc(order.delivery_address)}</textarea></label>${field('Delivery contact number (optional; defaults to your phone)','delivery_phone','tel','maxlength="30"')}`:''}`:`<fieldset><legend>Send the e-voucher via</legend><div class="kgv-options">${choices('digital_channel','whatsapp','WhatsApp','Issued after payment is confirmed.','↗')}${choices('digital_channel','email','Email','Issued after payment is confirmed.','✉')}</div></fieldset>${field(order.digital_channel==='email'?'Delivery email (optional; defaults to your email)':'Delivery phone (optional; defaults to your phone)','digital_contact',order.digital_channel==='email'?'email':'tel','maxlength="190"')}`}`;
   if(step===3)return `<p class="kgv-intro">A simple way to arrange payment.</p><div class="kgv-branch-options">${config.methods.map(method=>choices('payment_method',method,methods[method],method==='bank'?'View the bank details and transfer directly.':'Pay at the selected branch. No online card details needed.',method==='bank'?'⇄':'◇')).join('')}</div>${order.payment_method==='bank'?'<p><button type="button" class="kgv-text-button" data-bank>View bank transfer details ↗</button></p><p class="kgv-hint">Selecting bank transfer does not confirm payment. Share the receipt with your selected branch for verification.</p>':''}<div class="kgv-notice">No payment gateway. Payment and voucher issuance are confirmed by our team.</div>`;
   return review();
  }
  function modal(){
   if(!config.bank)return'';const q=safeQuote();return `<div class="kgv-dialog" hidden role="dialog" aria-modal="true" aria-label="Bank transfer details"><div class="kgv-dialog-panel"><button type="button" class="kgv-dialog-close" data-close-bank aria-label="Close bank details">×</button><p class="kgv-eyebrow">DIRECT BANK TRANSFER</p><h3 tabindex="-1">Bank details</h3><p class="kgv-bank-total">Please pay <strong>${money(q.total)}</strong></p>${order.fulfillment==='pickme'?'<p class="kgv-hint">Delivery fee is additional; confirm it with the branch.</p>':''}<dl class="kgv-review">${[['Account name',config.bank.account_name],['Account number',config.bank.account_number],['Bank',config.bank.bank_name],['Branch',config.bank.bank_branch]].filter(x=>x[1]).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><button type="button" class="kgv-secondary" data-copy-account>Copy account number</button><p class="kgv-copy-status" role="status"></p><input class="kgv-bank-account" aria-label="Account number for manual copying" value="${esc(config.bank.account_number)}" readonly><p class="kgv-notice">${esc(config.bank.note)}</p><button type="button" class="kgv-primary" data-close-bank>Back to my gift</button></div></div>`;
  }
  function openBank(){const dialog=root.querySelector('.kgv-dialog');if(!dialog)return;modalOpen=true;dialog.hidden=false;root.querySelector('form').inert=true;dialog.querySelector('h3').focus();}
  function closeBank(){const dialog=root.querySelector('.kgv-dialog');if(!dialog)return;modalOpen=false;dialog.hidden=true;root.querySelector('form').inert=false;root.querySelector('[data-bank]')?.focus();}
  function error(message){const el=root.querySelector('.kgv-error');el.textContent=message;el.hidden=false;el.focus();return false;}
  function capture(){
   const form=root.querySelector('form');if(!form)return;const data=new FormData(form);
   for(const [key,value] of data){if(key==='gift_box')order.gift_box=value==='true';else if(key!=='terms_accepted')order[key]=value;}
   if(step===4)order.terms_accepted=data.has('terms_accepted');
  }
  function valid(){
   if(!root.querySelector('form').reportValidity())return false;
   try{quote();}catch(e){return error(e.message);}
   const phone=value=>/^\+?[0-9() .-]{7,30}$/.test(value)&&/^\d{7,15}$/.test(value.replace(/\D/g,''));
   if(step===1&&!phone(order.phone))return error('Enter a valid phone number, including your country code.');
   if(step===2){
    if(!branch())return error('Please choose your branch.');
    if(order.fulfillment==='pickme'&&order.delivery_phone&&!phone(order.delivery_phone))return error('Check the delivery contact number.');
    if(order.fulfillment==='digital'&&order.digital_channel==='whatsapp'&&order.digital_contact&&!phone(order.digital_contact))return error('Check the WhatsApp delivery number.');
   }
   if(step===3&&!config.methods.includes(order.payment_method))return error('Please choose a payment method.');
   if(step===4&&!order.terms_accepted)return error('Please accept the terms before ordering.');
   return true;
  }
  function render(focus=false){
   if(result){success();return;}modalOpen=false;const q=safeQuote(),names=['Your gift','Your details','Delivery','Payment','Review'];
   root.innerHTML=`<section class="kgv-shell"><header class="kgv-header"><a class="kgv-brand" href="#">${esc(config.brand)}</a><a class="kgv-menu-link" href="${esc(config.menu_url)}" target="_blank" rel="noopener noreferrer">Check the menu ↗</a></header><div class="kgv-layout"><aside class="kgv-aside"><p class="kgv-eyebrow">THE GIFT OF WELLBEING</p><h2>${esc(config.heading)}</h2><p>${esc(config.intro)}</p><div class="kgv-gift-card"><span>${esc(config.brand)}</span><div class="kgv-card-symbol" aria-hidden="true">✦</div><p>A moment, just for you.</p><strong>${q.amount?money(q.amount):'Your gift. Their moment.'}</strong><small>${order.voucher_type==='digital'?'E-VOUCHER':'PHYSICAL VOUCHER'}</small></div><div class="kgv-aside-total"><span>Gift total</span><strong>${money(q.total)}</strong></div><p class="kgv-delivery-foot">${order.fulfillment==='pickme'?'Delivery fee payable separately.':'A gift arranged with care.'}</p></aside><div class="kgv-main"><ol class="kgv-progress" aria-label="Gift order progress">${names.map((name,i)=>`<li ${i===step?'aria-current="step"':''} class="${i<step?'is-complete':''}"><span>${i<step?'✓':i+1}</span><small>${name}</small></li>`).join('')}</ol><h2 class="kgv-step-title" tabindex="-1">${names[step]}</h2><form><div class="kgv-error" role="alert" tabindex="-1" hidden></div>${body()}<div class="kgv-navigation">${step?'<button type="button" class="kgv-back">← Back</button>':'<span></span>'}${step<4?'<button type="submit" class="kgv-primary">Continue →</button>':'<button type="submit" class="kgv-primary kgv-purchase">Purchase my gift card ↗</button>'}</div></form><p class="kgv-form-foot">Order request · Payment verified by our team</p></div></div>${modal()}</section>`;
   root.querySelector('.kgv-brand').addEventListener('click',e=>e.preventDefault());
   const form=root.querySelector('form');
   form.addEventListener('submit',event=>{event.preventDefault();capture();if(!valid())return;if(step<4){step++;render(true);}else send();});
   root.querySelector('.kgv-back')?.addEventListener('click',()=>{capture();step--;render(true);});
   form.addEventListener('change',event=>{
    capture();const name=event.target.name;
    if(name==='voucher_type'){order.gift_box=false;order.fulfillment=order.voucher_type==='digital'?'digital':'pickup';order.terms_accepted=false;}
    if(name==='digital_channel')order.digital_contact='';
    if(name!=='terms_accepted')order.terms_accepted=false;
    // A change fires before a tapped Continue button's click. Do not replace that button mid-tap.
    if(name==='amount'){const previousStep=step;setTimeout(()=>{if(step===previousStep&&!busy&&!result)render();},0);return;}
    if(['amount','voucher_type','gift_box','fulfillment','digital_channel','payment_method','branch_id'].includes(name)){render();if(name==='payment_method'&&order.payment_method==='bank')openBank();else root.querySelector(`[name="${name}"]:checked`)?.focus();}
   });
   root.querySelectorAll('[data-bank]').forEach(button=>button.addEventListener('click',openBank));
   root.querySelectorAll('[data-close-bank]').forEach(button=>button.addEventListener('click',closeBank));
   const dialog=root.querySelector('.kgv-dialog');
   dialog?.addEventListener('click',event=>{if(event.target===dialog)closeBank();});
   dialog?.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeBank();}
    if(event.key==='Tab'){
     const all=Array.from(dialog.querySelectorAll('button,input')),first=all[0],last=all[all.length-1];
     if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.querySelector('h3'))){event.preventDefault();last.focus();}
     else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
   });
   root.querySelector('[data-copy-account]')?.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(config.bank.account_number);root.querySelector('.kgv-copy-status').textContent='Account number copied.';}catch{const input=root.querySelector('.kgv-bank-account');input.focus();input.select();root.querySelector('.kgv-copy-status').textContent='Select and copy the account number using your device.';}
   });
   if(focus){const title=root.querySelector('.kgv-step-title');title.focus();title.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  }
  async function api(action,data={}){
   const response=await fetch(root.dataset.endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action,...data})});
   let json;try{json=await response.json();}catch{throw new Error('Our order service could not respond. Please retry or contact your branch.');}
   if(!json.success)throw new Error(json.data?.message||'Could not complete the request.');return json.data;
  }
  async function send(){
   if(busy)return;busy=true;const button=root.querySelector('.kgv-purchase');button.disabled=true;button.textContent='Preparing your request…';
   try{result=await api('kashi_gift_submit',{nonce,order:JSON.stringify({...order,amount:Number(order.amount),settings_version:config.version})});success();window.location.assign(result.whatsapp_url);}
   catch(e){if(result){const status=root.querySelector('.kgv-copy-status');if(status)status.textContent='Use Open WhatsApp below to send your request.';}else{error(e.message);button.disabled=false;button.textContent='Purchase my gift card ↗';}}finally{busy=false;}
  }
  function success(){
   root.innerHTML=`<section class="kgv-success"><p class="kgv-eyebrow">A THOUGHTFUL GIFT STARTS HERE</p><h2>Your request is saved.</h2><p>Order #${Number(result.id)}. Send the prepared message to your selected branch on WhatsApp. Payment and voucher issuance are confirmed by our team.</p><a class="kgv-primary" href="${esc(result.whatsapp_url)}" target="_blank" rel="noopener noreferrer">Open WhatsApp ↗</a> <button class="kgv-secondary kgv-copy" type="button">Copy order summary</button><p class="kgv-copy-status" role="status"></p><label class="kgv-field"><span>Your order summary</span><textarea class="kgv-saved-summary" rows="15" readonly>${esc(result.summary)}</textarea></label><button class="kgv-text-button kgv-new" type="button">Order another gift</button></section>`;
   root.querySelector('.kgv-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.summary);root.querySelector('.kgv-copy-status').textContent='Summary copied.';}catch{const field=root.querySelector('.kgv-saved-summary');field.focus();field.select();root.querySelector('.kgv-copy-status').textContent='Select and copy the summary using your device.';}});
   root.querySelector('.kgv-new').addEventListener('click',()=>{order=fresh();result=null;step=0;render(true);});
  }
  async function start(){
   try{const data=await api('kashi_gift_bootstrap');config=data.config;nonce=data.nonce;
    if(!config.branches.length||!config.methods.length){root.innerHTML='<p class="kgv-loading">Please contact your kashi branch to arrange a gift voucher.</p>';return;}render();
   }catch(e){root.innerHTML=`<p class="kgv-loading" role="alert">${esc(e.message)} <button type="button" class="kgv-secondary kgv-retry">Retry</button></p>`;root.querySelector('.kgv-retry').addEventListener('click',start);}
  }
  start();
 });
}());
