import * as T from 'three';
import {toon} from './toon.js';
/** Story order and the walkable routes that connect every area through the courtyard hub. */
export const OBJECTIVE_ORDER=[0,1,4,2,3];
export const OBJECTIVES={
  0:{title:'처음의 기억',note:'안뜰 끝, 계단 앞에서 빛나는 금빛 카드를 찾으세요.'},
  1:{title:'병사들의 열병장',note:'오른쪽 다리를 건너 카드 병사들 사이의 기억을 찾으세요.'},
  4:{title:'잊혀진 티파티',note:'왼쪽 다리 너머, 빈 테이블 사이에 기억이 남아 있어요.'},
  2:{title:'끝없는 계단',note:'정면의 36계단을 끝까지 올라 상층 회랑으로 가세요.'},
  3:{title:'토끼의 홀',note:'봉인이 풀렸어요. 회랑 안쪽, 거대한 토끼에게 가세요.'}
};
const P=(x,y,z)=>new T.Vector3(x,y,z);
// Each list leads from the hub (0,0,0) outward; reversing it leads back. Nodes follow the QA-verified walkways.
const FROM_HUB={
  0:[P(0,0,0),P(0,0,-10)],
  1:[P(6,0,0),P(20,0,0),P(33,0,0),P(43,0,0),P(50,0,-.7),P(60,0,-.7),P(63,0,-2.6)],
  4:[P(-6,0,0),P(-20,0,0),P(-33,0,0),P(-43,0,0),P(-43,0,4),P(-53,0,4),P(-63,0,4),P(-63,0,-5.4)],
  2:[P(0,0,-15),P(0,0,-25.5),P(0,12,-49),P(0,12,-54),P(4.4,12,-52.5)],
  3:[P(0,0,-15),P(0,0,-25.5),P(0,12,-49),P(0,12,-56),P(0,12,-64),P(0,12,-72.3)]
};
const TO_HUB={0:[],1:[P(57,0,-.7),P(43,0,0),P(33,0,0),P(20,0,0),P(6,0,0)],4:[P(-53,0,4),P(-43,0,4),P(-43,0,0),P(-33,0,0),P(-20,0,0),P(-6,0,0)],2:[P(0,12,-54),P(0,12,-49),P(0,0,-25.5),P(0,0,-15)],3:[P(0,12,-64),P(0,12,-56),P(0,12,-49),P(0,0,-25.5),P(0,0,-15)]};
export function areaOf(p){return p.x>38?1:p.x<-38?4:p.z<-61&&p.y>8?3:p.z<-33?2:0;}
const sameBranch=(a,b)=>a===b||(a===2&&b===3)||(a===3&&b===2);
/** Route from wherever the player stands to a memory: back to the hub only when the target lies on another branch. */
export function buildRoute(from,target){const area=areaOf(from);const entry=FROM_HUB[target];if(sameBranch(area,target)||area===0){const nodes=area===0?entry:entry.filter(n=>sameBranch(areaOf(n),area)||n.y>6);return nodes.map(n=>n.clone());}return [...TO_HUB[area],...entry].map(n=>n.clone());}
/** Index of the next node to head for: one past the closest node along the route. */
export function nextNode(route,p){const last=route.length-1;let best=0,bd=Infinity;route.forEach((n,i)=>{const d=Math.hypot(n.x-p.x,(n.y-p.y)*1.5,n.z-p.z);if(d<bd){bd=d;best=i;}});if(best===last)return last;
  // Past the closest node (projected onto the next segment) or standing on it → head for the following node.
  const a=route[best],b=route[best+1];const sx=b.x-a.x,sy=b.y-a.y,sz=b.z-a.z;const t=((p.x-a.x)*sx+(p.y-a.y)*sy+(p.z-a.z)*sz)/Math.max(1e-6,sx*sx+sy*sy+sz*sz);return t>0||bd<2.5?best+1:best;}
