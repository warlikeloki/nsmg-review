// /js/modules/equipment.js
document.addEventListener('DOMContentLoaded', initEquipmentFilter);
window.loadEquipment = initEquipmentFilter;
function groupByCategory(items){const out={};items.forEach(i=>{const c=(i.category||'other').toLowerCase();(out[c]=out[c]||[]).push(i)});return out}
async function fetchEquipment(category){
  try{const r=await fetch(`/php/get_equipment.php?category=${encodeURIComponent(category)}`);if(r.ok){const j=await r.json();if(j?.success&&Array.isArray(j.data))return j.data}}catch{}
  try{const r=await fetch('/json/equipment.json');if(r.ok){const arr=await r.json();if(Array.isArray(arr))return arr.filter(x=>Array.isArray(x.type)&&x.type.map(s=>s.toLowerCase()).includes(category.toLowerCase()))}}catch{}
  return [];
}
function initEquipmentFilter(){
  const c=document.getElementById('equipment-list');if(!c)return;
  const cat=c.getAttribute('data-category');if(!cat)return;
  fetchEquipment(cat).then(items=>{
    if(!items.length){c.innerHTML='<p>No equipment to display yet.</p>';return;}
    const grouped=groupByCategory(items);c.innerHTML='';
    Object.keys(grouped).sort().forEach(k=>{
      const sec=document.createElement('section');sec.className='equipment-category';
      sec.innerHTML=`<h3 class="equipment-category-title">${k.replace(/\b\w/g,m=>m.toUpperCase())}</h3>`;
      const ul=document.createElement('ul');ul.className='equipment-ul';
      grouped[k].forEach(it=>{const li=document.createElement('li');li.className='equipment-item';
        li.innerHTML=`<div class="item-header"><span class="toggle-icon">+</span> ${it.name}</div><div class="item-description">${it.description||'No description available.'}</div>`;
        li.addEventListener('click',()=>{li.classList.toggle('expanded');const ic=li.querySelector('.toggle-icon');if(ic)ic.textContent=li.classList.contains('expanded')?'−':'+';});
        ul.appendChild(li);
      });
      sec.appendChild(ul);c.appendChild(sec);
    });
  }).catch(e=>{console.error('Equipment load error:',e);c.innerHTML='<p>Unable to load equipment at this time.</p>'});
}
