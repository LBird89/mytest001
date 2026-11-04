/* Small expression parser: no eval or dynamic JavaScript execution. */
(function(root){
const funcs={sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,log:Math.log,ln:Math.log,asin:Math.asin,acos:Math.acos,atan:Math.atan};
function compile(source,variables){
 if(source.length>300)throw Error('数式は300文字以内で入力してください。');
 const s=source.replace(/π/g,'pi').replace(/−/g,'-');let p=0;
 function ws(){while(/\s/.test(s[p]||'')&&p<s.length)p++;}
 function expr(min=0){ws();let left;
 const c=s[p];
 if(c==='+'||c==='-'){p++;const a=expr(3);left=v=>c==='-'?-a(v):a(v);}
 else if(c==='('){p++;left=expr();ws();if(s[p++]!==')')throw Error('閉じ括弧 ) が必要です。');}
 else {const number=s.slice(p).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);const name=s.slice(p).match(/^[a-zA-Z]+/);
 if(number){p+=number[0].length;const n=Number(number[0]);left=()=>n;}
 else if(name){const n=name[0].toLowerCase();p+=name[0].length;ws();if(funcs[n]){if(s[p++]!=='(')throw Error(n+' は括弧で引数を指定してください。');const a=expr();ws();if(s[p++]!==')')throw Error('閉じ括弧 ) が必要です。');left=v=>funcs[n](a(v));}else if(n==='pi'||n==='e'){left=()=>n==='pi'?Math.PI:Math.E;}else if(variables.includes(n)){left=v=>v[n];}else throw Error('使えない変数・関数です: '+n);}
 else throw Error('数式を確認してください。数値・変数・関数が必要です。');}
 while(true){ws();const op=s[p],prec={'+':1,'-':1,'*':2,'/':2,'^':4}[op];if(!prec||prec<min)break;p++;const a=left,b=expr(op==='^'?prec:prec+1);left=v=>op==='+'?a(v)+b(v):op==='-'?a(v)-b(v):op==='*'?a(v)*b(v):op==='/'?a(v)/b(v):a(v)**b(v);}
 return left;}
 const f=expr();ws();if(p!==s.length)throw Error('式の「'+s.slice(p)+'」を確認してください。掛け算には * を使います。');return f;
}
root.MathExpression={compile};if(typeof module!=='undefined')module.exports={compile};
})(typeof window!=='undefined'?window:globalThis);
