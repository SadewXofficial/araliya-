(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KashiGiftRules=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 return {quote:function(amount,type,box,settings){
  if(!Number.isInteger(amount)||amount<1||amount>1000000)throw new Error('Enter a voucher value from LKR 1 to LKR 1,000,000 in whole rupees.');
  if(!['digital','physical'].includes(type)||typeof box!=='boolean'||(type==='digital'&&box))throw new Error('Choose a valid voucher type and gift-box preference.');
  var eligible=type==='physical'&&amount>=Number(settings.gift_threshold),fee=box&&!eligible?Number(settings.gift_fee):0;
  return {amount:amount,gift_box:box,gift_fee:fee,total:amount+fee,eligible:eligible};
 }};
});
