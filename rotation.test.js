const {test}=require('node:test'),assert=require('node:assert/strict'),g=require('./v2/rotation');
const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-9,`${a} != ${b}`));
test('known oblique half turn around y=x',()=>{const a=g.axis('line',1,0);near(g.foot([1,0,0],a),[.5,.5,0]);near(g.rotate([1,0,0],Math.PI,a),[0,1,0]);});
test('translated axis: foot, radius, fixed axis and full turn',()=>{const a=g.axis('line',2,3),p=[2,-1,0],h=g.foot(p,a),r=Math.hypot(...p.map((v,i)=>v-h[i]));near(g.rotate(h,1,a),h);near(g.rotate(p,Math.PI*2,a),p);for(const t of [.2,1,3]){const v=g.rotate(p,t,a);near(g.foot(v,a),h);assert.ok(Math.abs(Math.hypot(...v.map((x,i)=>x-h[i]))-r)<1e-9);}});
test('coordinate axes retain previous behavior',()=>{near(g.rotate([2,3,0],Math.PI/2,g.axis('x')),[2,0,3]);near(g.rotate([2,3,0],Math.PI/2,g.axis('y')),[0,3,2]);});
test('analytic bounds contain full rotation',()=>{const a=g.axis('line',-2,1),points=[[0,0,0],[1,3,0]],b=g.bounds(points,a);for(const p of points)for(let t=0;t<7;t+=.1)g.rotate(p,t,a).forEach((v,i)=>assert.ok(v>=b[i][0]-1e-9&&v<=b[i][1]+1e-9));});
