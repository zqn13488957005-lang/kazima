/* Hachi-only TTS. Completely separated from the webpage reader/dialogue TTS. */
(()=> {
  const LANG={zh:'zh-CN',en:'en-US',ja:'ja-JP',ko:'ko-KR'};
  const PREF={
    ja:['Microsoft Nanami Online (Natural) - Japanese (Japan)','Microsoft Nanami - Japanese (Japan)','Nanami','Kyoko','O-Ren','Otoya'],
    ko:['Microsoft SunHi Online (Natural) - Korean (Korea)','Microsoft SunHi - Korean (Korea)','SunHi','Heami'],
    zh:['Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)','Microsoft Xiaoxiao - Chinese (Simplified)','Xiaoxiao','XiaoXiao'],
    en:['Microsoft Jenny Online (Natural) - English (United States)','Microsoft Jenny - English (United States)','Jenny','Samantha','Aria']
  };
  function detect(t){if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(t))return'ko';if(/[ぁ-んァ-ヶー]/.test(t))return'ja';if(/[\u4e00-\u9fff]/.test(t))return'zh';return'en'}
  function pick(lang){
    const list=speechSynthesis.getVoices(),base=(LANG[lang]||LANG.ja).split('-')[0],prefs=PREF[lang]||PREF.ja;
    for(const p of prefs){const v=list.find(x=>x.name.toLowerCase()===p.toLowerCase()&&x.lang.toLowerCase().startsWith(base));if(v)return v}
    for(const p of prefs){const v=list.find(x=>x.name.toLowerCase().includes(p.toLowerCase())&&x.lang.toLowerCase().startsWith(base));if(v)return v}
    return list.find(x=>x.lang.toLowerCase().startsWith(base))||null;
  }
  function speak(text,lang='auto'){
    if(!text)return;
    const l=lang==='auto'?detect(text):lang,u=new SpeechSynthesisUtterance(String(text));
    u.lang=LANG[l]||LANG.ja;u.rate=l==='ja'||l==='ko'?0.94:0.97;u.pitch=l==='ja'||l==='ko'?1.02:1.04;u.volume=1;
    const v=pick(l);if(v)u.voice=v;
    u.onstart=()=>window.dispatchEvent(new CustomEvent('hachi-tts-start',{detail:{voice:v?.name||'system',lang:l}}));
    u.onend=()=>window.dispatchEvent(new CustomEvent('hachi-tts-end'));
    u.onerror=e=>window.dispatchEvent(new CustomEvent('hachi-tts-error',{detail:e.error}));
    speechSynthesis.cancel();speechSynthesis.speak(u);return{lang:l,voice:v?.name||null};
  }
  window.HachiTTS={speak,detect,pick,voices:()=>speechSynthesis.getVoices().slice(),preferences:PREF};
})();