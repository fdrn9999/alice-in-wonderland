import {PlayerBody} from './physics.js';
/** Runs isolated bodies against the exact colliders used by the rendered world. */
export function verifyWorldRoutes(physics){
  const results=[];
  const route=(name,start,waypoints)=>{const b=new PlayerBody(physics,start.x,start.y,start.z);let ok=true;for(const p of waypoints){let reached=false;for(let tick=0;tick<5400;tick++){const dx=p.x-b.position.x,dz=p.z-b.position.z,d=Math.hypot(dx,dz);if(d<.17){reached=true;break;}b.step(1/90,dx/d,dz/d,4.25);}for(let i=0;i<90;i++)b.step(1/90,0,0,0);if(!reached||Math.abs(b.position.y-p.y)>.4){ok=false;break;}}results.push({name,passed:ok,end:{...b.position}});};
  route('안뜰의 기억까지', {x:0,y:0,z:13},[{x:0,y:0,z:-13}]);
  route('안뜰 → 다리 → 열병장', {x:0,y:0,z:0},[{x:57,y:0,z:0},{x:63,y:0,z:-2.1}]);
  route('36단 계단 → 상층 기억 → 토끼의 홀', {x:0,y:0,z:13},[{x:0,y:12,z:-54},{x:7,y:12,z:-52},{x:0,y:12,z:-58},{x:0,y:12,z:-75}]);
  route('공중 분기 계단 오르기와 내려오기', {x:0,y:12,z:-54},[{x:-25,y:18,z:-54},{x:0,y:12,z:-54}]);
  route('상층 → 36단 계단 하강 → 안뜰', {x:0,y:12,z:-60},[{x:0,y:0,z:0}]);
  route('안뜰 → 티파티 → 테이블 사이의 기억', {x:0,y:0,z:0},[{x:-43,y:0,z:0},{x:-43,y:0,z:4},{x:-63,y:0,z:4},{x:-63,y:0,z:-8}]);
  return results;
}
