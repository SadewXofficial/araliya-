(() => {
  'use strict';
  const normalise = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
  document.querySelectorAll('.ktm-menu').forEach(root => {
    const toolbar=root.querySelector('.ktm-toolbar');
    if(!toolbar)return;
    const cards=Array.from(root.querySelectorAll('.ktm-treatment'));
    const list=root.querySelector('.ktm-list');
    const search=root.querySelector('.ktm-search input');
    const sort=root.querySelector('.ktm-sort select');
    const filters=Array.from(root.querySelectorAll('[data-category]')).filter(node=>node.tagName==='BUTTON');
    const count=root.querySelector('.ktm-result-count');
    const empty=root.querySelector('.ktm-no-results');
    const expand=root.querySelector('.ktm-expand');
    let category='';
    function visibleCards(){return cards.filter(card=>!card.hidden);}
    function updateExpand(){const visible=visibleCards();const open=visible.length>0&&visible.every(card=>card.open);expand.textContent=open?'Collapse details':'Expand details';expand.disabled=!visible.length;}
    function apply(){
      const term=normalise(search.value);
      cards.forEach(card=>{card.hidden=Boolean((category&&card.dataset.category!==category)||(term&&!normalise(card.dataset.search).includes(term)));});
      const ordered=[...cards].sort((a,b)=>{
        if(sort.value==='name')return a.dataset.name.localeCompare(b.dataset.name);
        if(sort.value==='price')return Number(a.dataset.price)-Number(b.dataset.price)||Number(a.dataset.order)-Number(b.dataset.order);
        if(sort.value==='duration')return Number(a.dataset.duration)-Number(b.dataset.duration)||Number(a.dataset.order)-Number(b.dataset.order);
        return Number(a.dataset.order)-Number(b.dataset.order);
      });
      ordered.forEach(card=>list.appendChild(card));
      const total=visibleCards().length;
      count.textContent=`${total} ${total===1?'treatment':'treatments'} to explore`;
      empty.hidden=total>0;
      updateExpand();
    }
    filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;filters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));apply();}));
    search.addEventListener('input',apply);sort.addEventListener('change',apply);
    expand.addEventListener('click',()=>{const visible=visibleCards();const open=!visible.every(card=>card.open);visible.forEach(card=>{card.open=open;});updateExpand();});
    root.querySelector('.ktm-reset').addEventListener('click',()=>{category='';search.value='';sort.value='curated';filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category==='')));apply();search.focus();});
    cards.forEach(card=>{
      card.addEventListener('toggle',updateExpand);
      const select=card.querySelector('.ktm-variant select');
      select.addEventListener('change',()=>{const option=select.options[select.selectedIndex];card.querySelector('.ktm-selected-price').textContent=option.dataset.priceLabel;card.querySelector('.ktm-selected-duration').textContent=`${option.dataset.duration} min`;});
    });
    toolbar.hidden=false;
    apply();
  });
})();
