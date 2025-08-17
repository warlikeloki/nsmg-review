// /js/modules/homepage.js
if(document.getElementById('homepage')){
  (async()=>{
    const c=document.querySelector('.services-cards');if(!c)return;
    try{
      let data=null;
      try{const r=await fetch('/php/get_services.php?limit=10');if(r.ok){const j=await r.json();if(j?.success&&Array.isArray(j.data))data=j.data}}catch{}
      if(!data){try{const r=await fetch('/json/services.json');if(r.ok){const arr=await r.json();if(Array.isArray(arr))data=arr}}catch{}}
      if(!data?.length){c.innerHTML='<p>Services coming soon.</p>';return;}
      c.innerHTML=data.map(s=>`
        <div class="service-card">
          <img src="${s.icon||'/images/default-service.png'}" alt="${s.name} Icon" class="service-icon">
          <h3>${s.name}</h3>
          <p>${s.description||''}</p>
          <a href="/services.html#${(s.name||'').toLowerCase().replace(/\s/g,'-')}" class="service-link">Learn More</a>
        </div>`).join('');
    }catch(e){console.error('Services preview error:',e);c.innerHTML='<p>Unable to load services.</p>';}
  })();
  (async()=>{
    const c=document.querySelector('.blog-post-preview');if(!c)return;
    try{
      let posts=null;
      try{const r=await fetch('/php/get_posts.php');if(r.ok){const j=await r.json();if(j?.success&&Array.isArray(j.data))posts=j.data}}catch{}
      if(!posts){const r=await fetch('/json/posts.json');if(r.ok)posts=await r.json();}
      if(!posts?.length){c.innerHTML='<div>No blog posts found.</div>';return;}
      const firstTwo=posts.slice(0,2);
      c.innerHTML=firstTwo.map((p,i)=>`
        <article class="blog-card">
          <h3>${p.title||"Untitled Post"}</h3>
          <p>${p.teaser||(p.content?p.content.slice(0,160)+'…':'')}</p>
          <a href="/blog-post.html?id=${i}" class="blog-link">Read More</a>
        </article>`).join('');
    }catch(e){console.error('Blog preview error:',e);c.innerHTML='<div>No blog posts found.</div>';}
  })();
}
export {};
