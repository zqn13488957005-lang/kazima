/* Replace browser speech for dialogue reading with Supertonic 3; keep system TTS as fallback. */
(()=>{
  const fallbackLang={zh:'zh-CN',en:'en-US',ja:'ja-JP',ko:'ko-KR'};
  function baseLang(l){return String(l||'').split('-')[0]}
  function fallbackSpeak(text,lang,gender,done){
    const u=new SpeechSynthesisUtterance(convertHanja(text,lang));
    u.lang=fallbackLang[lang]||'ja-JP';
    u.rate=Number(document.getElementById('speedSelect')?.value||1)*0.94;
    u.pitch=gender==='male'?(baseLang(lang)==='ja'||baseLang(lang)==='ko'?.98:.95):(baseLang(lang)==='ja'||baseLang(lang)==='ko'?1.04:1.10);
    const voices=speechSynthesis.getVoices();
    const hints=gender==='male'?['ichiro','naoki','kenji','takumi','keita','injoon','seojun','sangho','hyunwoo','david','daniel','james','george','thomas']:['nanami','haruka','ayumi','mizuki','sayaka','tomoko','yuna','sunhi','heami','zira','samantha','susan','jenny','aria','sara','victoria','ava','emma','olivia'];
    const v=voices.find(x=>baseLang(x.lang)===baseLang(u.lang)&&hints.some(h=>String(x.name).toLowerCase().includes(h)));
    if(v)u.voice=v;
    u.onstart=()=>{document.getElementById('status').textContent=`正在朗读 ${dialogueIndex+1}/${dialogueLines.length}…`};
    u.onend=()=>{if(done)done()};
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }
  window.nextDialogue=async function(){
    if(dialogueIndex>=dialogueLines.length){
      document.getElementById('status').textContent='对话朗读完成';
      document.getElementById('dialogueProgress').textContent=`完成 · 共 ${dialogueLines.length} 句`;
      return;
    }
    const x=dialogueLines[dialogueIndex];
    const l=document.getElementById('dialogueAutoLang')?.checked?detectLang(x.text):(document.getElementById('langSelect').value==='auto'?detectLang(x.text):document.getElementById('langSelect').value);
    const gender=x.gender;
    document.getElementById('dialogueProgress').textContent=`${dialogueIndex+1}/${dialogueLines.length} · ${gender==='male'?'👨 男声':'👩 女声'} · ${fallbackLang[l]||l} · Supertonic 3`;
    const finish=()=>{dialogueIndex++;dialogueTimer=setTimeout(()=>window.nextDialogue(),180)};
    if(window.SupertonicTTS){
      const ok=await window.SupertonicTTS.speak(convertHanja(x.text,l),l,gender,finish);
      if(ok){document.getElementById('status').textContent=`正在使用神经网络声音 ${dialogueIndex+1}/${dialogueLines.length}…`;return;}
    }
    fallbackSpeak(x.text,l,gender,finish);
  };
})();
