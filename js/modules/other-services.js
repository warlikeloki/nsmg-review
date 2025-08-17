// /js/modules/other-services.js
document.addEventListener('DOMContentLoaded',()=>{
  const c=document.getElementById('other-services-container');if(!c)return;c.innerHTML='<p>Loading services…</p>';
  async function fetchData(){
    try{const r=await fetch('/php/get_other_services.php');if(r.ok){const j=await r.json();if(j?.success&&Array.isArray(j.data))return j.data}}catch{}
    try{const r=await fetch('/json/other-services.json');if(r.ok){const arr=await r.json();if(Array.isArray(arr))return arr}}catch{};return [];
  }
  fetchData().then(items=>{if(!items.length){c.innerHTML='<p>No services to display yet.</p>';return;}render(c,items)}).catch(e=>{console.error('Other services error:',e);c.innerHTML='<p>Unable to load services right now.</p>';});
});
function render(c,items){
  const ul=document.createElement('ul');ul.classList.add('other-services-list');
  items.forEach(it=>{const li=document.createElement('li');const t=document.createElement('strong');t.textContent=it.title||it.service||'Untitled';li.appendChild(t);
    if(it.description){const d=document.createElement('span');d.textContent=` – ${it.description}`;li.appendChild(d);}if(it.anchor){li.id=it.anchor;}ul.appendChild(li);});
  c.innerHTML='';c.appendChild(ul);
}
