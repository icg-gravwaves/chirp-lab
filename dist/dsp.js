export const RATE=8192, DURATION=1.5, SIZE=1024, HOP=128;
// Leading-order (Newtonian) inspiral: f ∝ (t_c − t)^(−3/8), ending at the ISCO frequency.
// The sweep starts at `base` and rises by `ratio` over DURATION (pitch-shifted to voice range).
export const frequency=(t,base=180,ratio=4)=>{const tauEnd=DURATION/(Math.pow(ratio,8/3)-1),x=Math.max(0,Math.min(DURATION,t));return base*ratio*Math.pow(tauEnd/(tauEnd+DURATION-x),3/8)};
export const envelope=t=>Math.sin(Math.PI*Math.max(0,Math.min(1,t/DURATION)))**0.45;
export function random(seed=1234){return()=>{seed=(1664525*seed+1013904223)>>>0;return (seed/4294967296-.5)*Math.sqrt(12)}}
/** Preset binaries (component masses in M☉) with their precomputed leading-order
 * frequency rise over the final DURATION seconds, up to the ISCO frequency. */
export const PRESETS=[
 {m1:22,m2:18,fStart:21.7,fIsco:110,ratio:5.06},
 {m1:25,m2:20,fStart:20.2,fIsco:98,ratio:4.84},
 {m1:24,m2:24,fStart:19.3,fIsco:92,ratio:4.75},
 {m1:30,m2:15,fStart:21,fIsco:98,ratio:4.66},
 {m1:28,m2:22,fStart:18.9,fIsco:88,ratio:4.65},
 {m1:32,m2:27,fStart:17,fIsco:75,ratio:4.39},
 {m1:36,m2:29,fStart:16,fIsco:68,ratio:4.23},
 {m1:35,m2:35,fStart:15.2,fIsco:63,ratio:4.13},
 {m1:40,m2:25,fStart:16.3,fIsco:68,ratio:4.16},
 {m1:42,m2:33,fStart:14.6,fIsco:59,ratio:4.01},
 {m1:45,m2:30,fStart:14.8,fIsco:59,ratio:3.97},
 {m1:48,m2:38,fStart:13.4,fIsco:51,ratio:3.81},
 {m1:50,m2:35,fStart:13.6,fIsco:52,ratio:3.8},
 {m1:55,m2:45,fStart:12.2,fIsco:44,ratio:3.61},
 {m1:60,m2:30,fStart:13.5,fIsco:49,ratio:3.61},
 {m1:62,m2:50,fStart:11.3,fIsco:39,ratio:3.47},
 {m1:66,m2:44,fStart:11.6,fIsco:40,ratio:3.45},
 {m1:70,m2:55,fStart:10.6,fIsco:35,ratio:3.33},
 {m1:80,m2:60,fStart:9.8,fIsco:31,ratio:3.19},
 {m1:85,m2:65,fStart:9.4,fIsco:29,ratio:3.11}
];
/** Pick a preset at random, avoiding an immediate repeat. */
export function pickPreset(previous,rng=Math.random){const options=PRESETS.filter(p=>p!==previous);return options[Math.floor(rng()*options.length)]}
export function synth(base=180,kind='chirp',ratio=4) {const out=new Float32Array(Math.round(RATE*DURATION));let phase=0;for(let i=0;i<out.length;i++){const t=i/RATE;phase+=2*Math.PI*(kind==='tone'?base:frequency(t,base,ratio))/RATE;out[i]=.2*envelope(t)*Math.sin(phase);if(kind==='glitch')out[i]+=.8*Math.exp(-(((t-DURATION*.9375)/.025)**2))*Math.sin(2*Math.PI*(base*ratio+250)*t)}return out}
export function resample(input,from){const out=new Float32Array(Math.floor(input.length*RATE/from));for(let i=0;i<out.length;i++){const p=i*from/RATE,j=Math.floor(p),a=p-j;out[i]=input[j]*(1-a)+(input[Math.min(j+1,input.length-1)]||0)*a}return out}
export function spectrum(input,start=0){const re=new Float64Array(SIZE),im=new Float64Array(SIZE);for(let i=0;i<SIZE;i++)re[i]=(input[start+i]||0)*(.5-.5*Math.cos(2*Math.PI*i/(SIZE-1)));for(let i=1,j=0;i<SIZE;i++){let bit=SIZE>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[re[i],re[j]]=[re[j],re[i]]}for(let len=2;len<=SIZE;len*=2){const angle=-2*Math.PI/len;for(let i=0;i<SIZE;i+=len)for(let j=0;j<len/2;j++){const c=Math.cos(angle*j),s=Math.sin(angle*j),a=i+j,b=a+len/2,tr=c*re[b]-s*im[b],ti=s*re[b]+c*im[b];re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti}}return Array.from({length:SIZE/2},(_,i)=>(re[i]*re[i]+im[i]*im[i])/(SIZE*SIZE))}
function tile(data,center,f){let a=0,b=0,norm=0;const width=.028;for(let i=Math.max(0,Math.floor((center-4*width)*RATE));i<Math.min(data.length,(center+4*width)*RATE);i++){const t=i/RATE,w=Math.exp(-.5*((t-center)/width)**2);a+=data[i]*w*Math.cos(2*Math.PI*f*t);b+=data[i]*w*Math.sin(2*Math.PI*f*t);norm+=w*w}return (a*a+b*b)/Math.max(norm,1)}
export function analyze(original,baseline,base=180,noise=0,seed=847,ratio=4){const duration=original.length/RATE;const rng=random(seed);const rms=Math.sqrt(original.reduce((s,x)=>s+x*x,0)/Math.max(1,original.length));const bgRms=Math.sqrt(baseline.reduce((s,x)=>s+x*x,0)/Math.max(1,baseline.length));const added=Math.max(.025,rms)*noise;const data=Float32Array.from(original,x=>x+added*rng());const bg=Float32Array.from(baseline,x=>x+added*rng());let floor=new Float64Array(SIZE/2),nf=0;for(let s=0;s+SIZE<=bg.length;s+=HOP){spectrum(bg,s).forEach((x,i)=>floor[i]+=x);nf++}floor=Array.from(floor,x=>Math.max(x/Math.max(1,nf),1e-10));const frames=[];let score=0,wsum=0;for(let s=0;s+SIZE<=data.length;s+=HOP){const t=(s+SIZE/2)/RATE,p=spectrum(data,s),f=frequency(t*DURATION/duration,base,ratio),k=Math.round(f*SIZE/RATE),w=envelope(t*DURATION/duration)**2;let peak=0,pk=0;for(let j=Math.floor(base*.7*SIZE/RATE);j<Math.min(p.length,Math.ceil(base*(ratio+.6)*SIZE/RATE));j++){const excess=Math.max(0,p[j]-floor[j]);if(excess>peak){peak=excess;pk=j}}let energy=0;for(let j=k-2;j<=k+2;j++)energy+=Math.max(0,(p[j]||0)-floor[j]);const diff=Math.abs(Math.log2(Math.max(1,pk*RATE/SIZE)/f));const strength=Math.min(1,peak/Math.max(1e-8,floor[pk]*4));score+=Math.exp(-.5*(diff/.16)**2)*strength*w;wsum+=w;frames.push({t:t*DURATION/duration,p,energy,w,f,peak:pk*RATE/SIZE})}
// Equal expected-power regions compare energy allocation along the target ridge.
const expected=new Array(6).fill(0),observed=new Array(6).fill(0);let cum=0;for(const fr of frames){const bin=Math.min(5,Math.floor(6*(cum+fr.w/2)/wsum));expected[bin]+=fr.w;observed[bin]+=fr.energy;cum+=fr.w}const total=observed.reduce((a,b)=>a+b,0);let chi=0;for(let i=0;i<6;i++){const e=expected[i]/wsum,o=observed[i]/Math.max(total,1e-12);chi+=(o-e)**2/Math.max(.0025,e*.055)}chi=1+chi/5;
// Gaussian-windowed quadrature projections sample excess power above the chirp endpoint.
let sg=0;for(const off of [160,260,380]){const f=base*ratio+off;const powers=[];for(let t=.14;t<bg.length/RATE-.14;t+=.11)powers.push(tile(bg,t,f));const reference=Math.max(1e-7,powers.reduce((a,b)=>a+b,0)/Math.max(1,powers.length));sg+=tile(data,duration*.9375,f)/reference}sg=Math.max(1,sg/3);
return {match:Math.round(100*score/Math.max(wsum,1e-10)),chi,sg,frames,rms,bgRms,added,duration};}
