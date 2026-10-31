(function(){
  function initReadingTools(){
    const article=document.querySelector('article.chapter-card, article.card, article.dedication-inner');
    if(!article || document.querySelector('.reading-listen-tools')) return;
    const supported=('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
    const toolbar=document.createElement('section');
    toolbar.className='reading-listen-tools';
    toolbar.setAttribute('aria-label','Reading and listening options');
    toolbar.innerHTML='<div class="reading-tools-copy"><strong>Listen to this reading</strong><span>Listen while you go about your day, or select a passage and use your device’s own read-aloud feature where available.</span></div><div class="reading-tools-actions"><button type="button" class="listen-play">▶ Listen</button><button type="button" class="listen-pause" disabled>Ⅱ Pause</button><button type="button" class="listen-stop" disabled>■ Stop</button></div><p class="reading-listen-status" role="status" aria-live="polite"></p>';
    article.parentNode.insertBefore(toolbar,article);
    const play=toolbar.querySelector('.listen-play');
    const pause=toolbar.querySelector('.listen-pause');
    const stop=toolbar.querySelector('.listen-stop');
    const status=toolbar.querySelector('.reading-listen-status');
    if(!supported){
      play.disabled=true;pause.disabled=true;stop.disabled=true;
      status.textContent='Read-aloud is not supported by this browser. You can still use your device’s accessibility or screen-reading tools.';
      return;
    }
    let chunks=[],index=0,active=false;
    function setStatus(message){status.textContent=message;}
    function setButtons(state){
      play.disabled=state==='playing'||state==='paused';
      pause.disabled=state!=='playing';
      pause.textContent=state==='paused'?'▶ Resume':'Ⅱ Pause';
      if(state==='paused') pause.disabled=false;
      stop.disabled=state==='idle';
    }
    function makeChunks(text){
      const sentences=text.replace(/\s+/g,' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];
      const result=[];let part='';
      sentences.forEach(sentence=>{
        const next=(part+' '+sentence).trim();
        if(next.length>220 && part){result.push(part);part=sentence.trim();}
        else part=next;
      });
      if(part) result.push(part);
      return result;
    }
    function speakNext(){
      if(!active||index>=chunks.length){
        active=false;setButtons('idle');setStatus('Reading finished. You can listen again whenever you are ready.');return;
      }
      const utterance=new SpeechSynthesisUtterance(chunks[index]);
      utterance.onend=function(){index++;speakNext();};
      utterance.onerror=function(event){
        if(event.error==='canceled'||event.error==='interrupted') return;
        active=false;setButtons('idle');setStatus('The device could not continue reading. Please try again.');
      };
      window.speechSynthesis.speak(utterance);
    }
    play.addEventListener('click',function(){
      if(window.speechSynthesis.paused){
        window.speechSynthesis.resume();active=true;setButtons('playing');setStatus('Resuming your reading.');return;
      }
      window.speechSynthesis.cancel();
      const text=article.innerText||article.textContent||'';
      chunks=makeChunks(text);index=0;active=true;
      setButtons('playing');setStatus('Reading aloud. You can pause or stop at any time.');
      speakNext();
    });
    pause.addEventListener('click',function(){
      if(window.speechSynthesis.paused){window.speechSynthesis.resume();setButtons('playing');setStatus('Resuming your reading.');}
      else if(window.speechSynthesis.speaking){window.speechSynthesis.pause();setButtons('paused');setStatus('Reading paused.');}
    });
    stop.addEventListener('click',function(){
      active=false;window.speechSynthesis.cancel();index=0;setButtons('idle');setStatus('Reading stopped.');
    });
    window.addEventListener('pagehide',function(){window.speechSynthesis.cancel();});
    setButtons('idle');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initReadingTools);
  else initReadingTools();
})();