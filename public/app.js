const el=id=>document.getElementById(id);
const status=msg=>el('status').textContent=msg;
let notes=[],current,recorder,timer,clip,hasAI=false;
async function api(url,options){
 const response=await fetch('/api/'+url,options);
 const data=await response.json();
 if(!response.ok)throw Error(data.error);
 return data;
}
function mode(text){
 el('composer').hidden=!text;el('studio').hidden=text;
 el('voice').classList.toggle('active',!text);el('type').classList.toggle('active',text);
 if(text)el('draft').focus();
}
el('type').onclick=()=>mode(true);el('voice').onclick=()=>mode(false);
for(let i=0;i<128;i++){
 const bar=document.createElement('i');const x=i/127;
 bar.style.height=(3+Math.pow(Math.sin(Math.PI*x),1.3)*(24+16*Math.cos(x*38))*(0.2+Math.abs(Math.sin(i*2.13))*1.55))+'px';
 bar.style.animationDelay=(-i*.07)+'s';el('wave').append(bar);
}
function render(){
 const list=el('list');list.replaceChildren();el('count').textContent=notes.length;
 const q=el('query').value.toLowerCase().trim();
 for(const n of notes.filter(n=>[n.title,n.body,n.transcript].some(v=>v.toLowerCase().includes(q)))){
 const row=document.createElement('button');row.className='row';
 for(const [tag,value] of [['time',new Date(n.created).toLocaleString()],['strong',n.title],['span',n.body.replace(/^#+.*$/gm,'').trim().slice(0,110)]]){
 const child=document.createElement(tag);child.textContent=value;row.append(child)}
 row.onclick=()=>{current=n;el('title').value=n.title;el('body').value=n.body;el('original').textContent=n.transcript;el('stamp').textContent=new Date(n.created).toLocaleString();el('editError').textContent='';el('editor').showModal()};list.append(row);
 }
 if(!list.children.length){const box=document.createElement('div');box.className='empty';box.innerHTML=q?'<b>No matching notes</b>Try another search.':'<div class="sheet">▤</div><b>Your notebook is empty</b>Record a thought or write your first note.';list.append(box)}
}
el('query').oninput=render;
function json(method,data){return {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}}
el('composer').onsubmit=async e=>{
 e.preventDefault();const button=e.submitter;button.disabled=true;el('draft').readOnly=true;status('Saving your note…');
 try{const n=await api('notes',json('POST',{transcript:el('draft').value}));notes.unshift(n);el('draft').value='';render();status(hasAI?'Note saved.':'Transcript saved. Add an API key to enable AI formatting.')}catch(e){status(e.message)}finally{button.disabled=false;el('draft').readOnly=false}
};
async function change(deleting){
 if(deleting&&!confirm('Delete this note and its Markdown file?'))return;
 try{const n=await api('notes?id='+encodeURIComponent(current.id),deleting?{method:'DELETE'}:json('PUT',{title:el('title').value,body:el('body').value}));
 notes=deleting?notes.filter(v=>v.id!==current.id):notes.map(v=>v.id===current.id?n:v);render();el('editor').close()}catch(e){el('editError').textContent=e.message}
}
el('save').onclick=()=>change(false);el('remove').onclick=()=>change(true);
const record=el('record'),caption=record.querySelector('span');
async function transcribe(){
 record.disabled=true;status('Transcribing your recording…');
 try{const data=await api('transcribe',{method:'POST',headers:{'Content-Type':clip.type},body:clip});if(!data.text?.trim())throw Error('No speech detected. Record again.');el('draft').value+=[el('draft').value?'\n':'',data.text].join('');clip=null;mode(true);status('Review your transcript, then save your note.')}
 catch(e){status(e.message)}
 finally{record.disabled=false;el('type').disabled=false;caption.textContent=clip?'Retry transcription':'Start recording'}
}
record.onclick=async()=>{
 if(recorder?.state==='recording'){recorder.stop();return}
 if(clip){await transcribe();return}
 if(!hasAI){status('Set OPENAI_API_KEY and restart Fieldnote to enable voice recording. Text notes are available now.');return}
 record.disabled=true;el('type').disabled=true;let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true});
 const mimeType=['audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported(t));if(!mimeType)throw Error('This browser has no supported recording format.');
 recorder=new MediaRecorder(stream,{mimeType,audioBitsPerSecond:64000});const parts=[];
 recorder.ondataavailable=e=>parts.push(e.data);
 recorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());clearInterval(timer);el('studio').classList.remove('recording');clip=new Blob(parts,{type:mimeType});await transcribe()};
 recorder.start();status('Recording from your microphone');record.disabled=false;caption.textContent='Stop recording';el('studio').classList.add('recording');const start=Date.now();el('clock').textContent='00:00';
 timer=setInterval(()=>{const s=Math.floor((Date.now()-start)/1000);el('clock').textContent=[Math.floor(s/60),s%60].map(v=>String(v).padStart(2,'0')).join(':');if(s>=1200&&recorder.state==='recording')recorder.stop()},250);
 }catch(e){stream?.getTracks().forEach(t=>t.stop());status(e.message);record.disabled=false;el('type').disabled=false}
};
try{[notes,{ai:hasAI}]=await Promise.all([api('notes'),api('config')]);render()}catch(e){status(e.message)}
