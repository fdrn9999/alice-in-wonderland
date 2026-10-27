import * as T from 'three';
/** Replace Alice.model with a normalized GLB scene; keep this root at the feet. */
export class Alice {
  constructor(){this.root=new T.Group();this.model=new T.Group();this.root.add(this.model);this.phase=0;this.state='Idle';this.landing=0;
    const mat=(c,r=.75)=>new T.MeshStandardMaterial({color:c,roughness:r});const blue=mat('#82a9d2'),white=mat('#fff9ed'),skin=mat('#f2d1b8'),hair=mat('#e7bc69'),shoe=mat('#4d465c'),ribbon=mat('#454458');
    const add=(geo,m,x,y,z,sx=1,sy=1,sz=1,parent=this.model)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;};const sphere=new T.SphereGeometry(1,18,14);const limb=(x)=>{const p=new T.Group();p.position.set(x,.68,0);this.model.add(p);add(new T.CapsuleGeometry(.077,.38,4,10),white,0,-.23,0,1,1,1,p);add(sphere,shoe,0,-.58,.055,.10,.07,.16,p);return p;};this.legs=[limb(-.13),limb(.13)];
    this.dress=add(new T.CylinderGeometry(.18,.51,.63,32,1,true),blue,0,.79,0);add(new T.TorusGeometry(.47,.045,8,32),white,0,.495,0).rotation.x=Math.PI/2;
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;add(sphere,white,Math.cos(a)*.44,.48,Math.sin(a)*.44,.075,.055,.075);}
    add(new T.CylinderGeometry(.21,.26,.37,20),blue,0,1.19,0);add(sphere,white,0,.85,.26,.29,.27,.13);add(new T.BoxGeometry(.26,.34,.09),white,0,1.18,.19);for(const x of[-.16,.16]){add(new T.BoxGeometry(.065,.34,.07),white,x,1.24,.17);const bow=add(sphere,white,x,1.01,-.24,.17,.12,.065);bow.rotation.z=x*2;}add(sphere,white,0,1.02,-.27,.07,.06,.08);
    this.arms=[-.32,.32].map(x=>{const p=new T.Group();p.position.set(x,1.32,0);this.model.add(p);add(sphere,blue,0,-.025,0,.145,.14,.14,p);add(new T.CapsuleGeometry(.065,.29,4,10),skin,0,-.27,0,1,1,1,p);add(sphere,skin,0,-.48,0,.07,.075,.07,p);return p;});
    this.head=new T.Group();this.head.position.y=1.59;this.model.add(this.head);add(sphere,skin,0,0,0,.235,.255,.215,this.head);add(sphere,hair,0,.075,-.045,.25,.24,.215,this.head);
    this.locks=[];for(let i=0;i<11;i++){const a=-Math.PI/2+(i/10)*Math.PI;const lock=add(new T.CapsuleGeometry(.065,.65,4,8),hair,Math.sin(a)*.23,-.31,-Math.cos(a)*.15-.05,1,1,1,this.head);lock.rotation.z=Math.sin(a)*-.17;this.locks.push(lock);}
    for(let i=0;i<5;i++){const fringe=add(sphere,hair,(i-2)*.085,.135,.153,.075,.12,.06,this.head);fringe.rotation.z=(i-2)*.15;}
    for(const x of[-.082,.082]){add(sphere,shoe,x,.005,.202,.027,.041,.014,this.head);add(sphere,white,x-.008,.017,.214,.009,.012,.008,this.head);}add(sphere,skin,0,-.045,.214,.037,.038,.03,this.head);const band=add(new T.TorusGeometry(.224,.027,7,24,Math.PI),ribbon,0,.06,0,1,1,.92,this.head);band.rotation.y=Math.PI/2;
    for(const x of[-.09,.09]){const b=add(sphere,ribbon,x,.285,-.02,.11,.07,.05,this.head);b.rotation.z=x>0?-.4:.4;}
  }
  update(dt,body,angle,time){const speed=Math.hypot(body.velocity.x,body.velocity.z);this.phase+=dt*speed*2.4;if(body.landed)this.landing=.2;this.landing=Math.max(0,this.landing-dt);this.state=!body.grounded?(body.velocity.y>0?'Jump':'Fall'):(this.landing?'Landing':(speed>.3?(speed>5?'Run':'Walk'):'Idle'));const moving=body.grounded&&speed>.3;const swing=moving?Math.sin(this.phase)*Math.min(speed*.12,.7):0;this.legs[0].rotation.x=swing;this.legs[1].rotation.x=-swing;this.arms[0].rotation.x=-swing*.65;this.arms[1].rotation.x=swing*.65;
    if(!body.grounded){this.legs[0].rotation.x=-.35;this.legs[1].rotation.x=.25;this.arms[0].rotation.z=.28;this.arms[1].rotation.z=-.28;}else{this.arms[0].rotation.z=.08;this.arms[1].rotation.z=-.08;}
    this.model.position.y=(moving?Math.abs(Math.sin(this.phase))*.045:Math.sin(time*1.7)*.012)-Math.sin(this.landing/.2*Math.PI)*.09;this.dress.rotation.z=Math.sin(time*3+this.phase*.3)*(.014+speed*.002);this.dress.rotation.x=Math.min(speed*.014,.09);this.locks.forEach((l,i)=>{l.rotation.x=Math.sin(time*2.5+i*.4)*.055+speed*.022;});this.head.rotation.z=Math.sin(time*.8)*.018;
    if(speed>.15){let diff=angle-this.root.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));this.root.rotation.y+=diff*(1-Math.exp(-dt*12));}this.root.position.set(body.position.x,body.position.y,body.position.z);
  }
}
