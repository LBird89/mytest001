const {test}=require('node:test');const assert=require('node:assert/strict');const {compile}=require('./math.js');
test('power precedence and associativity',()=>{assert.equal(compile('-x^2',['x'])({x:3}),-9);assert.equal(compile('2^3^2',[])({}),512);assert.equal(compile('2^-2',[])({}),.25);});
test('classroom formulas and constants',()=>{assert.ok(Math.abs(compile('sin(pi/2)+cos(0)',[])({})-2)<1e-12);assert.equal(compile('sqrt(4-x^2)',['x'])({x:0}),2);assert.equal(compile('(x^2-y^2)/4',['x','y'])({x:3,y:1}),2);assert.equal(compile('2*cos(t)',['t'])({t:0}),2);});
test('rejects executable code and malformed expressions',()=>{for(const s of ['alert(1)','window.location','x;1','2x','sin(x','', 'x+y'])assert.throws(()=>compile(s,['x']));});
test('domain errors remain observable',()=>{assert.ok(Number.isNaN(compile('sqrt(x)',['x'])({x:-1})));assert.equal(compile('1/x',['x'])({x:0}),Infinity);});
