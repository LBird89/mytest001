(function(root){
'use strict';
function logGamma(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);z--;let x=.9999999999998099;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function gammaP(a,x){if(x<=0)return 0;const scale=Math.exp(-x+a*Math.log(x)-logGamma(a));if(x<a+1){let d=1/a,s=d;for(let n=1;n<1000;n++){d*=x/(a+n);s+=d;if(Math.abs(d)<Math.abs(s)*1e-14)break;}return Math.min(1,s*scale);}let b=x+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<1000;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const q=d*c;h*=q;if(Math.abs(q-1)<1e-14)break;}return Math.max(0,1-scale*h);}
function betaFraction(a,b,x){let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<1e-300)d=1e-300;d=1/d;let h=d;for(let m=1;m<1000;m++){let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const q=d*c;h*=q;if(Math.abs(q-1)<1e-14)break;}return h;}
function betaI(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?bt*betaFraction(a,b,x)/a:1-bt*betaFraction(b,a,1-x)/b;}
function normalCDF(x){if(x===0)return .5;return .5+(x>0?.5:-.5)*gammaP(.5,x*x/2);}
const normalPDF=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
function tCDF(x,df){if(x===0)return .5;const p=.5*betaI(df/(df+x*x),df/2,.5);return x>0?1-p:p;}
function tPDF(x,df){return Math.exp(logGamma((df+1)/2)-logGamma(df/2)) / Math.sqrt(df*Math.PI)*(1+x*x/df)**(-(df+1)/2);}
function chiPDF(x,df){if(x<=0)return df===2?.5:0;return Math.exp((df/2-1)*Math.log(x)-x/2-df/2*Math.log(2)-logGamma(df/2));}
function quantile(cdf,p){let a=-1,b=1;while(cdf(a)>p)a*=2;while(cdf(b)<p)b*=2;for(let i=0;i<90;i++){const m=(a+b)/2;if(cdf(m)<p)a=m;else b=m;}return (a+b)/2;}
function binomial(n,p){return Array.from({length:n+1},(_,k)=>p===0?+(k===0):p===1?+(k===n):Math.exp(logGamma(n+1)-logGamma(k+1)-logGamma(n-k+1)+k*Math.log(p)+(n-k)*Math.log1p(-p)));}
function binomialTest(n,p,k,tail){const probs=binomial(n,p);const extreme=probs.map((v,j)=>tail==='greater'?j>=k:tail==='less'?j<=k:v<=probs[k]*(1+1e-10));return {probs,extreme,p:Math.min(1,probs.reduce((s,v,j)=>s+(extreme[j]?v:0),0))};}
function summary(a){if(a.length<2||a.some(x=>!Number.isFinite(x)))throw Error('各標本に有限な数値を2個以上入力してください。');const mean=a.reduce((s,v)=>s+v,0)/a.length,variance=a.reduce((s,v)=>s+(v-mean)**2,0)/(a.length-1);return {n:a.length,mean,variance};}
function tTest(a,b,type,mu=0,tail='two'){const A=summary(a);let diff,se,df;
 if(type==='paired'){if(a.length!==b.length)throw Error('対応ありでは、2列のデータ数をそろえてください。');const D=summary(a.map((v,i)=>v-b[i]));diff=D.mean;se=Math.sqrt(D.variance/D.n);df=D.n-1;}
 else if(type==='welch'){const B=summary(b),v=A.variance/A.n,w=B.variance/B.n;diff=A.mean-B.mean;se=Math.sqrt(v+w);df=(v+w)**2/(v*v/(A.n-1)+w*w/(B.n-1));}
 else{diff=A.mean-mu;se=Math.sqrt(A.variance/A.n);df=A.n-1;}
 if(!(se>0)||!Number.isFinite(df))throw Error('標準誤差が0です。ばらつきのあるデータを入力してください。');const t=diff/se,p=tail==='greater'?1-tCDF(t,df):tail==='less'?tCDF(t,df):2*(1-tCDF(Math.abs(t),df));return {diff,se,df,t,p:Math.max(0,Math.min(1,p))};}
function chiTest(table){const rows=table.length,cols=table[0].length;if(rows<2||cols<2||table.some(r=>r.length!==cols||r.some(v=>!Number.isInteger(v)||v<0)))throw Error('2×2以上の表に、0以上の整数を入力してください。');const rt=table.map(r=>r.reduce((s,v)=>s+v,0)),ct=Array.from({length:cols},(_,j)=>table.reduce((s,r)=>s+r[j],0)),total=rt.reduce((s,v)=>s+v,0);if(rt.includes(0)||ct.includes(0))throw Error('合計が0の行・列は使えません。');const expected=rt.map(r=>ct.map(c=>r*c/total)),contrib=table.map((r,i)=>r.map((v,j)=>(v-expected[i][j])**2/expected[i][j])),stat=contrib.flat().reduce((s,v)=>s+v,0),df=(rows-1)*(cols-1);return {expected,contrib,stat,df,p:Math.max(0,1-gammaP(df/2,stat/2)),small:expected.flat().some(v=>v<5)};}
function rng(seed){let x=seed>>>0;return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function randomNormal(r){return Math.sqrt(-2*Math.log(Math.max(1e-15,r())))*Math.cos(2*Math.PI*r());}
const api={logGamma,normalCDF,normalPDF,tCDF,tPDF,chiPDF,quantile,binomial,binomialTest,summary,tTest,chiTest,rng,randomNormal};root.Stats=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
