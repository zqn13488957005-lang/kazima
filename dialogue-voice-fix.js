/* LinguaReader dialogue voice fix: natural Japanese/Korean delivery with stable male/female distinction. */
(()=>{
  const synth=window.speechSynthesis;
  const originalSpeak=synth&&synth.speak&&synth.speak.bind(synth);
  if(!originalSpeak||window.__linguaDialogueVoiceFix)return;
  window.__linguaDialogueVoiceFix=true;
  const femaleHints={ja:['nanami','haruka','ayumi','mizuki','sayaka','tomoko','yuna','female','woman','girl'],ko:['sunhi','heami','female','woman','girl','여성','여자'],zh:['xiaoxiao','xiaoyi','xiaoxuan','yunxia','female','女'],en:['zira','samantha','susan','kate','hazel','jenny','aria','sara','victoria','ava','emma','olivia','amy','female','woman','girl']};
  const maleHints={ja:['ichiro','naoki','kenji','takumi','keita','otoya','male','man','boy'],ko:['injoon','seojun','sangho','hyunwoo','male','man','boy'],zh:['yunxi','yunyang','kangkang','male','男'],en:['david','daniel','james','george','thomas','ryan','aaron','fred','mark','kevin','matthew','richard','male','man','boy']};
  const base=l=>String(l||'').toLowerCase().split('-')[0];
  const gender=v=>{const n=String(v?.name||'').toLowerCase();for(const k of ['ja','ko','zh','en']){if((femaleHints[k]||[]).some(x=>n.includes(x)))return'female';if((maleHints[k]||[]).some(x=>n.includes(x)))return'male'}return null};
  function choose(lang,wanted,current){
    const b=base(lang),all=synth.getVoices().filter(v=>base(v.lang)===b);
    if(!all.length)return current||null;
    const exact=all.find(v=>gender(v)===wanted);
    if(exact)return exact;
    const local=all.filter(v=>v.localService);
    return current||local[0]||all[0];
  }
  synth.speak=function(u){
    try{
      const p=document.getElementById('dialogueProgress'),t=p?.textContent||'';
      const active=/👩|女声/.test(t)?'female':/👨|男声/.test(t)?'male':null;
      const b=base(u?.lang);
      if(u&&active){
        const v=choose(u.lang,active,u.voice);if(v)u.voice=v;
        if(b==='ja'||b==='ko'){
          // Keep native-language voices close to normal human speech instead of anime-like pitch.
          u.pitch=active==='female'?1.04:0.98;
          u.rate=Math.max(.5,Math.min(1.7,(Number(u.rate)||1)*0.94));
          u.volume=1;
        }else{
          u.pitch=active==='female'?1.10:0.95;
          u.volume=.98;
        }
      }
    }catch(e){}
    return originalSpeak(u);
  };
})();
