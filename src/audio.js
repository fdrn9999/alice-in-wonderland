/** Entirely synthesized audio: no external media, no autoplay before a gesture. */
export class DreamAudio {
  constructor(){this.enabled=false;this.volume=.25;this.timer=0;this.note=0;this.stepTime=0;this.tickTime=0;}
  async start(){if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);this.delay=this.ctx.createDelay(2);this.delay.delayTime.value=.43;const feedback=this.ctx.createGain();feedback.gain.value=.24;this.delay.connect(feedback);feedback.connect(this.delay);this.delay.connect(this.master);
      const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),d=buffer.getChannelData(0);let s=0;for(let i=0;i<d.length;i++){s=(s+(Math.random()*2-1)*.035)/1.035;d[i]=s;}const wind=this.ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;const low=this.ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=580;const gain=this.ctx.createGain();gain.gain.value=.32;wind.connect(low);low.connect(gain);gain.connect(this.master);wind.start();}
    await this.ctx.resume();this.enabled=true;this.applyVolume();return true;}
  applyVolume(){if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.3);}
  toggle(){if(!this.enabled)return this.start();this.enabled=false;this.applyVolume();return Promise.resolve(false);}
  tone(freq,duration,amp=.1,type='sine',delay=true){if(!this.ctx||!this.enabled)return;const now=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(amp,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.master);if(delay)g.connect(this.delay);o.start();o.stop(now+duration+.03);}
  update(dt,speed,grounded,area){if(!this.enabled)return;this.timer+=dt;this.tickTime+=dt;this.stepTime+=dt;if(this.timer>2.8){this.timer=0;const melody=[659.25,783.99,987.77,880,659.25,587.33,783.99,523.25];this.tone(melody[this.note++%melody.length],2.1,.075);this.tone(melody[(this.note+2)%melody.length]*.5,2.8,.025);}
    if(this.tickTime>1.08){this.tickTime=0;if(area===3||Math.random()<.23)this.tone(this.note%2?1300:1900,.06,.018,'triangle',false);}
    if(speed>.5&&grounded&&this.stepTime>(speed>5?.28:.42)){this.stepTime=0;this.tone(150+Math.random()*55,.065,.026,'triangle',false);}
  }
  sweep(from,to,duration,amp=.05,type='sine'){if(!this.ctx||!this.enabled)return;const now=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(from,now);o.frequency.exponentialRampToValueAtTime(to,now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(amp,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.master);o.start();o.stop(now+duration+.03);}
  jump(){this.sweep(330,620,.16,.04,'triangle');}
  land(impact){this.tone(110+Math.random()*20,.09,Math.min(.07,.015+impact*.006),'triangle',false);}
  shard(combo){const scale=[1046.5,1174.66,1318.51,1567.98,1760,2093];const f=scale[Math.min(combo,scale.length-1)];this.tone(f,.5,.07);this.tone(f*1.5,.35,.025,'triangle');}
  collect(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>setTimeout(()=>this.tone(f,1.8,.12),i*140));}
}
