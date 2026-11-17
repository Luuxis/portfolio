/**
 * Le peu de JavaScript de l'admin, sans dépendance. Tout marche sans lui sauf
 * l'ajout et le tri des lignes répétées.
 *
 * - `form[data-confirm]` : demande confirmation avant l'envoi.
 * - `select[data-autosubmit]` : poste le formulaire au changement.
 * - `[data-repeater]` : liste de blocs (lignes de facture, expériences…). Les
 *   champs portent `data-name="lines.$.title"` ; `$` devient l'indice du bloc
 *   à chaque ajout, suppression ou déplacement. Boutons `data-add`,
 *   `data-remove`, `data-up`, `data-down`, modèle dans `<template>`.
 * - `[data-doc-editor]` : totaux recalculés pendant la saisie.
 * - `input[data-photo]` : photo réduite à 320 px dans le navigateur, rangée
 *   en data URL dans le champ caché désigné par `data-photo`.
 * - `[data-cv-frame]` : signale un CV qui dépasse la page A4.
 */
export const adminScript = `(function(){
var root=document.documentElement;
document.querySelectorAll('[data-theme-toggle]').forEach(function(b){b.addEventListener('click',function(){var next=root.classList.contains('dark')?'light':'dark';root.classList.remove('dark','light');root.classList.add(next);try{localStorage.setItem('theme',next)}catch(e){}})});

document.addEventListener('submit',function(e){var f=e.target;var msg=f.getAttribute('data-confirm');var sub=e.submitter;if(sub&&sub.getAttribute('data-confirm'))msg=sub.getAttribute('data-confirm');if(msg&&!window.confirm(msg)){e.preventDefault();return}if(sub&&!sub.hasAttribute('formtarget')&&!f.hasAttribute('target')){setTimeout(function(){sub.setAttribute('aria-disabled','true')},0)}},true);
document.querySelectorAll('input[data-check-all]').forEach(function(all){var name=all.getAttribute('data-check-all');var boxes=function(){return all.form?all.form.querySelectorAll('input[name="'+name+'"]'):[]};all.addEventListener('change',function(){boxes().forEach(function(b){b.checked=all.checked})});all.form&&all.form.addEventListener('change',function(e){if(e.target===all)return;var list=boxes();var n=0;list.forEach(function(b){if(b.checked)n++});all.checked=n>0&&n===list.length;all.indeterminate=n>0&&n<list.length})});
document.querySelectorAll('select[data-autosubmit]').forEach(function(s){s.addEventListener('change',function(){s.form&&s.form.submit()})});

function renumber(rep){var items=rep.querySelectorAll(':scope > [data-items] > [data-item]');items.forEach(function(item,i){item.querySelectorAll('[data-name]').forEach(function(el){el.name=el.getAttribute('data-name').replace('$',String(i))});var n=item.querySelector('[data-index]');if(n)n.textContent=String(i+1)});var empty=rep.querySelector(':scope > [data-empty]');if(empty)empty.hidden=items.length>0;rep.dispatchEvent(new Event('input',{bubbles:true}))}
document.querySelectorAll('[data-repeater]').forEach(function(rep){
  var list=rep.querySelector(':scope > [data-items]');var tpl=rep.querySelector(':scope > template');
  rep.addEventListener('click',function(e){var t=e.target.closest('button');if(!t||!rep.contains(t))return;
    var item=t.closest('[data-item]');
    if(t.hasAttribute('data-add')&&t.closest('[data-repeater]')===rep){var node=tpl.content.firstElementChild.cloneNode(true);list.appendChild(node);renumber(rep);var first=node.querySelector('input,textarea,select');if(first)first.focus();return}
    if(!item||item.parentElement!==list)return;
    if(t.hasAttribute('data-remove')){item.remove();renumber(rep)}
    else if(t.hasAttribute('data-up')&&item.previousElementSibling){list.insertBefore(item,item.previousElementSibling);renumber(rep);t.focus()}
    else if(t.hasAttribute('data-down')&&item.nextElementSibling){list.insertBefore(item.nextElementSibling,item);renumber(rep);t.focus()}
  });
  renumber(rep);
});

function amount(v){v=String(v||'').replace(/[\\s\\u00a0\\u202f€]/g,'').replace(',','.');var n=Number(v);return isFinite(n)?n:0}
var euro=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
document.querySelectorAll('[data-doc-editor]').forEach(function(ed){
  function update(){var ht=0;ed.querySelectorAll('[data-line]').forEach(function(line){var q=amount((line.querySelector('[data-qty]')||{}).value);var p=Math.round(amount((line.querySelector('[data-price]')||{}).value)*100);var t=Math.round(q*p);ht+=t;var out=line.querySelector('[data-line-total]');if(out)out.textContent=euro.format(t/100)});
    var rateEl=ed.querySelector('[data-vat]');var rate=rateEl&&rateEl.value.trim()!==''?amount(rateEl.value):0;var vat=Math.round(ht*rate/100);
    var set=function(k,v){var el=ed.querySelector('[data-total="'+k+'"]');if(el)el.textContent=euro.format(v/100)};set('ht',ht);set('vat',vat);set('ttc',ht+vat);
    var vr=ed.querySelector('[data-vat-row]');if(vr)vr.hidden=!(rate>0)}
  ed.addEventListener('input',update);update();
});

document.querySelectorAll('input[data-photo]').forEach(function(input){input.addEventListener('change',function(){var file=input.files&&input.files[0];if(!file)return;var img=new Image();var url=URL.createObjectURL(file);img.onload=function(){var size=320;var c=document.createElement('canvas');c.width=size;c.height=size;var s=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,size,size);var data=c.toDataURL('image/jpeg',.86);var target=document.getElementById(input.getAttribute('data-photo'));if(target)target.value=data;var prev=document.getElementById(input.getAttribute('data-photo')+'-preview');if(prev)prev.src=data;URL.revokeObjectURL(url)};img.src=url})});

document.querySelectorAll('[data-cv-frame]').forEach(function(frame){var warn=document.getElementById(frame.getAttribute('data-cv-frame'));function check(){try{var doc=frame.contentDocument;var sheet=doc&&doc.querySelector('.sheet');if(!sheet||!warn)return;var over=sheet.scrollHeight-sheet.clientHeight;warn.hidden=over<=1;var px=warn.querySelector('[data-over]');if(px)px.textContent=String(Math.ceil(over))}catch(e){}}frame.addEventListener('load',check)});
})();`
