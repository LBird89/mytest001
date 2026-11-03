'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let mode='revolution',model=null,angle=0,playing=false,yaw=-0.65,pitch=0.42,zoom=1,lastTime=0,dirty=true;
const presets={revolution:[['放物線','x^2',-1.5,1.5,'x'],['半球から球へ','sqrt(4-x^2)',-2,2,'x'],['波のうつわ','1+0.4*cos(3*x)',-2,2,'y']],surface:[['波の曲面','sin(x)*cos(y)',-3.14,3.14],['鞍型の曲面','(x^2-y^2)/4',-3,3],['放物面','(x^2+y^2)/4',-3,3]],curve:[['らせん','2*cos(t)','2*sin(t)','t/3',0,'6*pi'],['空間の波','t','sin(t)','cos(2*t)',-4,4],['結び目','(2+cos(3*t))*cos(2*t)','(2+cos(3*t))*sin(2*t)','sin(3*t)',0,'2*pi']]};
const values={revolution:['1+0.4*cos(3*x)',-2,2,'x'],surface:['sin(x)*cos(y)',-3.14,3.14],curve:['2*cos(t)','2*sin(t)','t/3',0,'6*pi']};
function input(id,value){const el=document.createElement('input');el.id=id;el.value=value;el.autocomplete='off';el.spellcheck=false;el.setAttribute('aria-label',id);return el;}
function fields(){
 $('equations').replaceChildren();const v=values[mode];
 (mode==='curve'?['x(t) =','y(t) =','z(t) =']:[mode==='surface'?'z =':'y =']).forEach((label,i)=>{const row=document.createElement('div');row.className='equation';row.style.marginBottom='8px';const span=document.createElement('span');span.textContent=label;const el=input('eq'+i,v[i]);el.setAttribute('aria-label',label+' の数式');row.append(span,el);$('equations').append(row);});
 $('ranges').replaceChildren();const n=mode==='curve'?3:1;
 function range(name,a,b,id){const label=document.createElement('label');label.textContent=name;label.htmlFor=id+'min';const row=document.createElement('div');row.className='range-pair';const from=input(id+'min',a),to=input(id+'max',b),sep=document.createElement('span');from.setAttribute('aria-label',name+' 下限');to.setAttribute('aria-label',name+' 上限');sep.textContent='〜';row.append(from,sep,to);$('ranges').append(label,row);}
 range(mode==='curve'?'t の範囲':'x の範囲',v[n],v[n+1],'a');if(mode==='surface')range('y の範囲',v[n],v[n+1],'b');
 $('axisWrap').hidden=mode!=='revolution';if(mode==='revolution')$('axis').value=v[3];
 $('formulaHint').textContent=mode==='curve'?'変数 t を使って、空間の座標を指定します。':mode==='surface'?'変数 x, y を使って、高さ z を指定します。':'変数 x を使って、回転させる曲線を指定します。';
 $('sectionLabel').textContent=mode==='curve'?'媒介変数の数式':mode==='surface'?'曲面の数式':'回転させる曲線';
 $('presets').replaceChildren();presets[mode].forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=p[0];b.onclick=()=>{values[mode]=p.slice(1);fields();build();};$('presets').append(b);});
}
function build({keepAngle=false}={}){try{
 const n=mode==='curve'?3:1,expressions=Array.from({length:n},(_,i)=>$('eq'+i).value.trim());const f=expressions.map(s=>MathExpression.compile(s,mode==='curve'?['t']:mode==='surface'?['x','y']:['x']));
 const read=id=>{const v=MathExpression.compile($(id).value,[])({});if(!Number.isFinite(v)||Math.abs(v)>10000)throw Error('範囲は −10000〜10000 の有限な数値で指定してください。');return v;};
 const lo=read('amin'),hi=read('amax'),blo=mode==='surface'?read('bmin'):0,bhi=mode==='surface'?read('bmax'):0;
 if(lo>=hi||(mode==='surface'&&blo>=bhi))throw Error('範囲の下限は上限より小さくしてください。');
 const axis=$('axis').value,points=[],N=mode==='curve'?500:mode==='surface'?48:110;
 let invalid=0;
 for(let i=0;i<=N;i++){const t=lo+(hi-lo)*i/N;
 if(mode==='surface'){const row=[];for(let j=0;j<=N;j++){const y=blo+(bhi-blo)*j/N,z=f[0]({x:t,y});if(!Number.isFinite(z)||Math.abs(z)>1e6)invalid++;row.push([t,y,z]);}points.push(row);}
 else {const p=mode==='curve'?f.map(fn=>fn({t})):[t,f[0]({x:t}),0];if(p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))invalid++;points.push(p);}}
 if(invalid)throw Error('指定範囲に定義できない値や大きすぎる値があります。式や範囲を調整してください。');
 let all=mode==='surface'?points.flat():points,bounds=[0,1,2].map(k=>[Math.min(...all.map(p=>p[k])),Math.max(...all.map(p=>p[k]))]);
 if(mode==='revolution'){const k=axis==='x'?1:0,r=Math.max(...points.map(p=>Math.abs(p[k])));bounds[k]=[-r,r];bounds[2]=[-r,r];}
 const center=bounds.map(b=>(b[0]+b[1])/2),extent=Math.max(1,...bounds.map(b=>b[1]-b[0]));
 model={mode,points,center,extent,axis,expressions};values[mode]=[...expressions,$('amin').value,$('amax').value,...(mode==='revolution'?[axis]:[])];
 angle=mode==='revolution'?(keepAngle?angle:0):360;playing=false;sync();
 $('error').textContent='';$('formulaDisplay').textContent=mode==='curve'?'( '+expressions.join(', ')+' )':(mode==='surface'?'z = ':'y = ')+expressions[0];
 $('animation').hidden=mode!=='revolution';$('angleBadge').hidden=mode!=='revolution';$('viewTitle').textContent={revolution:'回転体のシミュレーション',surface:'曲面のグラフ',curve:'3次元曲線のグラフ'}[mode];
 const legend=document.querySelector('.legend');legend.children[0].lastChild.textContent=mode==='surface'?'数式の曲面':'数式の曲線';legend.children[1].hidden=mode!=='revolution';
 $('insightTitle').textContent=mode==='revolution'?'曲線が動くと、曲面が生まれる。':mode==='surface'?'2つの変数から、ひとつの曲面へ。':'3つの座標が描く、空間の軌跡。';
 $('insightText').textContent=mode==='revolution'?'回転角度を動かして、平面の曲線が立体に変わる過程を観察してみましょう。表示するのは回転体の側面です。端面は省略しています。':mode==='surface'?'視点を回して、x と y の変化が高さ z にどう現れるか観察してみましょう。':'t の値に応じて変わる座標を結んだ曲線です。視点を回して、奥行きを確かめましょう。';dirty=true;
 }catch(e){$('error').textContent=e.message;}}
