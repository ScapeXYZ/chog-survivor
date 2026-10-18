// Native Chromium playback acceptance. No wallet APIs, app hooks or transactions.
import {chromium} from '../../frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const url=process.argv[2];
if(!url || !/^https?:\/\//.test(url)) throw new Error('Pass the local or public MP4 URL');
const out=process.argv[3]??'docs/evidence/task7w/browser.json';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=2;},null,{timeout:90000});
 const metadata=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
 if(metadata.duration<55||metadata.duration>65||metadata.width!==1920) throw new Error(JSON.stringify(metadata));
 await page.evaluate(()=>{
  const button=document.createElement('button');button.id='qa-play';button.textContent='Play with sound';
  button.style='position:fixed;top:0;left:0;z-index:9999';
  button.onclick=async()=>{
   const v=document.querySelector('video');v.pause();v.currentTime=.8;v.muted=false;v.volume=1;
   const ctx=new AudioContext();const source=ctx.createMediaElementSource(v);const analyser=ctx.createAnalyser();
   analyser.fftSize=2048;source.connect(analyser);analyser.connect(ctx.destination);await ctx.resume();
   window.__videoQA={rms:[],contextState:ctx.state};const values=new Float32Array(analyser.fftSize);
   window.__videoQA.timer=setInterval(()=>{analyser.getFloatTimeDomainData(values);window.__videoQA.rms.push(Math.sqrt(values.reduce((a,x)=>a+x*x,0)/values.length));},150);
   await v.play();
  };document.body.append(button);
 });
 await page.locator('#qa-play').click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>3,null,{timeout:90000});
 const playback=await page.locator('video').evaluate(v=>{
  clearInterval(window.__videoQA.timer);v.pause();return{currentTime:v.currentTime,muted:v.muted,volume:v.volume,
   error:v.error?.message??null,audioDecodedBytes:v.webkitAudioDecodedByteCount??null,
   rms:window.__videoQA.rms,contextState:window.__videoQA.contextState};
 });
 if(playback.error||playback.muted||playback.volume===0||Math.max(...playback.rms)<.005) throw new Error(JSON.stringify(playback));
 await page.locator('#qa-play').evaluate(b=>b.remove());
 await page.screenshot({path:out.replace(/\.json$/,'.png')});
 await fs.writeFile(out,JSON.stringify({url,metadata,playback,passed:true},null,2)+'\n');
 console.log('Native public/local video playback with non-silent decoded narration passed',metadata);
} finally {await browser.close();}
