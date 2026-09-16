/* LinguaReader neural TTS: Supertonic 3 browser engine, tuned for clearer/closer speech. */
(()=>{
  const LANG={zh:'zh',en:'en',ja:'ja',ko:'ko'};
  let enginePromise=null;
  let currentAudio=null;
  let currentToken=0;
  let audioCtx=null;
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
  function clearAudio(){
    if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0}catch(e){}currentAudio=null}
  }
  function polish(audio){
    try{
      if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
      const source=audioCtx.createMediaElementSource(audio);
      const high=audioCtx.createBiquadFilter();
      high.type='highshelf'; high.frequency.value=2800; high.gain.value=2.2;
      const presence=audioCtx.createBiquadFilter();
      presence.type='peaking'; presence.frequency.value=3900; presence.Q.value=.75; presence.gain.value=1.1;
      const low=audioCtx.createBiquadFilter();
      low.type='highpass'; low.frequency.value=65; low.Q.value=.55;
      const comp=audioCtx.createDynamicsCompressor();
      comp.threshold.value=-18; comp.knee.value=18; comp.ratio.value=2.2; comp.attack.value=.004; comp.release.value=.12;
      source.connect(low); low.connect(high); high.connect(presence); presence.connect(comp); comp.connect(audioCtx.destination);
    }catch(e){console.debug('[LinguaReader] audio polish unavailable',e)}
  }
  async function playResult(result,token,onend){
    const wav=result?.wav;
    if(!wav||token!==currentToken)throw new Error('No audio generated');
    let blob;
    if(wav instanceof Blob)blob=wav;
    else if(wav instanceof ArrayBuffer)blob=new Blob([wav],{type:'audio/wav'});
    else if(wav.buffer)blob=new Blob([wav.buffer],{type:'audio/wav'});
    else throw new Error('Unsupported Supertonic audio result');
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);
    audio.preload='auto';
    audio.volume=1;
    currentAudio=audio;
    polish(audio);
    audio.onended=()=>{URL.revokeObjectURL(url);if(currentAudio===audio)currentAudio=null;if(typeof onend==='function')onend()};
    await audio.play();
    return audio;
  }
  async function speak(text,lang='auto',gender='female',onend=null){
    if(!text)return false;
    const token=++currentToken;
    clearAudio();
    try{
      const tts=await load();
      const l=lang==='auto'?detect(text):(LANG[lang]||lang);
      let style=null;
      if(typeof tts.getVoiceStyle==='function')style=await tts.getVoiceStyle(gender==='male'?'M2':'F2');
      const baseSpeed=Number(document.getElementById('speedSelect')?.value||1);
      const options={lang:l,speed:Math.max(.82,Math.min(1.55,baseSpeed*.94)),steps:16,numInferenceSteps:16,denoiseSteps:16};
      if(style)options.style=style;
      const result=await tts.synthesize(String(text),options);
      await playResult(result,token,onend);
      return true;
    }catch(e){
      console.warn('[LinguaReader] Supertonic TTS failed, fallback to browser voice:',e);
      return false;
    }
  }
  function stop(){currentToken++;clearAudio()}
  window.SupertonicTTS={load,speak,stop,detect,isReady:()=>!!enginePromise};
  const s=document.createElement('script');s.src='neural-dialogue.js';s.async=false;document.head.appendChild(s);
})();
