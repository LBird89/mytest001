/* Geometry for rotation around a line in the xy plane. */
(function(root){
function axis(kind,a=0,b=0){
 if(kind==='y')return {origin:[0,0,0],direction:[0,-1,0]};
 if(kind==='x')return {origin:[0,0,0],direction:[1,0,0]};
 const n=Math.hypot(1,a);return {origin:[0,b,0],direction:[1/n,a/n,0]};
}
function foot(p,axis){const u=axis.direction,o=axis.origin,d=p.reduce((s,v,i)=>s+(v-o[i])*u[i],0);return o.map((v,i)=>v+d*u[i]);}
function rotate(p,t,axis){const q=foot(p,axis),r=p.map((v,i)=>v-q[i]),u=axis.direction,c=Math.cos(t),s=Math.sin(t),cross=[u[1]*r[2]-u[2]*r[1],u[2]*r[0]-u[0]*r[2],u[0]*r[1]-u[1]*r[0]];return q.map((v,i)=>v+r[i]*c+cross[i]*s);}
function bounds(points,axis){const b=Array.from({length:3},()=>[Infinity,-Infinity]);for(const p of points){const q=foot(p,axis),r=Math.hypot(...p.map((v,i)=>v-q[i]));for(let i=0;i<3;i++){const d=r*Math.sqrt(Math.max(0,1-axis.direction[i]**2));b[i][0]=Math.min(b[i][0],q[i]-d);b[i][1]=Math.max(b[i][1],q[i]+d);}}return b;}
const api={axis,foot,rotate,bounds};root.RotationGeometry=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
