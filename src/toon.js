import * as T from 'three';
/** Shared cel-shading: a stepped light ramp, a crisp rim and an optional painted highlight. */
export const FX_LAYER=1;
let ramp;
function gradientMap(){if(ramp)return ramp;ramp=new T.DataTexture(new Uint8Array([92,150,255,255]),4,1,T.RedFormat);ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;return ramp;}
// Kept as one function so every toon material shares the same program variant.
export function toonPatch(shader){shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
  vec3 toonView=normalize(vViewPosition);
  float toonRim=1.0-max(dot(toonView,normal),0.0);
  outgoingLight+=diffuseColor.rgb*smoothstep(.62,.7,toonRim)*TOON_RIM;
  #if defined(TOON_SHINY)&&NUM_DIR_LIGHTS>0
  vec3 toonHalf=normalize(directionalLights[0].direction+toonView);
  outgoingLight+=vec3(1.,.95,.86)*smoothstep(.955,.97,max(dot(normal,toonHalf),0.))*.7;
  #endif
  #include <opaque_fragment>`);}
export function toon(color,{map=null,shiny=false,rim=.28,emissive='#000000',emissiveIntensity=1,side=T.FrontSide}={}){const m=new T.MeshToonMaterial({color,map,gradientMap:gradientMap(),emissive,emissiveIntensity,side});m.defines={TOON_RIM:rim.toFixed(3)};if(shiny)m.defines.TOON_SHINY='';m.onBeforeCompile=toonPatch;return m;}
