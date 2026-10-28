import * as T from 'three';
import {toon} from './toon.js';
/** Painted face on the head sphere's UVs: front (+Z) sits at u=.25, the equator at v=.5. */
function faceTexture(){const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');g.fillStyle='#f6d7c3';g.fillRect(0,0,1024,512);const cx=256,cy=262;
  for(const s of[-1,1]){const x=cx+s*62;
    g.fillStyle='#f3a3a8';g.globalAlpha=.55;g.beginPath();g.ellipse(x+s*22,cy+62,30,14,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
    g.fillStyle='#ffffff';g.beginPath();g.ellipse(x,cy,27,37,0,0,Math.PI*2);g.fill();
    const iris=g.createLinearGradient(0,cy-34,0,cy+34);iris.addColorStop(0,'#1f3f7a');iris.addColorStop(.55,'#3f7fd0');iris.addColorStop(1,'#8fd0f5');g.fillStyle=iris;g.beginPath();g.ellipse(x+s*2,cy+4,21,31,0,0,Math.PI*2);g.fill();
    g.fillStyle='#172447';g.beginPath();g.ellipse(x+s*2,cy+2,11,17,0,0,Math.PI*2);g.fill();
    g.fillStyle='#ffffff';g.beginPath();g.ellipse(x-s*7,cy-12,8,11,-.3*s,0,Math.PI*2);g.fill();g.beginPath();g.arc(x+s*9,cy+16,4,0,Math.PI*2);g.fill();
    g.strokeStyle='#3b2630';g.lineCap='round';g.lineWidth=9;g.beginPath();g.ellipse(x,cy+3,30,40,0,Math.PI*1.08,Math.PI*1.92);g.stroke();g.lineWidth=6;g.beginPath();g.moveTo(x+s*28,cy-22);g.lineTo(x+s*40,cy-34);g.stroke();
    g.lineWidth=5;g.strokeStyle='#a8774f';g.beginPath();g.moveTo(x-s*20,cy-60);g.quadraticCurveTo(x,cy-70,x+s*24,cy-62);g.stroke();}
  g.strokeStyle='#c46c6f';g.lineWidth=4;g.beginPath();g.moveTo(cx-12,cy+74);g.quadraticCurveTo(cx,cy+84,cx+12,cy+74);g.stroke();g.fillStyle='#e7b39f';g.beginPath();g.arc(cx,cy+44,3,0,Math.PI*2);g.fill();
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;return tex;}
/** Painted hair strands: lines run along v so they converge at the crown and follow each lock. */
function hairTexture(){const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');const base=g.createLinearGradient(0,0,0,256);base.addColorStop(0,'#f7d06a');base.addColorStop(.55,'#f3bf4f');base.addColorStop(1,'#e2a23c');g.fillStyle=base;g.fillRect(0,0,256,256);
  let seed=7;const r=()=>((seed=(seed*16807)%2147483647)/2147483647);for(let i=0;i<70;i++){const x=r()*256,w=1+r()*3;g.strokeStyle=r()<.7?'#d08d2c66':'#fff1b855';g.lineWidth=w;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+(r()-.5)*14,90,x+(r()-.5)*14,170,x+(r()-.5)*10,256);g.stroke();}
  g.fillStyle='#fff6d070';for(let x=0;x<256;x+=16){g.beginPath();g.ellipse(x+8,70,6,16,0,0,Math.PI*2);g.fill();}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;return tex;}
