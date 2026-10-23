'use strict';
// FP34C: authenticated tasks, search/filter + export helpers, domain AI (deterministic fallback).
const express = require('express');
const {authenticateToken}=require('../middleware/auth');
let callProvider=null; try{ const s=require('../services/openrouter'); callProvider=async(p)=>{ const r=await s.callOpenRouter('You are an analyst. Return labelled sections.',p); return r&&(r.content||r); }; }catch{}

function providerKey(){return process.env.OPENROUTER_API_KEY||process.env.OPENAI_API_KEY||'';}
function recordsFrom(body){
  if(Array.isArray(body)) return body;
  if(body&&Array.isArray(body.records)) return body.records;
  if(body&&Array.isArray(body.items)) return body.items;
  if(body&&Array.isArray(body.data)) return body.data;
  if(body&&typeof body==='object'&&Object.keys(body).length) return [body];
  return [];
}
function filterRecords(records,query={}){
  const q=String(query.q||query.search||'').trim().toLowerCase();
  return (records||[]).filter(r=>{
    if(q && !JSON.stringify(r).toLowerCase().includes(q)) return false;
    for(const k of ['status','priority','category','severity','type','season','style']){
      if(query[k]!==undefined && query[k]!=='' && String(r[k]??'')!==String(query[k])) return false;
    }
    return true;
  });
}
function toCSV(records){
  const rows=records||[];
  if(!rows.length) return '';
  const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];
  const esc=v=>{ if(v===null||v===undefined) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  return [headers.join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n');
}
function sendExport(res,records,format,filename='export'){
  const fmt=String(format||'json').toLowerCase();
  if(fmt==='csv'){ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition',`attachment; filename="${filename}.csv"`); return res.send(toCSV(records)); }
  res.setHeader('Content-Disposition',`attachment; filename="${filename}.json"`); return res.json(records);
}
function envelope(feature,sections,providerText){
  if(providerText) return {feature,aiGenerated:true,label:'Provider-generated',sections:{...sections,provider:{text:String(providerText)}}};
  return {feature,aiGenerated:false,label:providerKey()?'Deterministic fallback (provider unavailable)':'Deterministic fallback (no provider key configured)',sections};
}
async function maybeProvider(feature,records,fallbackSections){
  if(!providerKey()||typeof callProvider!=='function') return envelope(feature,fallbackSections);
  try{
    const prompt=`Feature ${feature}. Analyse these records and return concise labelled sections:\n${JSON.stringify(records).slice(0,4000)}`;
    const out=await Promise.race([callProvider(prompt),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),4000))]);
    const text=typeof out==='string'?out:(out&&(out.content||out.result||out.text))||'';
    if(!text) return envelope(feature,fallbackSections);
    return envelope(feature,fallbackSections,text);
  }catch{ return envelope(feature,fallbackSections); }
}

function ai1(records){ const by={}; for(const r of records){ const s=r.severity||'unknown'; by[s]=(by[s]||0)+1; } return {'Severity counts':by,'Total incidents':records.length,'High severity':records.filter(r=>/high|critical/i.test(String(r.severity||'')))}; }
function ai2(records){ const by={}; for(const r of records){ const l=r.location||r.zone||r.area||'unknown'; by[l]=(by[l]||0)+1; } const hot=Object.entries(by).filter(([,n])=>n>1).map(([location,count])=>({location,count})); return {'Location hotspots':hot,'Location counts':by}; }
function ai3(records){ const open=records.filter(r=>/open|pending|overdue/i.test(String(r.status||'open'))); return {'Open actions':open,'Open count':open.length,'Closed count':records.length-open.length}; }


// --- Tasks (in-memory per authenticated user; no DB migration) ---
const tasks=[]; let seq=1;
function ownerOf(req){return String(req.user&&(req.user.id||req.user.userId||req.user.email)||'user');}
const tasksRouter=express.Router();
tasksRouter.use(authenticateToken);
tasksRouter.get('/',(req,res)=>{ const mine=tasks.filter(t=>t.owner===ownerOf(req)); res.json({data:filterRecords(mine,req.query),total:mine.length}); });
tasksRouter.post('/',(req,res)=>{
  const b=req.body||{}; if(b.title===undefined||b.title===null||String(b.title).trim()==='') return res.status(400).json({error:'title is required'});
  const t={id:seq++,owner:ownerOf(req),title:b.title,description:b.description??'',status:b.status??'todo',priority:b.priority??'medium',done:b.done??false,estimate:b.estimate??0,dueDate:b.dueDate??null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  tasks.push(t); res.status(201).json(t);
});
tasksRouter.put('/:id',updateTask); tasksRouter.patch('/:id',updateTask);
function updateTask(req,res){
  const t=tasks.find(x=>x.id===Number(req.params.id)&&x.owner===ownerOf(req)); if(!t) return res.status(404).json({error:'Task not found'});
  const b=req.body||{}; for(const k of ['title','description','status','priority','done','estimate','dueDate']) if(Object.prototype.hasOwnProperty.call(b,k)) t[k]=b[k];
  t.updatedAt=new Date().toISOString(); res.json(t);
}

const router=express.Router();
router.use(authenticateToken);
router.post('/ai/incident-severity-summary',async(req,res)=>{ const recs=recordsFrom(req.body); res.json(await maybeProvider('incident-severity-summary',recs,ai1(recs))); });
router.post('/ai/location-hotspots',async(req,res)=>{ const recs=recordsFrom(req.body); res.json(await maybeProvider('location-hotspots',recs,ai2(recs))); });
router.post('/ai/overdue-actions',async(req,res)=>{ const recs=recordsFrom(req.body); res.json(await maybeProvider('overdue-actions',recs,ai3(recs))); });
router.get('/export',(req,res)=>{ const recs=filterRecords(recordsFrom(req.query.records?JSON.parse(req.query.records):[]),req.query); return sendExport(res,recs,req.query.format,'records'); });

module.exports={router,tasksRouter,filterRecords,toCSV,sendExport,recordsFrom,envelope,severitySummary:ai1, hotspots:ai2, openActions:ai3,_tasks:tasks};
