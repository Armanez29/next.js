module.exports=(()=>{"use strict";var e={305:()=>{let e;function handle(r){let t=r.idx,n=r.child,o=r.method,i=r.args,s=function(){let e=Array.prototype.slice.call(arguments);if(e[0]instanceof Error){let r=e[0];e[0]={$error:"$error",type:r.constructor.name,message:r.message,stack:r.stack};Object.keys(r).forEach(function(t){e[0][t]=r[t]})}process.send({owner:"farm",idx:t,child:n,args:e})},a;if(o==null&&typeof e=="function")a=e;else if(typeof e[o]=="function")a=e[o];if(!a)return console.error("NO SUCH METHOD:",o);a.apply(null,i.concat([s]))}process.on("message",function(r){if(r.owner!=="farm"){return}if(!e)return e=require(r.module);if(r.event=="die")return process.exit(0);handle(r)})}};var r={};function __nccwpck_require__(t){if(r[t]){return r[t].exports}var n=r[t]={exports:{}};var o=true;try{e[t](n,n.exports,__nccwpck_require__);o=false}finally{if(o)delete r[t]}return n.exports}__nccwpck_require__.ab=__dirname+"/";return __nccwpck_require__(305)})();