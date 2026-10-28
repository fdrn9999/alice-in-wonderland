import * as T from 'three';
import {FX_LAYER} from './toon.js';
/** Pooled point particles: additive four-point sparkles or soft cartoon dust puffs. */
const vertexShader=`attribute float size; attribute float alpha; attribute vec3 tint; uniform float scale; varying float vAlpha; varying vec3 vTint;
void main(){vAlpha=alpha;vTint=tint;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*scale/max(-mv.z,.1);gl_Position=projectionMatrix*mv;}`;
const sparkleFragment=`varying float vAlpha; varying vec3 vTint;
void main(){vec2 p=gl_PointCoord-.5;float core=smoothstep(.22,0.,length(p));float star=max(0.,1.-abs(p.x)*9.)*max(0.,1.-abs(p.y)*2.2)+max(0.,1.-abs(p.y)*9.)*max(0.,1.-abs(p.x)*2.2);
float a=clamp(core+star*.8,0.,1.)*vAlpha;if(a<.01)discard;gl_FragColor=vec4(vTint*a*2.2,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const dustFragment=`varying float vAlpha; varying vec3 vTint;
void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float a=smoothstep(.5,.38,d)*vAlpha;if(a<.01)discard;float shade=step(.04,p.x+p.y*-.6)*.12;gl_FragColor=vec4(vTint*(1.-shade),a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export class Particles{
  constructor(scene,max,{additive=false}={}){this.max=max;this.cursor=0;this.items=Array.from({length:max},()=>({life:0,max:1,vx:0,vy:0,vz:0,g:0,drag:0,size:0,grow:0}));const g=new T.BufferGeometry();this.pos=new Float32Array(max*3);this.size=new Float32Array(max);this.alpha=new Float32Array(max);this.tint=new Float32Array(max*3);g.setAttribute('position',new T.BufferAttribute(this.pos,3).setUsage(T.DynamicDrawUsage));g.setAttribute('size',new T.BufferAttribute(this.size,1).setUsage(T.DynamicDrawUsage));g.setAttribute('alpha',new T.BufferAttribute(this.alpha,1).setUsage(T.DynamicDrawUsage));g.setAttribute('tint',new T.BufferAttribute(this.tint,3).setUsage(T.DynamicDrawUsage));
    this.material=new T.ShaderMaterial({uniforms:{scale:{value:400}},vertexShader,fragmentShader:additive?sparkleFragment:dustFragment,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});this.points=new T.Points(g,this.material);this.points.frustumCulled=false;this.points.layers.set(FX_LAYER);this.points.renderOrder=5;scene.add(this.points);this.color=new T.Color();}
  setScale(height){this.material.uniforms.scale.value=height*.5;}
  burst(x,y,z,{count=12,speed=3,up=1,spread=.2,color='#ffffff',size=.35,life=.9,gravity=-4,drag=2,grow=0}={}){this.color.set(color);for(let n=0;n<count;n++){const i=this.cursor=(this.cursor+1)%this.max,p=this.items[i];const a=Math.random()*Math.PI*2,e=Math.random()*2-1,s=speed*(.4+Math.random()*.6);p.life=p.max=life*(.6+Math.random()*.6);p.vx=Math.cos(a)*Math.sqrt(1-e*e)*s;p.vz=Math.sin(a)*Math.sqrt(1-e*e)*s;p.vy=Math.abs(e)*s*up+up*.5;p.g=gravity;p.drag=drag;p.size=size*(.7+Math.random()*.6);p.grow=grow;this.pos[i*3]=x+(Math.random()-.5)*spread;this.pos[i*3+1]=y+(Math.random()-.5)*spread;this.pos[i*3+2]=z+(Math.random()-.5)*spread;this.tint[i*3]=this.color.r;this.tint[i*3+1]=this.color.g;this.tint[i*3+2]=this.color.b;}}
  update(dt){for(let i=0;i<this.max;i++){const p=this.items[i];if(p.life<=0){this.alpha[i]=0;continue;}p.life-=dt;const k=Math.exp(-p.drag*dt);p.vx*=k;p.vz*=k;p.vy=p.vy*k+p.g*dt;this.pos[i*3]+=p.vx*dt;this.pos[i*3+1]+=p.vy*dt;this.pos[i*3+2]+=p.vz*dt;const t=Math.max(0,p.life/p.max);this.alpha[i]=Math.min(1,t*2.2)*Math.min(1,(1-t)*12+.2);this.size[i]=p.size*(1+(1-t)*p.grow);}
    const g=this.points.geometry;g.attributes.position.needsUpdate=g.attributes.size.needsUpdate=g.attributes.alpha.needsUpdate=g.attributes.tint.needsUpdate=true;}
}
