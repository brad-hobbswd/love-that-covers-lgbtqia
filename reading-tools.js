(function(){
  function initReadingTools(){
    const article=document.querySelector('article.chapter-card, article.card, article.dedication-inner');
    if(!article || document.querySelector('.reading-listen-tools')) return;
    const supported=('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
    const toolbar=document.createElement('section');
    toolbar.className='reading-listen-tools';
    toolbar.setAttribute('aria-label','Reading and listening options');
    toolbar.innerHTML='<div class="reading-tools-copy"><strong>Listen to this reading</strong><span>On iPhone or iPad, open Safari’s page menu and choose “Listen to Page.” Choose “Show Reader” for a cleaner reading view. You can also select text and use Speak Selection in Accessibility settings. Other browsers may offer their own read-aloud options.</span></div><div class="reading-tools-actions"><button type="button" class="listen-play">▶ Listen</button><button type="button" class="listen-pause" disabled>Ⅱ Pause</button><button type="button" class="listen-stop" disabled>■ Stop</button></div><p class="reading-listen-status" role="status" aria-live="polite"></p>';
    article.parentNode.insertBefore(toolbar,article);
    const play=toolbar.querySelector('.listen-play');
    const pause=toolbar.querySelector('.listen-pause');
    const stop=toolbar.querySelector('.listen-stop');
    const status=toolbar.querySelector('.reading-listen-status');
    if(!supported){
      play.disabled=true;pause.disabled=true;stop.disabled=true;
      status.textContent='This browser does not support the built-in listen button. Use your device’s accessibility read-aloud settings instead.';
      return;
    }
    const synth=window.speechSynthesis;
    let utterances=[],finished=0,stopped=false,paused=false;
    function announce(message){status.textContent=message;}
    function controls(state){
      play.disabled=state==='playing'||state==='paused';
      pause.disabled=state==='idle';
      pause.textContent=state==='paused'?'▶ Resume':'Ⅱ Pause';
      stop.disabled=state==='idle';
    }
    function splitForSpeech(value){
      const clean=value.replace(/\s+/g,' ').trim();
      const sentences=clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[clean];
      const pieces=[];let current='';
      sentences.forEach(sentence=>{
        let part=sentence.trim();
        while(part.length>650){
          const cut=part.lastIndexOf(' ',650);
          const point=cut>250?cut:650;
          pieces.push(part.slice(0,point).trim());
          part=part.slice(point).trim();
        }
        if(!part)return;
        if((current+' '+part).trim().length>650&&current){pieces.push(current);current=part;}
        else current=(current+' '+part).trim();
      });
      if(current)pieces.push(current);
      return pieces.filter(Boolean);
    }
    function startReading(){
      const text=article.innerText||article.textContent||'';
      utterances=splitForSpeech(text).map(part=>new SpeechSynthesisUtterance(part));
      if(!utterances.length){announce('There is no reading text available on this page.');return;}
      finished=0;stopped=false;paused=false;
      utterances.forEach((utterance)=>{
        utterance.rate=0.95;
        utterance.onend=function(){
          if(stopped)return;
          finished++;
          if(finished>=utterances.length){
            controls('idle');announce('Reading finished. You can listen again whenever you are ready.');
          }
        };
        utterance.onerror=function(event){
          if(stopped||event.error==='canceled'||event.error==='interrupted')return;
          stopped=true;synth.cancel();controls('idle');
          announce('Your iPhone stopped the reading. Tap Listen to start again.');
        };
      });
      controls('playing');
      announce('Reading aloud. You can pause or stop at any time.');
      // iOS Safari is more reliable when every short passage is queued
      // directly during the original tap, rather than chained after onend.
      synth.cancel();
      synth.resume();
      utterances.forEach(utterance=>synth.speak(utterance));
    }
    play.addEventListener('click',function(){
      if(paused){synth.resume();paused=false;controls('playing');announce('Resuming your reading.');return;}
      startReading();
    });
    pause.addEventListener('click',function(){
      if(paused){synth.resume();paused=false;controls('playing');announce('Resuming your reading.');}
      else if(synth.speaking){synth.pause();paused=true;controls('paused');announce('Reading paused.');}
    });
    stop.addEventListener('click',function(){
      stopped=true;paused=false;synth.cancel();utterances=[];controls('idle');announce('Reading stopped.');
    });
    window.addEventListener('pagehide',function(){stopped=true;synth.cancel();});
    controls('idle');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initReadingTools);
  else initReadingTools();
})();