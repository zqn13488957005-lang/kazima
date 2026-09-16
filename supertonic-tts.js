/* LinguaReader neural TTS: Supertonic 3 browser engine. */
(()=>{
  const LANG={zh:'zh',en:'en',ja:'ja',ko:'ko'};
  let enginePromise=null;
  let currentAudio=null;
  let currentToken=0;
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
  async function playResult(result,token){
    const wav=result?.wav;
    if(!wav||token!==currentToken)throw new Error('No audio generated');
    let blob;
    if(wav instanceof Blob)blob=wav;
    else if(wav instanceof ArrayBuffer)blob=new Blob([wav],{type:'audio/wav'});
    else if(wav.buffer)blob=new Blob([wav.buffer],{type:'audio/wav'});
    else throw new Error('Unsupported Supertonic audio result');
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);
    currentAudio=audio;
    audio.onended=()=>{URL.revokeObjectURL(url);if(currentAudio===audio)currentAudio=null};
    await audio.play();
    return audio;
  }
  async function speak(text,lang='auto',gender='female'){
    if(!text)return false;
    const token=++currentToken;
    if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0}catch(e){}currentAudio=null}
    try{
      const tts=await load();
      const l=lang==='auto'?detect(text):(LANG[lang]||lang);
      let style=null;
      if(typeof tts.getVoiceStyle==='function')style=await tts.getVoiceStyle(gender==='male'?'M1':'F1');
      const options={lang:l,speed:Math.max(.7,Math.min(1.8,Number(document.getElementById('speedSelect')?.value||1)))};
      if(style)options.style=style;
      const result=await tts.synthesize(String(text),options);
      await playResult(result,token);
      return true;
    }catch(e){
      console.warn('[LinguaReader] Supertonic TTS failed, fallback to browser voice:',e);
      return false;
    }
  }
  function stop(){currentToken++;if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0}catch(e){}currentAudio=null}}
  window.SupertonicTTS={load,speak,stop,detect,isReady:()=>!!enginePromise};
})();
