import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundListener} from '../dist/listener.js';
import {RATE,DURATION,frequency,envelope,analyze,random,synth} from '../dist/dsp.js';
function background(){const rng=random(11);return Float32Array.from({length:RATE},()=>rng()*.003)}
test('clean chirps pass across registers and simulated noise levels',()=>{for(const base of [100,180,300])for(const noise of [0,1.5,3,4]){const r=analyze(synth(base),background(),base,noise);assert(r.match>=50);assert(r.chi<3);assert(r.sg<6)}});
test('silence and steady tones fail the rising shape check',()=>{assert(analyze(new Float32Array(Math.round(RATE*DURATION)),background()).match<10);assert(analyze(synth(180,'tone'),background(),180,3).match<50)});
test('an interrupted envelope raises consistency score',()=>{const audio=synth();audio.fill(0,0,Math.floor(audio.length/2));assert(analyze(audio,background(),180,3).chi>3)});
test('a high-frequency transient raises the SG veto',()=>{assert(analyze(synth(180,'glitch'),background(),180,4).sg>6)});
test('continuous listening segments repeated chirps at different speeds',()=>{const detector=new SoundListener(RATE),events=[],rng=random(8);function feed(data){for(let s=0;s<data.length;s+=256){const e=detector.push(data.slice(s,s+256));if(e.ended)events.push(e.ended)}}function quiet(t){feed(Float32Array.from({length:Math.round(t*RATE)},()=>rng()*.001))}quiet(1.3);for(const duration of [.8,1.6,3.5,5]){let phase=0;feed(Float32Array.from({length:Math.round(duration*RATE)},(_,i)=>{const t=i/RATE/duration*DURATION;phase+=2*Math.PI*frequency(t)/RATE;return .2*envelope(t)*Math.sin(phase)}));quiet(.8)}assert.equal(events.length,4);for(const e of events){const r=analyze(e.audio,e.background,180,3);assert(r.match>50);assert(r.chi<3);assert(r.sg<6)}assert.equal(detector.active,false)});
test('silence does not trigger an attempt',()=>{const detector=new SoundListener(RATE);for(let i=0;i<100;i++){const event=detector.push(new Float32Array(256));assert(!event.started);assert(!event.ended)}});
