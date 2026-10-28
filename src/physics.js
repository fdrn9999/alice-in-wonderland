/** Small deterministic capsule-foot / AABB controller. All dimensions are metres. */
export class PhysicsWorld {
  constructor(){this.boxes=[];}
  addBox(x,y,z,w,h,d,{walkable=true}={}){const box={minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2,walkable};this.boxes.push(box);return box;}
  supportAt(x,z,ceiling=Infinity,radius=.05){let top=-Infinity;for(const b of this.boxes)if(b.walkable&&b.maxY<=ceiling&&x+radius>b.minX&&x-radius<b.maxX&&z+radius>b.minZ&&z-radius<b.maxZ)top=Math.max(top,b.maxY);return top;}
}
export class PlayerBody {
  constructor(world,x=0,y=0,z=13){this.world=world;this.position={x,y,z};this.velocity={x:0,y:0,z:0};this.radius=.32;this.height=1.75;this.grounded=true;this.landed=false;this.checkpoint={x,y,z};this.coyote=0;this.gliding=false;this.impact=0;}
  teleport(p){Object.assign(this.position,p);this.velocity={x:0,y:0,z:0};this.grounded=false;}
  reset(){this.teleport(this.checkpoint);}
  // Coyote time forgives a jump pressed a few frames after walking off an edge.
  jump(){if(!this.grounded&&this.coyote<=0)return false;this.velocity.y=7.9;this.grounded=false;this.coyote=0;return true;}
  cutJump(){if(this.velocity.y>3)this.velocity.y*=.55;}
  moveAxis(axis,amount){if(Math.abs(amount)<1e-9)return;const p=this.position,r=this.radius;const prior=p[axis];p[axis]+=amount;for(const b of this.world.boxes){if(p.y>=b.maxY-.001||p.y+this.height<=b.minY+.01)continue;if(this.grounded&&b.walkable&&b.maxY-p.y<=.38)continue;const min=axis==='x'?b.minX:b.minZ,max=axis==='x'?b.maxX:b.maxZ;
    // When descending a tread the capsule can overlap its departing edge.
    // Allow it to leave instead of treating that edge as an approaching wall.
    if((amount>0&&prior>=max)||(amount<0&&prior<=min))continue;
    const nearestX=Math.max(b.minX,Math.min(p.x,b.maxX)),nearestZ=Math.max(b.minZ,Math.min(p.z,b.maxZ));const dx=p.x-nearestX,dz=p.z-nearestZ;if(dx*dx+dz*dz>=r*r)continue;const other=axis==='x'?dz:dx;const clearance=Math.sqrt(Math.max(0,r*r-other*other))+.001;p[axis]=amount>0?min-clearance:max+clearance;if(Math.abs(p[axis]-prior)>Math.abs(amount)+r)p[axis]=prior;}}
  step(dt,dx,dz,speed,glide=false,held=glide){this.landed=false;const blend=1-Math.exp(-(this.grounded?14:4)*dt);this.velocity.x+=(dx*speed-this.velocity.x)*blend;this.velocity.z+=(dz*speed-this.velocity.z)*blend;this.moveAxis('x',this.velocity.x*dt);this.moveAxis('z',this.velocity.z*dt);const previousY=this.position.y;const wasGrounded=this.grounded;// Apex hang: holding jump softens gravity near the top of the arc for a readable, floaty peak.
    this.velocity.y-=22*dt*(held&&!this.grounded&&Math.abs(this.velocity.y)<1.6?.5:1);this.gliding=glide&&!this.grounded&&this.velocity.y<0;if(this.gliding)this.velocity.y=Math.max(this.velocity.y,-2.4);let nextY=previousY+this.velocity.y*dt;
    if(this.velocity.y>0){for(const b of this.world.boxes){if(this.position.x+this.radius>b.minX&&this.position.x-this.radius<b.maxX&&this.position.z+this.radius>b.minZ&&this.position.z-this.radius<b.maxZ&&previousY+this.height<=b.minY&&nextY+this.height>=b.minY){nextY=b.minY-this.height;this.velocity.y=0;}}}
    const support=this.world.supportAt(this.position.x,this.position.z,previousY+(wasGrounded?.38:.015));if(this.velocity.y<=0&&nextY<=support&&previousY>=support-(wasGrounded?.38:.015)){this.impact=wasGrounded?0:-this.velocity.y;this.position.y=support;this.velocity.y=0;this.grounded=true;this.landed=!wasGrounded;this.coyote=.12;}else{this.position.y=nextY;this.grounded=false;this.coyote-=dt;}if(this.position.y < -22)this.reset();
  }
}
