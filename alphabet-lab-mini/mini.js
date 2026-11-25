'use strict';
// Hardware-decoded video only. No live simulations or source bundles are loaded.
const sequence=[{species:'bacteria',type:'A',file:'bacteriaA'},{species:'bacteria',type:'B',file:'bacteriaB'},{species:'bacteria',type:'C',file:'bacteriaC'},{species:'protozoa',file:'protozoa',revision:'collection-motion-v2'},{species:'amoeba',file:'amoeba',revision:'s07-collection-v2'},{species:'fungi',file:'fungi'}];
const PLAYBACK_RATE=1.25;
const palettes={bacteria:'#72a6bc',protozoa:'#d28fa0',amoeba:'#c3c6c7',fungi:'#a5b89a'};
const status=document.querySelector('#live-status'),startButton=document.querySelector('#start-playback');
const slots=[document.querySelector('#video-a'),document.querySelector('#video-b')];
let active=null,selection=0,requested=0,loadSerial=0,warmTimer=0;
for(const video of slots){video.muted=true;video.defaultMuted=true;video.playsInline=true;video.defaultPlaybackRate=PLAYBACK_RATE;video.playbackRate=PLAYBACK_RATE;video.dataset.index='';}
function controls(index){
 const item=sequence[index];document.documentElement.style.setProperty('--ink',palettes[item.species]);
 for(const b of document.querySelectorAll('[data-species]'))b.setAttribute('aria-pressed',String(b.dataset.species===item.species));
 for(const b of document.querySelectorAll('[data-bacteria-type]'))b.setAttribute('aria-pressed',String(b.dataset.bacteriaType===item.type));
 document.querySelector('#bacteria-types').hidden=item.species!=='bacteria';
 document.querySelector('#specimen-name').textContent=item.species.toUpperCase()+(item.type?' / TYPE '+item.type:'');
 document.querySelector('#video-stage').setAttribute('aria-label',item.species+' complete animated alphabet, A to Z');
}
function load(video,index,onReady){
 video._cancel?.();const controller=new AbortController();video._cancel=()=>controller.abort();
 const serial=++loadSerial;video._serial=serial;
 const done=()=>{if(video._serial===serial)onReady?.();};
 video.addEventListener('loadeddata',done,{once:true,signal:controller.signal});
 video.addEventListener('error',()=>{if(requested===index)status.textContent='VIDEO UNAVAILABLE / TOUCH TO RETRY';},{once:true,signal:controller.signal});
 if(video.dataset.index===String(index)&&video.readyState>=2){done();return;}
 video.pause();video.dataset.index=String(index);video.poster='alphabet-lab-mini/videos/'+sequence[index].file+'-preview.png'+(sequence[index].revision?'?v='+sequence[index].revision:'');
 video.src='alphabet-lab-mini/videos/'+sequence[index].file+'.mp4'+(sequence[index].revision?'?v='+sequence[index].revision:'');video.load();
}
function warmNext(){
 clearTimeout(warmTimer);warmTimer=setTimeout(()=>{
  if(!active||requested!==selection)return;
  load(slots.find(v=>v!==active),(selection+1)%sequence.length);
 },300);
}
async function play(video){
 video.defaultPlaybackRate=PLAYBACK_RATE;video.playbackRate=PLAYBACK_RATE;
 try{await video.play();if(video===active){startButton.hidden=true;status.textContent='A–Z / AUTO LOOP';}}
 catch(error){if(video===active){startButton.hidden=false;status.textContent='TOUCH TO START';}}
}
function activate(video,index){
 if(requested!==index)return;
 const previous=active;selection=index;active=video;
 if(previous&&previous!==video){previous.pause();previous.classList.remove('visible');}
 video.currentTime=0;video.classList.add('visible');controls(index);play(video);warmNext();
 window.miniState={mode:'video',playbackRate:PLAYBACK_RATE,selection,index,rows:['ABCDE','FGHIJ','KLMNO','PQRS','TUVW','XYZ'],loadedVideos:slots.filter(v=>v.getAttribute('src')).length};
}
function select(index){
 requested=index;clearTimeout(warmTimer);controls(index);
 if(active&&selection===index){active.currentTime=0;play(active);warmNext();return;}
 status.textContent='LOADING VIDEO';
 const target=slots.find(v=>v!==active)||slots[0];load(target,index,()=>activate(target,index));
}
for(const video of slots){
 video.addEventListener('ended',()=>{if(video===active&&requested===selection)select((selection+1)%sequence.length);});
 video.addEventListener('timeupdate',()=>{if(video===active)document.querySelector('#progress').style.transform=`scaleX(${video.duration?video.currentTime/video.duration:0})`;});
 video.addEventListener('waiting',()=>{if(video===active)status.textContent='BUFFERING';});
 video.addEventListener('playing',()=>{if(video===active)status.textContent='A–Z / AUTO LOOP';});
}
for(const b of document.querySelectorAll('[data-species]'))b.onclick=()=>select(sequence.findIndex(s=>s.species===b.dataset.species));
for(const b of document.querySelectorAll('[data-bacteria-type]'))b.onclick=()=>select(sequence.findIndex(s=>s.species==='bacteria'&&s.type===b.dataset.bacteriaType));
startButton.onclick=()=>{if(active)play(active);else select(requested);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)active?.pause();else if(active)play(active);});
addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f')document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();});
select(0);
