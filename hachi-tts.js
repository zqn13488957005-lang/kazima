/* Hachi-only TTS: Kokoro runs only for Hachi. Webpage reader/dialogue TTS is untouched. */
(()=> {
  const LANG={zh:'zh-CN',en:'en-US',ja:'ja-JP',ko:'ko-KR'};
  const HACHI_VOICES={ja:'jf_alpha',en:'af_heart',zh:'zf_xiaoxiao'};
  let kokoroPromise=null, currentAudio=null;
  function detect(t){if(/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(t))return'ko';if(/[ぁ-んァ-ヶー]/.test(t))return'ja';if(/[\u4e00-\u9fff]/.test(t))return'zh';return'en'}
  async function loadKokoro(){
    if(!kokoroPromise) kokoroPromise=(async()=>{
      const {KokoroTTS}=await import('https://esm.sh/kokoro-js@1.2.4');
      return KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{
        dtype:'q8',
        device:navigator.gpu?'webgpu':'wasm',
        progress_callback:e=>window.dispatchEvent(new CustomEvent('hachi-tts-progress',{detail:e}))
      });
    })();
    return kokoroPromise;
  }
  async function speak(text,lang='auto'){
    if(!text)return;
    const l=lang==='auto'?detect(text):lang;
    window.speechSynthesis?.cancel();
    if(currentAudio){currentAudio.pause();currentAudio.src='';currentAudio=null}
    try{
      const tts=await loadKokoro();
      const voice=HACHI_VOICES[l]||HACHI_VOICES.ja;
      const audio=await tts.generate(String(text),{voice,speed:l==='ja'||l==='ko'?0.94:0.97});
      const blob=await audio.toBlob();
      const url=URL.createObjectURL(blob);
      currentAudio=new Audio(url);
      currentAudio.volume=1;
      currentAudio.onplay=()=>window.dispatchEvent(new CustomEvent('hachi-tts-start',{detail:{voice,lang:l,engine:'Kokoro'}}));
      currentAudio.onended=()=>{URL.revokeObjectURL(url);window.dispatchEvent(new CustomEvent('hachi-tts-end'))};
      currentAudio.onerror=e=>window.dispatchEvent(new CustomEvent('hachi-tts-error',{detail:e}));
      await currentAudio.play();
      return {lang:l,voice,engine:'Kokoro'};
    }catch(err){
      console.warn('Hachi Kokoro unavailable; using browser fallback.',err);
      const u=new SpeechSynthesisUtterance(String(text));u.lang=LANG[l]||LANG.ja;u.rate=l==='ja'||l==='ko'?0.94:0.97;u.pitch=l==='ja'||l==='ko'?1.02:1.04;u.volume=1;
      speechSynthesis.speak(u);
      return {lang:l,voice:null,engine:'browser-fallback'};
    }
  }
  function stop(){if(currentAudio){currentAudio.pause();currentAudio=null}speechSynthesis?.cancel()}
  window.HachiTTS={speak,stop,detect,loadKokoro,voices:HACHI_VOICES};
})();