/* LinguaReader dialogue voice fix: force distinct male/female delivery even when the browser exposes weak gender metadata. */
(()=>{
  const originalSpeak=window.speechSynthesis&&window.speechSynthesis.speak.bind(window.speechSynthesis);
  if(!originalSpeak||window.__linguaDialogueVoiceFix)return;
  window.__linguaDialogueVoiceFix=true;
  const femaleHints={zh:['xiaoxiao','xiaoyi','xiaoxuan','yunxia','xiaomo','女','female','woman','girl'],en:['zira','samantha','susan','kate','hazel','jenny','aria','sara','victoria','ava','emma','olivia','amy','libby','sonia','female','woman','girl'],ja:['nanami','haruka','ayumi','mizuki','sayaka','tomoko','yuna','female','woman','girl'],ko:['sunhi','heami','female','woman','girl','여성','여자']};
  const maleHints={zh:['yunxi','yunyang','kangkang','male','man','boy'],en:['david','daniel','james','george','thomas','ryan','aaron','fred','mark','kevin','matthew','richard','male','man','boy'],ja:['ichiro','naoki','kenji','takumi','keita','otoya','male','man','boy'],ko:['injoon','seojun','sangho','hyunwoo','male','man','boy']};
  const base=l=>String(l||'').toLowerCase().split('-')[0];
  const gender=v=>{const n=String(v?.name||'').toLowerCase();for(const k of ['zh','en','ja','ko']){if(femaleHints[k].some(x=>n.includes(x)))return'female';if(maleHints[k].some(x=>n.includes(x)))return'male'}return null};
  function choose(lang,wanted,current){
    const all=speechSynthesis.getVoices().filter(v=>base(v.lang)===base(lang));
    if(!all.length)return null;
    const exact=all.find(v=>gender(v)===wanted);
    if(exact)return exact;
    const other=all.filter(v=>v!==current);
    return other[0]||all[0];
  }
  window.speechSynthesis.speak=function(u){
    try{
      const p=document.getElementById('dialogueProgress');
      const t=p?.textContent||'';
      const active=/👩|女声/.test(t)?'female':/👨|男声/.test(t)?'male':null;
      if(active&&u&&u.lang){
        const v=choose(u.lang,active,u.voice);
        if(v)u.voice=v;
        // Browser voices often have no gender metadata; pitch makes the fallback distinction audible.
        u.pitch=active==='female'?1.18:0.92;
        u.volume=.96;
      }
    }catch(e){}
    return originalSpeak(u);
  };
})();
