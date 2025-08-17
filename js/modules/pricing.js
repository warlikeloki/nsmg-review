// /js/modules/pricing.js
export async function loadPricing(){
  const pkg=document.getElementById('packages-body');const ala=document.getElementById('ala-carte-body');if(!pkg||!ala)return;
  function fmt(a,u){const n=Number(a);const f=isFinite(n)?n.toLocaleString(undefined,{style:'currency',currency:'USD'}):a;return u?`${f} ${u}`:f}
  async function getData(){
    try{const r=await fetch('/php/get_pricing.php');if(r.ok){const j=await r.json();if(j?.success&&Array.isArray(j.data))return j.data}}catch{}
    try{const r=await fetch('/json/pricing.json');if(r.ok)return await r.json()}catch{};return null;
  }
  try{
    const d=await getData();let pk=[],al=[];
    if(Array.isArray(d)){pk=d.filter(x=>Number(x.is_package)===1);al=d.filter(x=>Number(x.is_package)!==1);}
    else if(d&&(Array.isArray(d.packages)||Array.isArray(d.ala_carte))){pk=d.packages||[];al=d.ala_carte||[];}
    pkg.innerHTML=pk.length?pk.map(x=>`<tr><td>${x.service}</td><td>${x.description||''}</td><td>${fmt(x.price,x.unit)}</td></tr>`).join(''):'<tr><td colspan="3">No packages available.</td></tr>';
    ala.innerHTML=al.length?al.map(x=>`<tr><td>${x.service}</td><td>${x.description||''}</td><td>${fmt(x.price,x.unit)}</td></tr>`).join(''):'<tr><td colspan="3">No à la carte services available.</td></tr>';
  }catch(e){console.error('Pricing load error:',e);pkg.innerHTML='<tr><td colspan="3">Error loading pricing.</td></tr>';ala.innerHTML='<tr><td colspan="3">Error loading pricing.</td></tr>';}
}
