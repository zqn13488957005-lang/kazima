/* LinguaReader TTS fallback: keep the proven browser voice path alive while neural models load. */
(()=>{
  const LANG={zh:'zh-CN',en:'en-US',ja:'ja-JP',ko:'ko-KR'};
  const detect=t=>/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(t)?'ko':/[ぁ-んァ-ヶー]/.test(t)?'ja':/[\u4e00-\u9fff]/.test(t)?'zh':'en';
  let token=0;
  function speak(text,lang='auto',gender='female',done){
    if(!text)return false; const my=++token, l=lang==='auto'?detect(text):lang;
    const u=new SpeechSynthesisUtterance(String(text)); u.lang=LANG[l]||'en-US';
    u.rate=Math.max(.5,Math.min(1.7,Number(document.getElementById('speedSelect')?.value||1)*.94));
    u.pitch=gender==='male'?((l==='ja'||l==='ko')?.98:.95):((l==='ja'||l==='ko')?1.04:1.08);
    u.onend=()=>{if(my===token&&done)done()};
    u.onerror=()=>{if(my===token&&done)done()};
    speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
  }
  function stop(){token++;speechSynthesis.cancel()}
  window.SupertonicTTS={load:async()=>null,speak,stop,detect,isReady:()=>false};
  const s=document.createElement('script');s.src='neural-dialogue.js';s.async=false;document.head.appendChild(s);
})();