function sync(){$('progress').value=angle;$('angleBadge').textContent='θ = '+Math.round(angle)+'°';$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'アニメーションを一時停止':'アニメーションを再生');dirty=true;}
function project(p){const m=model,s=Math.min(canvas.clientWidth,canvas.clientHeight)*0.69/m.extent*zoom;const a=p.map((v,i)=>v-m.center[i]);const x=a[0]*Math.cos(yaw)-a[2]*Math.sin(yaw),z=a[0]*Math.sin(yaw)+a[2]*Math.cos(yaw),y=a[1]*Math.cos(pitch)-z*Math.sin(pitch);return [canvas.clientWidth/2+x*s,canvas.clientHeight/2-y*s,z*Math.cos(pitch)+a[1]*Math.sin(pitch)];}
function line(points,color,width=1){if(points.length<2)return;ctx.beginPath();points.forEach((p,i)=>{const q=project(p);if(i===0)ctx.moveTo(q[0],q[1]);else ctx.lineTo(q[0],q[1]);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function rotate(p,t){return model.axis==='x'?[p[0],p[1]*Math.cos(t),p[1]*Math.sin(t)]:[p[0]*Math.cos(t),p[1],p[0]*Math.sin(t)];}
function render(){if(!model)return;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const e=model.extent*.7,step=10**Math.floor(Math.log10(e/4)),grid=step*(e/step>15?5:e/step>8?2:1),r=Math.ceil(e/grid)*grid;
 for(let i=-r;i<=r+grid/2;i+=grid){line([[-r,0,i],[r,0,i]],'#9aaa8b25');line([[i,0,-r],[i,0,r]],'#9aaa8b25');}
 [[r,0,0],[0,r,0],[0,0,r]].forEach((p,i)=>{const neg=p.map(x=>-x);line([neg,p],['#c38a8b99','#88a47a99','#9d8ab699'][i]);const q=project(p);ctx.fillStyle=['#b78183','#7e9971','#9680b1'][i];ctx.font='italic 14px Georgia';ctx.fillText(['x','y','z'][i],q[0]+5,q[1]-5);});
 if(model.mode==='curve')line(model.points,'#4a9990',2.5);
 else {let rows;
 if(model.mode==='surface')rows=model.points;
 else {const a=angle*Math.PI/180,segments=Math.max(1,Math.ceil(angle/5));rows=Array.from({length:segments+1},(_,j)=>model.points.map(p=>rotate(p,a*j/segments)));}
 const faces=[];
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<rows[j].length-1;i++){const p=[rows[j][i],rows[j][i+1],rows[j+1][i+1],rows[j+1][i]].map(project);faces.push({p,z:p.reduce((s,q)=>s+q[2],0)/4});}
 faces.sort((a,b)=>a.z-b.z);faces.forEach(({p})=>{ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle=model.mode==='surface'?'#72a59955':'#9c8bc040';ctx.fill();});
 for(let j=0;j<rows.length;j+=(model.mode==='surface'?3:2))line(rows[j],model.mode==='surface'?'#58948880':'#8b79af65',.8);
 const count=rows[0].length;for(let i=0;i<count;i+=(model.mode==='surface'?3:5))line(rows.map(row=>row[i]),model.mode==='surface'?'#58948880':'#8b79af65',.8);
 if(model.mode==='revolution'){line(model.points,'#3f9991',2.5);line(rows[rows.length-1],'#8064af',2);}}
}
let previewTimer;
function cancelPreview(){clearTimeout(previewTimer);}
function updatePreview(){cancelPreview();build({keepAngle:true});}
// Delegate to the form because the equation/range inputs are rebuilt on tab changes.
$('form').addEventListener('input',e=>{
 if(e.target.tagName!=='INPUT')return;
 cancelPreview();previewTimer=setTimeout(updatePreview,250);
});
$('form').addEventListener('change',updatePreview);
$('form').onsubmit=e=>{e.preventDefault();cancelPreview();build({keepAngle:true});};document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{cancelPreview();mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(t=>t.setAttribute('aria-selected',t===b));fields();build();});
$('play').onclick=()=>{if(angle>=360)angle=0;playing=!playing;sync();};$('restart').onclick=()=>{angle=0;playing=false;sync();};$('progress').oninput=()=>{angle=Number($('progress').value);playing=false;sync();};$('resetView').onclick=()=>{yaw=-.65;pitch=.42;zoom=1;dirty=true;};
let drag=null;canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';};canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.008;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY];dirty=true;};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;canvas.style.cursor='grab';};canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.3,Math.min(4,zoom*Math.exp(-e.deltaY*.001)));dirty=true;},{passive:false});new ResizeObserver(()=>dirty=true).observe(canvas);
$('download').onclick=()=>{render();const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const c=out.getContext('2d');c.fillStyle='#eff2e9';c.fillRect(0,0,out.width,out.height);c.drawImage(canvas,0,0);c.fillStyle='#53624d';c.font=`${16*(devicePixelRatio||1)}px sans-serif`;c.fillText($('formulaDisplay').textContent,24,35*(devicePixelRatio||1));out.toBlob(blob=>{const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='katachi-lab.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
function tick(t){const dt=Math.min((t-lastTime)/1000,.1);lastTime=t;if(playing){angle=Math.min(360,angle+dt*45*Number($('speed').value));if(angle>=360)playing=false;sync();}if(dirty){render();dirty=false;}requestAnimationFrame(tick);}
fields();build();angle=240;sync();requestAnimationFrame(tick);
