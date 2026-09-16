/* LinguaReader TTS: Kokoro-82M browser engine. Uses WebGPU when available and falls back to WASM/system speech. */
(()=>{
  const MODEL='onnx-community/Kokoro-82M-ONNX';
  const VOICE={en:{female:'af_heart',male:'am_adam'},ja:{female:'jf_alpha',male:'jm_kumo'},zh:{female:'zf_xiaobei',male:'zm_yunyang'},ko:{female:'jf_alpha',male:'jm_kumo'}};
  const LANG={zh:'zh',en:'en',ja:'ja',ko:'ko'};
  let enginePromise=null,currentAudio=null,currentToken=0;
  const detect=text=>{if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text))return'ko';if(/[ぁ-んァ-ヶー]/.test(text))return'ja';if(/[\u4e00-\u9fff]/.test(text))return'zh';return'en'};
  async function load(){
    if(!enginePromise){
      enginePromise=(async()=>{
        const mod=await import('https://esm.sh/kokoro-js@1.2.1');
        const TTS=mod.KokoroTTS||mod.default?.KokoroTTS;
        if(!TTS)throw new Error('KokoroTTS unavailable');
        const webgpu=!!navigator.gpu;
        return await TTS.from_pretrained(MODEL,{dtype:webgpu?'fp16':'q8',device:webgpu?'webgpu':'wasm'});
      })().catch(e=>{enginePromise=null;throw e});
    }
    return enginePromise;
  }
  function stopAudio(){if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0}catch(e){}currentAudio=null}}
  async function speak(text,lang='auto',gender='female',onend=null){
    if(!text)return false;
    const token=++currentToken;stopAudio();
    try{
      const tts=await load();
      const l=lang==='auto'?detect(text):lang;
      const voice=(VOICE[l]||VOICE.en)[gender==='male'?'male':'female'];
      const speed=Math.max(.75,Math.min(1.5,Number(document.getElementById('speedSelect')?.value||1)*.96));
      const audio=await tts.generate(String(text),{voice,speed});
      if(token!==currentToken)throw new Error('cancelled');
      const blob=typeof audio.toBlob==='function'?audio.toBlob():new Blob([audio.audio||audio.buffer],{type:'audio/wav'});
      const url=URL.createObjectURL(blob);
      const el=new Audio(url);el.preload='auto';el.volume=1;currentAudio=el;
      el.onended=()=>{URL.revokeObjectURL(url);if(currentAudio===el)currentAudio=null;if(onend)onend()};
      await el.play();
      return true;
    }catch(e){
      console.warn('[LinguaReader] Kokoro TTS failed; browser fallback will be used.',e);
      return false;
    }
  }
  function stop(){currentToken++;stopAudio()}
  window.KokoroTTS=window.KokoroTTS||{load,speak,stop,detect,isReady:()=>!!enginePromise};
  /* Keep the old SupertonicTTS API name so neural-dialogue.js can use Kokoro without changing dialogue logic. */
  window.SupertonicTTS=window.KokoroTTS;
  const s=document.createElement('script');s.src='neural-dialogue.js';s.async=false;document.head.appendChild(s);
})();