/** A small White Rabbit who hops ahead along the route, waits, checks his watch, and moves on. */
export class RabbitGuide{
  constructor(scene){this.root=new T.Group();this.root.visible=false;scene.add(this.root);this.model=new T.Group();this.root.add(this.model);this.route=null;this.index=0;this.pos=new T.Vector3();this.phase=0;this.moving=false;this.wait=0;this.enabled=true;
    const white=toon('#fffaf6',{rim:.35}),pink=toon('#f4a7bd'),vest=toon('#c94a64'),gold=toon('#f0bd4f',{shiny:true}),dark=toon('#3a2638');const s=new T.SphereGeometry(1,24,16);
    const add=(geo,m,x,y,z,sx,sy,sz,parent=this.model)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;};
    add(s,white,0,.42,0,.3,.36,.27);add(s,vest,0,.46,.02,.315,.3,.28);add(s,white,0,.5,.18,.16,.2,.12);for(const y of[.55,.42])add(s,gold,0,y,.29,.025,.025,.02);
    this.head=new T.Group();this.head.position.y=.86;this.model.add(this.head);add(s,white,0,0,0,.24,.22,.21,this.head);for(const x of[-.09,.09]){add(s,dark,x,.03,.18,.04,.055,.03,this.head);add(s,white,x-.012,.05,.205,.012,.016,.01,this.head);add(s,pink,x*1.5,-.06,.15,.05,.03,.02,this.head);}add(s,pink,0,-.04,.21,.035,.025,.025,this.head);
    this.ears=[-1,1].map(side=>{const ear=new T.Group();ear.position.set(side*.09,.15,-.02);ear.rotation.z=-side*.12;this.head.add(ear);add(s,white,0,.24,0,.065,.26,.05,ear);add(s,pink,0,.23,.03,.035,.2,.02,ear);return ear;});
    this.feet=[-1,1].map(side=>add(s,white,side*.13,.05,.06,.09,.06,.16));add(s,white,0,.36,-.27,.1,.1,.1);
    this.watch=new T.Group();this.watch.position.set(.26,.52,.2);this.model.add(this.watch);const disc=add(new T.CylinderGeometry(.09,.09,.03,20),gold,0,0,0,1,1,1,this.watch);disc.rotation.x=Math.PI/2;add(new T.CircleGeometry(.075,20),toon('#fff9ed'),0,0,.017,1,1,1,this.watch);}
  setRoute(route){this.route=route&&route.length?route:null;this.fresh=true;if(!this.route)this.root.visible=false;}
  vanish(){this.root.visible=false;this.route=null;}
  update(dt,time,player,onPoof){if(!this.route||!this.enabled){this.root.visible=false;return;}const route=this.route,last=route.length-1;const toPlayer=Math.hypot(player.x-this.pos.x,player.z-this.pos.z);const ahead=nextNode(route,player);
    // Appear (or reappear) just ahead of the player whenever he is out of sight or left behind.
    // A new route restarts from the node ahead of the player; the rabbit only blinks over when far away.
    if(this.fresh){this.fresh=false;this.index=ahead;if(this.root.visible&&Math.hypot(route[ahead].x-this.pos.x,route[ahead].z-this.pos.z)>18)this.root.visible=false;}
    this.index=Math.min(this.index,last);
    if(!this.root.visible||toPlayer>36){this.index=ahead;this.pos.copy(route[this.index]);this.root.visible=true;onPoof?.(this.pos);}
    if(ahead>this.index)this.index=ahead;if(toPlayer<6.5&&this.index<last&&!this.moving&&this.wait<=0)this.index++;
    const target=route[this.index];const dx=target.x-this.pos.x,dy=target.y-this.pos.y,dz=target.z-this.pos.z,d=Math.hypot(dx,dy,dz);this.moving=d>.08;
    if(this.moving){const step=Math.min(d,dt*8.5);this.pos.x+=dx/d*step;this.pos.y+=dy/d*step;this.pos.z+=dz/d*step;this.phase+=dt*13;this.root.rotation.y+=Math.atan2(Math.sin(Math.atan2(dx,dz)-this.root.rotation.y),Math.cos(Math.atan2(dx,dz)-this.root.rotation.y))*(1-Math.exp(-dt*14));if(d-step<.08)this.wait=.35;}
    else{this.wait-=dt;const face=Math.atan2(player.x-this.pos.x,player.z-this.pos.z);this.root.rotation.y+=Math.atan2(Math.sin(face-this.root.rotation.y),Math.cos(face-this.root.rotation.y))*(1-Math.exp(-dt*5));}
    const hop=this.moving?Math.abs(Math.sin(this.phase))*.38:Math.max(0,Math.sin(time*9))*.03;this.root.position.set(this.pos.x,this.pos.y+hop,this.pos.z);this.model.scale.set(1,this.moving?1+Math.cos(this.phase*2)*.08:1,1);
    this.ears.forEach((e,i)=>{e.rotation.x=this.moving?-.35-Math.sin(this.phase)*.2:Math.sin(time*2+i)*.08;});this.watch.position.y=this.moving?.52:.62+Math.sin(time*3)*.02;this.watch.position.z=this.moving?.2:.3;this.head.rotation.x=this.moving?0:.25;this.feet.forEach((f,i)=>{f.position.z=.06+(this.moving?Math.sin(this.phase+i*Math.PI)*.08:0);});}
}
