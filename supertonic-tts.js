/* LinguaReader neural TTS: Supertonic 3 — close, clean voice profile. */
(()=>{
  const LANG={zh:'zh',en:'en',ja:'ja',ko:'ko'};
  let enginePromise=null,currentAudio=null,currentToken=0;
  const detect=text=>{if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text))return'ko';if(/[ぁ-んァ-ヶー]/.test(text))return'ja';if(/[\u4e00-\u9fff]/.test(text))return'zh';return'en'};
  async function load(){
    if(!enginePromise){
      enginePromise=(async()=>{
        const mod=await import('https://esm.sh/@supertone/supertonic-web');
        const TTS=mod.TTS||mod.default?.TTS;
        if(!TTS)throw new Error('Supertonic Web TTS module unavailable');
        return await TTS.load();
      })().catch(e=>{enginePromise=null;throw e});
    }
    return enginePromise;
  }
  function clearAudio(){if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0}catch(e){}currentAudio=null}}
  async function playResult(result,token,onend){
    const wav=result?.wav;
    if(!wav||token!==currentToken)throw new Error('No audio generated');
    let blob=wav instanceof Blob?wav:wav instanceof ArrayBuffer?new Blob([wav],{type:'audio/wav'}):wav.buffer?new Blob([wav.buffer],{type:'audio/wav'}):null;
    if(!blob)throw new Error('Unsupported Supertonic audio result');
    const url=URL.createObjectURL(blob),audio=new Audio(url);
    audio.preload='auto';audio.volume=1;currentAudio=audio;
    audio.onended=()=>{URL.revokeObjectURL(url);if(currentAudio===audio)currentAudio=null;if(onend)onend()};
    await audio.play();return audio;
  }
  async function speak(text,lang='auto',gender='female',onend=null){
    if(!text)return false;
    const token=++currentToken;clearAudio();
    try{
      const tts=await load(),l=lang==='auto'?detect(text):(LANG[lang]||lang);
      // F3/M3 have a lighter, less muffled character than the previous F2/M2 choice.
      let style=null;
      if(typeof tts.getVoiceStyle==='function')style=await tts.getVoiceStyle(gender==='male'?'M3':'F3');
      const uiSpeed=Number(document.getElementById('speedSelect')?.value||1);
      const options={lang:l,speed:Math.max(.78,Math.min(1.45,uiSpeed*.90)),total_steps:12,steps:12,numInferenceSteps:12,denoiseSteps:12};
      if(style)options.style=style;
      const result=await tts.synthesize(String(text),options);
      await playResult(result,token,onend);return true;
    }catch(e){console.warn('[LinguaReader] Supertonic TTS failed, fallback to browser voice:',e);return false}
  }
  function stop(){currentToken++;clearAudio()}
  window.SupertonicTTS={load,speak,stop,detect,isReady:()=>!!enginePromise};
  const s=document.createElement('script');s.src='neural-dialogue.js';s.async=false;document.head.appendChild(s);
})();