/** A tapered, slightly flattened lock that hangs from its own pivot. */
function lockGeometry(length,width){const pts=[];for(let i=0;i<=14;i++){const t=i/14;pts.push(new T.Vector2(Math.max(.004,width*Math.sin(Math.min(1,t*4)*Math.PI/2)*Math.pow(1-t,.75)),-t*length));}return new T.LatheGeometry(pts.reverse(),14);}
/** Replace Alice.model with a normalized GLB scene; keep this root at the feet. */
export class Alice {
  constructor(){this.root=new T.Group();this.model=new T.Group();this.root.add(this.model);this.phase=0;this.state='Idle';this.landing=0;this.squash=0;this.squashVel=0;this.wasGrounded=true;this.glide=0;
    const blue=toon('#5d9be0'),white=toon('#fffaf0',{rim:.2}),skin=toon('#f8d8c4',{rim:.18}),hair=toon('#ffffff',{map:hairTexture(),rim:.3}),shoe=toon('#3a3048',{shiny:true}),ribbon=toon('#2f2d55',{shiny:true}),sock=toon('#ffffff');
    const add=(geo,m,x,y,z,sx=1,sy=1,sz=1,parent=this.model)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;};const sphere=new T.SphereGeometry(1,28,20);
    const limb=(x)=>{const p=new T.Group();p.position.set(x,.68,0);this.model.add(p);add(new T.CapsuleGeometry(.075,.38,6,14),sock,0,-.23,0,1,1,1,p);add(sphere,shoe,0,-.58,.055,.105,.075,.17,p);add(new T.TorusGeometry(.06,.014,6,14),shoe,0,-.52,.03,1,1,1,p).rotation.x=Math.PI/2;return p;};this.legs=[limb(-.13),limb(.13)];
    this.dressPivot=new T.Group();this.dressPivot.position.y=1.08;this.model.add(this.dressPivot);
    const skirt=new T.LatheGeometry(Array.from({length:12},(_,i)=>{const t=i/11;return new T.Vector2(.19+Math.pow(t,.8)*.36+Math.sin(t*Math.PI)*.04,-t*.62);}).reverse(),40);
    this.dress=add(skirt,blue,0,0,0,1,1,1,this.dressPivot);add(new T.TorusGeometry(.545,.035,8,40),white,0,-.6,0,1,1,1,this.dressPivot).rotation.x=Math.PI/2;
    const ruffle=new T.CylinderGeometry(.535,.585,.14,96,2,true),rp=ruffle.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),z=rp.getZ(i),a=Math.atan2(z,x),k=1+Math.sin(a*30)*.035*(rp.getY(i)<0?1.4:.6);rp.setX(i,x*k);rp.setZ(i,z*k);}ruffle.computeVertexNormals();add(ruffle,toon('#fffaf0',{rim:.2,side:T.DoubleSide}),0,-.63,0,1,1,1,this.dressPivot);const under=add(new T.RingGeometry(.1,.56,48),toon('#f3ecf6',{side:T.DoubleSide}),0,-.6,0,1,1,1,this.dressPivot);under.rotation.x=Math.PI/2;under.castShadow=false;
    const lace=new T.TorusGeometry(.57,.012,6,96);add(lace,toon('#9cc7f2'),0,-.615,0,1,1,1,this.dressPivot).rotation.x=Math.PI/2;
    const apron=new T.LatheGeometry(Array.from({length:10},(_,i)=>{const t=i/9;return new T.Vector2(.2+t*.33,-t*.55);}).reverse(),24,-Math.PI*.38,Math.PI*.76);add(apron,white,0,-.02,.012,1.04,1,1.04,this.dressPivot);
    add(new T.CylinderGeometry(.2,.24,.37,24),blue,0,1.27,0);add(new T.BoxGeometry(.25,.3,.07),white,0,1.25,.19);for(const x of[-.12,.12]){const strap=add(new T.BoxGeometry(.055,.42,.03),white,x,1.32,.17);strap.rotation.x=-.12;const back=add(new T.BoxGeometry(.055,.42,.03),white,x,1.32,-.2);back.rotation.x=.12;}add(new T.TorusGeometry(.215,.02,6,28),white,0,1.12,0).rotation.x=Math.PI/2;
    const bowL=add(sphere,white,-.15,1.1,-.24,.17,.11,.06),bowR=add(sphere,white,.15,1.1,-.24,.17,.11,.06);bowL.rotation.z=-.3;bowR.rotation.z=.3;add(sphere,white,0,1.1,-.26,.06,.06,.07);
    add(new T.TorusGeometry(.13,.035,8,20),white,0,1.46,0,1,1,1).rotation.x=Math.PI/2;
    this.arms=[-.31,.31].map(x=>{const p=new T.Group();p.position.set(x,1.39,0);this.model.add(p);add(sphere,blue,0,-.03,0,.15,.14,.15,p);add(new T.TorusGeometry(.1,.025,6,16),white,0,-.13,0,1,1,1,p).rotation.x=Math.PI/2;add(new T.CapsuleGeometry(.058,.27,6,12),skin,0,-.29,0,1,1,1,p);add(sphere,skin,0,-.48,0,.068,.072,.068,p);return p;});
    this.head=new T.Group();this.head.position.y=1.68;this.model.add(this.head);const face=add(sphere,toon('#ffffff',{map:faceTexture(),rim:.15}),0,0,0,.25,.26,.23,this.head);face.rotation.y=0;
    add(sphere,hair,0,.07,-.045,.268,.262,.245,this.head);
    // Back curtain of tapered locks in two staggered layers, each on a pivot so it sways from the root.
    this.locks=[];const lockGeo=lockGeometry(.78,.085),shortGeo=lockGeometry(.6,.075);
    for(let layer=0;layer<2;layer++)for(let i=0;i<9;i++){const a=-Math.PI*.46+(i+layer*.5)/8.5*Math.PI*.92;const pivot=new T.Group();pivot.position.set(Math.sin(a)*.21,.02-layer*.04,-Math.cos(a)*.17-.04-layer*.03);pivot.rotation.z=Math.sin(a)*-.22;pivot.rotation.x=.12+layer*.06;this.head.add(pivot);const lock=add(layer?shortGeo:lockGeo,hair,0,0,0,1,1,.62,pivot);lock.rotation.y=a;this.locks.push(pivot);}
    // Side locks frame the face; fringe pieces fan across the brow.
    for(const s of[-1,1]){const pivot=new T.Group();pivot.position.set(s*.205,.05,.06);pivot.rotation.z=s*.1;this.head.add(pivot);add(lockGeometry(.42,.06),hair,0,0,0,1,1,.6,pivot);this.locks.push(pivot);}
    for(let i=0;i<7;i++){const pivot=new T.Group();pivot.position.set((i-3)*.066,.2,.15-Math.abs(i-3)*.02);pivot.rotation.z=(i-3)*.16;pivot.rotation.x=-.42;this.head.add(pivot);add(lockGeometry(.15+(i%2)*.03,.055),hair,0,0,0,1,1,.55,pivot);}
    // Black ribbon headband runs ear to ear, with the bow perched on top.
    const band=add(new T.TorusGeometry(.268,.026,8,40,Math.PI),ribbon,0,.04,.02,1,1,1,this.head);band.rotation.x=-.32;
    const bow=new T.Group();bow.position.set(.11,.27,-.02);bow.rotation.set(-.3,0,-.35);this.head.add(bow);for(const s of[-1,1]){const loop=add(sphere,ribbon,s*.09,0,0,.1,.065,.035,bow);loop.rotation.z=s*.35;const tail=add(new T.BoxGeometry(.035,.12,.012),ribbon,s*.04,-.08,-.01,1,1,1,bow);tail.rotation.z=s*.4;}add(sphere,ribbon,0,0,0,.04,.04,.04,bow);
  }
  update(dt,body,angle,time){const speed=Math.hypot(body.velocity.x,body.velocity.z);this.phase+=dt*speed*2.4;if(body.landed){this.landing=.2;this.squashVel-=Math.min(9,2+Math.abs(body.impact||0)*.9);}
    if(this.wasGrounded&&!body.grounded&&body.velocity.y>2)this.squashVel+=6;this.wasGrounded=body.grounded;
    // Critically-damped-ish spring drives squash (negative) and stretch (positive).
    this.squashVel+=(-this.squash*180-this.squashVel*14)*dt;this.squash+=this.squashVel*dt;this.squash=Math.max(-.28,Math.min(.22,this.squash));
    this.landing=Math.max(0,this.landing-dt);this.glide+=((body.gliding?1:0)-this.glide)*(1-Math.exp(-dt*8));
    this.state=!body.grounded?(body.gliding?'Glide':body.velocity.y>0?'Jump':'Fall'):(this.landing?'Landing':(speed>.3?(speed>5?'Run':'Walk'):'Idle'));const moving=body.grounded&&speed>.3;const run=Math.min(1,Math.max(0,(speed-4.25)/3));const swing=moving?Math.sin(this.phase)*Math.min(speed*.13,.85):0;
    this.legs[0].rotation.x=swing;this.legs[1].rotation.x=-swing;this.arms[0].rotation.x=-swing*.75;this.arms[1].rotation.x=swing*.75;
    if(!body.grounded){this.legs[0].rotation.x=-.35*(1-this.glide)+.1;this.legs[1].rotation.x=.25*(1-this.glide);const lift=.35+this.glide*1.05;this.arms[0].rotation.z=-lift;this.arms[1].rotation.z=lift;this.arms[0].rotation.x=this.arms[1].rotation.x=-this.glide*.2;}else{this.arms[0].rotation.z=-.1;this.arms[1].rotation.z=.1;}
    const s=this.squash,sy=1+s,sxz=1/Math.sqrt(Math.max(.5,sy));this.model.scale.set(sxz,sy,sxz);
    this.model.position.y=(moving?Math.abs(Math.sin(this.phase))*(.045+run*.03):Math.sin(time*1.7)*.012);this.model.rotation.x=moving?run*.12+Math.min(speed*.012,.05):0;
    this.dressPivot.scale.set(1+this.glide*.35+run*.05,1-this.glide*.12,1+this.glide*.35+run*.05);this.dressPivot.rotation.z=Math.sin(time*3+this.phase*.3)*(.014+speed*.002);this.dressPivot.rotation.x=-Math.min(speed*.016,.11)*(1-this.glide);
    this.locks.forEach((l,i)=>{l.rotation.x=.12+Math.sin(time*2.5+i*.4)*.05+speed*.03+(body.grounded?0:Math.max(-.4,Math.min(.4,-body.velocity.y*.05)));});this.head.rotation.z=Math.sin(time*.8)*.02;this.head.rotation.x=moving?-run*.1:Math.sin(time*.6)*.02;
    if(speed>.15){let diff=angle-this.root.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));this.root.rotation.y+=diff*(1-Math.exp(-dt*12));}this.root.position.set(body.position.x,body.position.y,body.position.z);
  }
}
