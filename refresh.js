(() => {
  const toggle=document.querySelector('.sb-nav-toggle');
  const links=document.getElementById('sbNavLinks');
  if(toggle && links) {
    toggle.hidden=false;
    toggle.addEventListener('click',() => {const opened=links.classList.toggle('sb-nav-open');toggle.setAttribute('aria-expanded',String(opened));});
    links.addEventListener('click',event => {if(event.target.closest('a')){links.classList.remove('sb-nav-open');toggle.setAttribute('aria-expanded','false');}});
    document.addEventListener('keydown',event => {if(event.key==='Escape'){links.classList.remove('sb-nav-open');toggle.setAttribute('aria-expanded','false');}});
  }
})();

// Read full-size examples without leaving the page.
(() => {
  let dialog,trigger;
  const images=document.querySelectorAll('[data-app-example]');
  images.forEach(img=>{img.tabIndex=0;img.setAttribute('role','button');});
  function open(img){
    trigger=img;
    if(!dialog){
      dialog=document.createElement('dialog');dialog.className='sb-example-zoom';document.body.appendChild(dialog);
      dialog.addEventListener('close',()=>trigger?.focus());
      dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    }
    dialog.replaceChildren();
    const close=document.createElement('button');close.type='button';close.className='sb-example-zoom-close';close.textContent='×';
    const lang=document.getElementById('siteLangSelect').value;close.setAttribute('aria-label',lang==='PL'?'Zamknij':(SB_PAGE_I18N[lang]?.['Zamknij']||'Close'));
    close.addEventListener('click',()=>dialog.close());dialog.appendChild(close);
    const picture=document.createElement('img');picture.src=img.src;picture.alt=img.alt;dialog.appendChild(picture);
    dialog.setAttribute('aria-label',img.alt);dialog.showModal();
  }
  document.addEventListener('click',e=>{if(e.target.matches('[data-app-example]'))open(e.target);});
  document.addEventListener('keydown',e=>{if(e.target.matches('[data-app-example]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open(e.target);}});
  document.addEventListener('change',e=>{if(e.target.id==='siteLangSelect'&&dialog?.open)dialog.close();});
})();
