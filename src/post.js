import * as T from 'three';
import {FX_LAYER} from './toon.js';
/** Cartoon post stack: depth + normal ink lines, soft bloom, light grading and vignette. */
const quadVertex='varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
const brightFragment=`uniform sampler2D image; uniform vec2 texel; varying vec2 vUv;
void main(){vec3 c=vec3(0.0);for(int x=-1;x<=1;x+=2)for(int y=-1;y<=1;y+=2)c+=texture2D(image,vUv+vec2(float(x),float(y))*texel).rgb*.25;
float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(.82,1.35,l),1.0);}`;
const blurFragment=`uniform sampler2D image; uniform vec2 direction; varying vec2 vUv;
void main(){vec3 c=texture2D(image,vUv).rgb*.2270;
c+=(texture2D(image,vUv+direction*1.3846).rgb+texture2D(image,vUv-direction*1.3846).rgb)*.3162;
c+=(texture2D(image,vUv+direction*3.2308).rgb+texture2D(image,vUv-direction*3.2308).rgb)*.0703;gl_FragColor=vec4(c,1.0);}`;
const compositeFragment=`#include <packing>
uniform sampler2D tColor,tDepth,tNormal,tBloom; uniform vec2 texel; uniform float near,far,thickness,bloom,ink;
varying vec2 vUv;
float viewDepth(vec2 uv){return -perspectiveDepthToViewZ(texture2D(tDepth,uv).x,near,far);}
vec3 viewNormal(vec2 uv){return texture2D(tNormal,uv).xyz*2.0-1.0;}
void main(){
  vec3 c=texture2D(tColor,vUv).rgb;
  vec2 o=texel*thickness;
  float d=viewDepth(vUv);
  vec2 offs[4];offs[0]=vec2(o.x,0.);offs[1]=vec2(-o.x,0.);offs[2]=vec2(0.,o.y);offs[3]=vec2(0.,-o.y);
  vec3 n=viewNormal(vUv);float depthEdge=0.0,normalEdge=0.0;
  for(int i=0;i<4;i++){float dn=viewDepth(vUv+offs[i]);depthEdge+=max(dn-d,0.0);normalEdge+=max(0.0,1.0-dot(n,viewNormal(vUv+offs[i])))*step(dn,d*1.6);}
  depthEdge=smoothstep(.12,.32,depthEdge/max(d,.001)*4.0);
  normalEdge=smoothstep(.45,.9,normalEdge);
  float edge=max(depthEdge,normalEdge)*(1.0-smoothstep(70.0,220.0,d))*ink;
  c+=texture2D(tBloom,vUv).rgb*bloom;
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.12);
  c*=mix(vec3(1.0),vec3(1.03,1.0,.97),smoothstep(.2,1.0,l));
  vec2 q=vUv-.5;c*=1.0-dot(q,q)*.42;
  gl_FragColor=vec4(c,1.0);
  #include <tonemapping_fragment>
  // Ink is laid down after tone mapping so bright HDR surfaces still get dark, tinted lines.
  vec3 toned=gl_FragColor.rgb;
  gl_FragColor.rgb=mix(toned,toned*vec3(.26,.18,.30),edge);
  #include <colorspace_fragment>
}`;
export class ToonPost{
  constructor(renderer){this.renderer=renderer;this.color=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4,depthTexture:new T.DepthTexture(1,1)});this.normal=new T.WebGLRenderTarget(1,1,{depthBuffer:true});this.bright=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false});this.blurA=this.bright.clone();this.blurB=this.bright.clone();
    this.normalMaterial=new T.MeshNormalMaterial();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);this.quad=new T.Mesh(new T.PlaneGeometry(2,2));this.quadScene=new T.Scene();this.quadScene.add(this.quad);
    this.brightMaterial=new T.ShaderMaterial({uniforms:{image:{value:this.color.texture},texel:{value:new T.Vector2()}},vertexShader:quadVertex,fragmentShader:brightFragment,depthTest:false,depthWrite:false});
    this.blurMaterial=new T.ShaderMaterial({uniforms:{image:{value:null},direction:{value:new T.Vector2()}},vertexShader:quadVertex,fragmentShader:blurFragment,depthTest:false,depthWrite:false});
    this.composite=new T.ShaderMaterial({uniforms:{tColor:{value:this.color.texture},tDepth:{value:this.color.depthTexture},tNormal:{value:this.normal.texture},tBloom:{value:this.blurB.texture},texel:{value:new T.Vector2()},near:{value:.1},far:{value:300},thickness:{value:1.3},bloom:{value:.55},ink:{value:.92}},vertexShader:quadVertex,fragmentShader:compositeFragment,depthTest:false,depthWrite:false});
    this.clear=new T.Color();}
  setSize(width,height,pixelRatio){const w=Math.max(1,Math.floor(width*pixelRatio)),h=Math.max(1,Math.floor(height*pixelRatio));this.color.setSize(w,h);this.normal.setSize(w,h);const bw=Math.max(1,w>>2),bh=Math.max(1,h>>2);this.bright.setSize(bw,bh);this.blurA.setSize(bw,bh);this.blurB.setSize(bw,bh);this.brightMaterial.uniforms.texel.value.set(1/w,1/h);this.blurTexel=new T.Vector2(1/bw,1/bh);this.composite.uniforms.texel.value.set(1/w,1/h);this.composite.uniforms.thickness.value=Math.max(1,pixelRatio*1.05);}
  pass(material,target){this.quad.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.quadScene,this.camera);}
  render(scene,camera){const r=this.renderer;r.setRenderTarget(this.color);r.render(scene,camera);const info={calls:r.info.render.calls,triangles:r.info.render.triangles};
    // Normals are drawn without sky, particles or beams so only solid shapes receive ink.
    const background=scene.background,autoShadow=r.shadowMap.autoUpdate,alpha=r.getClearAlpha();r.getClearColor(this.clear);scene.background=null;scene.overrideMaterial=this.normalMaterial;r.shadowMap.autoUpdate=false;camera.layers.disable(FX_LAYER);r.setClearColor(0x8080ff,1);r.setRenderTarget(this.normal);r.clear();r.render(scene,camera);
    camera.layers.enable(FX_LAYER);scene.overrideMaterial=null;scene.background=background;r.shadowMap.autoUpdate=autoShadow;r.setClearColor(this.clear,alpha);
    this.pass(this.brightMaterial,this.bright);for(let i=0;i<2;i++){this.blurMaterial.uniforms.image.value=i?this.blurB.texture:this.bright.texture;this.blurMaterial.uniforms.direction.value.set(this.blurTexel.x*(1+i),0);this.pass(this.blurMaterial,this.blurA);this.blurMaterial.uniforms.image.value=this.blurA.texture;this.blurMaterial.uniforms.direction.value.set(0,this.blurTexel.y*(1+i));this.pass(this.blurMaterial,this.blurB);}
    this.composite.uniforms.near.value=camera.near;this.composite.uniforms.far.value=camera.far;this.pass(this.composite,null);return info;}
}
