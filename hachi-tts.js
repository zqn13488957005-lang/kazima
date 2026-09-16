/* Hachi TTS enhancement: natural, soft multilingual delivery. */
(()=>{
  const LANG={zh:'zh-CN',en:'en-US',ja:'ja-JP',ko:'ko-KR'};
  const hints={ja:['nanami','haruka','ayumi','mizuki','sayaka','tomoko','yuna','female','woman','girl'],en:['samantha','zira','susan','hazel','jenny','aria','sara','victoria','ava','emma','olivia','amy','female','woman','girl'],zh:['xiaoxiao','xiaoyi','xiaoxuan','yunxia','female','女'],ko:['heami','sunhi','female','woman','girl','여성','여자']};
  function detect(text){if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text))return'ko';if(/[ぁ-んァ-ヶー]/.test(text))return'ja';if(/[\u4e00-\u9fff]/.test(text))return'zh';return'en'}
  function pick(lang){const base=(LANG[lang]||'ja-JP').split('-')[0];const list=speechSynthesis.getVoices().filter(v=>String(v.lang||'').toLowerCase().startsWith(base));if(!list.length)return null;const hs=hints[lang]||[];return list.find(v=>hs.some(h=>v.name.toLowerCase().includes(h)))||list.find(v=>v.localService)||list[0]}
  window.HachiTTS={speak(text,lang='auto'){if(!text)return;const l=lang==='auto'?detect(text):lang;const u=new SpeechSynthesisUtterance(String(text));u.lang=LANG[l]||'ja-JP';const speed=document.getElementById('speedSelect');const base=speed?Number(speed.value):1;u.rate=Math.max(.5,Math.min(1.7,base*(l==='ja'||l==='ko'?.96:.98)));u.pitch=l==='ja'||l==='ko'?1.04:1.10;u.volume=1;const v=pick(l);if(v)u.voice=v;speechSynthesis.cancel();speechSynthesis.speak(u)},detect,pick};
})();
