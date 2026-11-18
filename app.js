(function terraformQuizApp(){
  "use strict";
  const TOPICS=window.TF_TOPICS||[];
  const QUESTIONS=window.TF_QUESTIONS||[];
  const index=new Map(QUESTIONS.map(q=>[q.id,q]));
  const root=document.getElementById("view-root");
  const store={
    get(key,fallback){try{const raw=localStorage.getItem("tf004:"+key);return raw?JSON.parse(raw):fallback}catch{return fallback}},
    set(key,value){try{localStorage.setItem("tf004:"+key,JSON.stringify(value))}catch{}},
    del(key){try{localStorage.removeItem("tf004:"+key)}catch{}}
  };
  let history=store.get("history",[]);
  let bookmarks=new Set(store.get("bookmarks",[]));
  let session=store.get("session",null);
  if(session&&(!Array.isArray(session.ids)||session.ids.some(id=>!index.has(id))))session=null;
  let view=session?"quiz":"dashboard";
  let search="";
  let filterTopic="all";
  let filterDifficulty="all";
  let bookmarkFilter=false;
  let showAllReview=false;
  let toastTimer;
  document.body.dataset.theme=store.get("theme","dark");

  const esc=(value)=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const shuffled=(arr)=>{const copy=[...arr];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
  const topic=(id)=>TOPICS.find(t=>t.id===id)||TOPICS[0];
  const pct=(n,total)=>total?Math.round(n/total*100):0;
  const passed=(q,answer)=>Array.isArray(answer)&&answer.length===q.correct.length&&[...answer].sort().every((v,i)=>v===[...q.correct].sort()[i]);
  const formatTime=(seconds)=>{const s=Math.max(0,Math.floor(seconds));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")};
  const timeRemaining=()=>session?.deadline?Math.max(0,Math.ceil((session.deadline-Date.now())/1000)):Math.floor((Date.now()-(session?.startedAt||Date.now()))/1000);
  const saveSession=()=>session?store.set("session",session):store.del("session");
  const latestMap=()=>{const map=new Map();for(const run of history){for(const [id,record] of Object.entries(run.details||{})){if(!map.has(id))map.set(id,record)}}return map};
  const getStats=()=>{
    const status=latestMap(),values=[...status.values()];
    return {seen:status.size,correct:values.filter(v=>v.correct).length,accuracy:pct(values.filter(v=>v.correct).length,values.length),attempts:history.length,
      best:history.length?Math.max(...history.map(h=>pct(h.correct,h.total))):null};
  };
  const topicStats=(id)=>{const map=latestMap();const qs=QUESTIONS.filter(q=>q.topic===id);const tried=qs.filter(q=>map.has(q.id));return {total:qs.length,seen:tried.length,right:tried.filter(q=>map.get(q.id).correct).length,accuracy:pct(tried.filter(q=>map.get(q.id).correct).length,tried.length)}};
  function toast(message){
    const el=document.getElementById("toast");clearTimeout(toastTimer);
    el.textContent=message;el.classList.add("visible");toastTimer=setTimeout(()=>el.classList.remove("visible"),3200);
  }
  function setView(next){
    view=next;render();window.scrollTo({top:0,behavior:"smooth"});
  }
  function sidebar(){
    const s=getStats();
    document.getElementById("sidebar-stats").innerHTML=
      '<div class="stat-line"><span>Questions covered</span><strong>'+s.seen+' / '+QUESTIONS.length+'</strong></div>'+
      '<div class="small-progress"><span style="width:'+pct(s.seen,QUESTIONS.length)+'%"></span></div>'+
      '<div class="mini-caption">'+s.accuracy+'% accuracy on your latest answers</div>';
    document.getElementById("sidebar-domains").innerHTML=TOPICS.map(t=>
      '<button class="sidebar-domain" data-action="topic" data-topic="'+t.id+'"><span class="side-domain-num">'+t.objective+'</span><span>'+esc(t.short)+'</span></button>'
    ).join("");
    document.querySelectorAll(".main-nav .nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    document.getElementById("page-title").textContent=({"dashboard":"OVERVIEW","quiz":"PRACTICE SESSION","results":"RESULTS","library":"QUESTION BANK","guide":"EXAM GUIDE"})[view]||"OVERVIEW";
    document.getElementById("theme-toggle").textContent=document.body.dataset.theme==="light"?"☾":"☼";
  }
  function dashboard(){
    const stats=getStats();
    const weakest=TOPICS.map(t=>({t,s:topicStats(t.id)})).filter(x=>x.s.seen>0).sort((a,b)=>a.s.accuracy-b.s.accuracy).slice(0,3);
    const quick=[["quick","Quick practice","10 random questions. Instant feedback on every answer.","10 QUESTIONS","↗","◈"],
      ["standard","Deep dive","25 questions covering all eight Terraform objectives.","25 QUESTIONS","↗","⌘"],
      ["mock","Full mock exam","60 questions, 60-minute timer, exam-style review at the end.","60 MINUTES","↗","◷"]];
    return `
      <section class="hero">
        <div class="hero-content">
          <div class="hero-kicker">✦ &nbsp; YOUR CERTIFICATION STARTS HERE <span style="color:#6b688a">/</span> 2026 EDITION</div>
          <h1>Master Terraform.<br><em>Own the exam.</em></h1>
          <p>Master every objective of the HashiCorp Terraform Associate 004 exam with realistic practice, detailed explanations and progress that actually sticks.</p>
          <div class="hero-buttons">
            <button class="btn btn-primary" data-action="${session?"resume":"start"}" ${session?'':'data-mode="quick"'}>${session?"↻ Resume session":"▶ Start practicing"} <span>→</span></button>
            <button class="btn btn-outline-light" data-action="start" data-mode="mock">◷ &nbsp; Take mock exam</button>
          </div>
        </div>
        <div class="hero-graphic" aria-hidden="true"><div class="orbit"></div><div class="hero-number">004</div><div class="float-code"><b>terraform</b> {<br>&nbsp;&nbsp;required_version = "~&gt; 1.12"<br>}</div></div>
      </section>
      <div class="stats-grid">
        ${statCard("Questions available",QUESTIONS.length,"Across 8 official domains","⌘")}
        ${statCard("Questions covered",stats.seen,"Of "+QUESTIONS.length+" in the bank","◈")}
        ${statCard("Your accuracy",stats.seen?stats.accuracy+"%":"—","Based on latest answers","◎")}
        ${statCard("Practice sessions",stats.attempts,"Best score "+(stats.best===null?"—":stats.best+"%"),"↗")}
      </div>
      <div class="section-heading"><div><span class="eyebrow"><span class="line"></span> YOUR LEARNING PATH</span><h2>Explore the exam domains</h2><p>Choose a topic to sharpen your knowledge.</p></div><button class="text-link" data-view="guide">Exam objectives ↗</button></div>
      <div class="domain-grid">${TOPICS.map(domainCard).join("")}</div>
      <div class="section-heading"><div><span class="eyebrow"><span class="line"></span> TRAINING MODES</span><h2>Ready to put it to the test?</h2><p>Practice your way, from quick revision to full exam simulation.</p></div></div>
      <div class="launch-grid">${quick.map((x,i)=>`<button class="launch-card ${i===2?"featured":""}" data-action="start" data-mode="${x[0]}"><span class="launch-icon">${x[5]}</span><strong>${x[1]}</strong><small>${x[2]}</small><span class="launch-foot"><span>${x[3]}</span><span>${x[4]}</span></span></button>`).join("")}</div>
      <div class="bottom-panels">
        <div class="panel"><h3>${weakest.length?"Areas to revisit":"Your study plan"}</h3>${weakest.length?
          weakest.map(x=>`<div class="focus-line"><span class="focus-badge">${x.t.objective}</span><div class="focus-copy"><strong>${esc(x.t.name)}</strong><small>${x.s.seen} of ${x.s.total} questions attempted</small></div><span class="focus-right">${x.s.accuracy}% accuracy</span><button class="small-button" data-action="topic" data-topic="${x.t.id}">Practice</button></div>`).join(""):
          '<p class="tip"><strong>Start with a quick practice round.</strong> Then work through each of the eight domains. When you feel ready, try the 60-minute mock exam and revisit the questions you missed.</p>'}
          <button class="text-link" data-action="start" data-mode="missed">↗ Practice missed questions</button>
        </div>
        <div class="panel"><h3>Exam quick facts</h3><p class="tip"><strong>Terraform Associate (004)</strong><br>Official version: Terraform 1.12<br>Assessment: 60 minutes, online proctored<br>Formats: multiple choice, multiple answer and true/false practice.<br><br><strong>New in 004:</strong> dependency lifecycle, custom conditions, ephemeral values, and HCP workspace/project organisation.</p><a class="tip-link" href="https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004" target="_blank" rel="noopener noreferrer">Read the official exam outline ↗</a></div>
      </div>`;
  }
  function statCard(label,num,note,icon){
    return '<div class="stat-card"><div class="stat-label">'+label+'</div><div class="stat-number">'+num+'</div><div class="stat-note">'+note+'</div><span class="stat-icon">'+icon+'</span></div>';
  }
  function domainCard(t){
    const s=topicStats(t.id);
    return `<button class="domain-card" data-action="topic" data-topic="${t.id}" style="--domain:${t.color}"><span class="domain-number">DOMAIN ${t.objective} / 08</span><h3>${esc(t.name)}</h3><p>${esc(t.short)}</p><div class="domain-foot"><span>${s.seen} / ${s.total} explored</span><b>${s.seen?s.accuracy+"% accuracy":"START →"}</b></div><div class="domain-bar"><span style="width:${pct(s.seen,s.total)}%"></span></div></button>`;
  }
  function buildPool(mode,chosenTopic,explicitIds){
    if(explicitIds)return explicitIds.filter(id=>index.has(id));
    if(mode==="single")return [];
    if(mode==="topic")return shuffled(QUESTIONS.filter(q=>q.topic===chosenTopic)).map(q=>q.id);
    if(mode==="bookmarked")return shuffled(QUESTIONS.filter(q=>bookmarks.has(q.id))).map(q=>q.id);
    if(mode==="missed"){const map=latestMap();return shuffled(QUESTIONS.filter(q=>map.has(q.id)&&!map.get(q.id).correct)).map(q=>q.id)}
    if(mode==="mock"){
      const chosen=TOPICS.flatMap(t=>shuffled(QUESTIONS.filter(q=>q.topic===t.id)).slice(0,7));
      const extra=shuffled(QUESTIONS.filter(q=>!chosen.includes(q))).slice(0,4);
      return shuffled([...chosen,...extra]).map(q=>q.id);
    }
    return shuffled(QUESTIONS).slice(0,mode==="standard"?25:10).map(q=>q.id);
  }
  function start(mode,chosenTopic,ids){
    if(session&&!window.confirm("Start a new session? Your current unfinished session will be replaced."))return;
    const pool=buildPool(mode,chosenTopic,ids);
    if(!pool.length){toast(mode==="bookmarked"?"Bookmark a question first.":"No missed questions yet. Try a practice session first.");return}
    session={mode,topic:chosenTopic||null,ids:pool,answers:{},checked:{},flags:[],current:0,startedAt:Date.now(),deadline:mode==="mock"?Date.now()+3600000:null};
    saveSession();setView("quiz");
  }
  function currentQuestion(){return session?index.get(session.ids[session.current]):null}
  function choiceHTML(q,i,selected,checked,review){
    const good=checked&&q.correct.includes(i),bad=checked&&selected.includes(i)&&!q.correct.includes(i);
    const classes=["choice",selected.includes(i)?"selected":"",good?"correct":"",bad?"wrong":""].filter(Boolean).join(" ");
    return `<button class="${classes}" data-action="choice" data-choice="${i}" ${checked||review?"disabled":""} aria-pressed="${selected.includes(i)}"><span class="choice-letter">${String.fromCharCode(65+i)}</span><span>${esc(q.options[i])}</span>${good?'<span class="choice-check">✓</span>':""}</button>`;
  }
  function quiz(){
    if(!session)return '<div class="empty-state"><h3>No active session</h3><p>Start a practice session from your dashboard.</p><button class="btn btn-primary" data-view="dashboard">Go to overview</button></div>';
    const q=currentQuestion(),position=session.current,total=session.ids.length,selection=session.answers[q.id]||[];
    const checked=!!session.checked[q.id],isMock=session.mode==="mock",isLast=position===total-1;
    const correct=passed(q,selection);
    const modeLabel=session.mode==="mock"?"Full mock exam":session.mode==="topic"?topic(session.topic).name:({"quick":"Quick practice","standard":"Deep dive","missed":"Missed question review","bookmarked":"Saved question review","single":"Single question"})[session.mode]||"Practice";
    const answered=session.ids.filter(id=>(session.answers[id]||[]).length>0).length;
    const choices=q.options.map((_,i)=>choiceHTML(q,i,selection,checked,false)).join("");
    const flagged=session.flags.includes(q.id);
    return `<div class="quiz-upper"><div><span class="eyebrow"><span class="line"></span> ${isMock?"EXAM SIMULATION":"PRACTICE MODE"}</span><h1>${esc(modeLabel)}</h1><div class="quiz-meta"><span class="chip chip-purple">${total} QUESTIONS</span><span class="chip">QUESTION ${position+1} OF ${total}</span></div></div><div class="timer" id="timer-text">${isMock?"◷ ":"↗ "}${formatTime(timeRemaining())}</div></div>
      <div class="quiz-progress" role="progressbar" aria-label="Question progress" aria-valuenow="${position+1}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${pct(position+1,total)}%"></span></div>
      <div class="quiz-layout">
      <div class="question-card">
        <div class="question-head"><span class="question-num">QUESTION ${String(position+1).padStart(2,"0")} <span style="color:var(--muted)">/ ${String(total).padStart(2,"0")}</span></span><button class="small-button" data-action="flag">${flagged?"★ Flagged":"☆ Flag for review"}</button></div>
        <h2>${esc(q.question)}</h2>
        <p class="question-sub">${q.type==="multi"?"☑ Select all correct answers":q.type==="tf"?"◉ True or false":"◉ Select one correct answer"} <span style="padding:0 5px">·</span> <span style="color:${topic(q.topic).color}">${esc(topic(q.topic).name)}</span> <span style="padding:0 5px">·</span> ${esc(q.difficulty)} difficulty</p>
        <div class="choices">${choices}</div>
        ${checked&&!isMock?`<div class="answer-feedback ${correct?"":"failed"}"><strong>${correct?"✓ Nice work — correct answer!":"↗ Not quite — here's why"}</strong><p>${esc(q.explanation)}</p>${!correct?`<p><strong style="color:var(--secondary)">Correct answer: ${q.correct.map(i=>esc(q.options[i])).join("; ")}</strong></p>`:""}</div>`:""}
        <div class="quiz-footer">
          <button class="btn btn-ghost" data-action="prev" ${position===0?"disabled":""}>← Previous</button>
          <div class="footer-actions">
          ${!isMock&&!checked?`<button class="btn btn-primary" data-action="check" ${!selection.length?"disabled":""}>Check answer ✓</button>`:""}
          <button class="btn ${isLast?"btn-primary":"btn-ghost"}" data-action="${isLast?"finish":"next"}">${isLast?"Finish session":"Next →"}</button></div>
        </div>
      </div>
      <aside class="quiz-side">
        <div class="panel"><h3>Question navigator</h3><p>${answered} answered · ${total-answered} unanswered</p><div class="question-map">${session.ids.map((id,i)=>`<button class="qmap-btn ${i===position?"current":""} ${(session.answers[id]||[]).length?"done":""} ${session.flags.includes(id)?"flagged":""}" data-action="jump" data-index="${i}" aria-label="Go to question ${i+1}">${i+1}</button>`).join("")}</div><div class="map-legend"><span><i class="map-dot"></i> Answered</span><span>☆ Flagged</span></div></div>
        <div class="panel"><h3>Session tools</h3><p>${isMock?"Your answers are revealed after you finish.":"Check an answer for an instant explanation."}</p><div class="study-tools"><button data-action="quit">⌂ Save & return to dashboard</button><button data-action="finish">✓ Finish & review answers</button></div><div class="mini-caption" style="margin-top:13px">Keyboard: 1–4 choose · ←/→ navigate · Enter check/next</div></div>
      </aside></div>`;
  }
  function choose(i){
    const q=currentQuestion();if(!q||session.checked[q.id]||i<0||i>=q.options.length)return;
    const current=session.answers[q.id]||[];
    if(q.type==="multi")session.answers[q.id]=current.includes(i)?current.filter(n=>n!==i):[...current,i].sort();
    else session.answers[q.id]=[i];
    saveSession();render();
  }
  function check(){
    const q=currentQuestion();if(!q||!(session.answers[q.id]||[]).length){toast("Choose an answer first.");return}
    session.checked[q.id]=true;saveSession();render();
  }
  function navigate(delta){if(!session)return;session.current=Math.min(session.ids.length-1,Math.max(0,session.current+delta));saveSession();render();window.scrollTo({top:0,behavior:"smooth"})}
  function finish(force=false){
    if(!session)return;
    const answered=session.ids.filter(id=>(session.answers[id]||[]).length).length;
    if(!force&&answered<session.ids.length&&!window.confirm("Finish with "+(session.ids.length-answered)+" unanswered question(s)? They will count as incorrect."))return;
    const details={};
    for(const id of session.ids){
      const q=index.get(id),selected=session.answers[id]||[];
      details[id]={correct:passed(q,selected),selected:[...selected]};
    }
    const correct=Object.values(details).filter(v=>v.correct).length;
    const result={id:Date.now(),date:new Date().toISOString(),mode:session.mode,topic:session.topic,total:session.ids.length,ids:[...session.ids],details,correct,duration:Math.floor((Date.now()-session.startedAt)/1000)};
    history.unshift(result);history=history.slice(0,60);store.set("history",history);
    session=null;saveSession();showAllReview=false;setView("results");
  }
  function results(){
    const h=history[0];
    if(!h)return `<div class="empty-state"><h3>No results yet</h3><p>Complete a practice session to see your scores, weak topics and review explanations.</p><button class="btn btn-primary" data-action="start" data-mode="quick">Start a quiz</button></div>`;
    const percent=pct(h.correct,h.total),wrong=h.ids.filter(id=>!h.details[id].correct);
    const assessment=percent>=85?"Excellent work. Keep the momentum.":percent>=70?"Solid progress. Keep refining.":"You're building your foundation.";
    const summary=TOPICS.map(t=>{const ids=h.ids.filter(id=>index.get(id).topic===t.id);return {t,total:ids.length,right:ids.filter(id=>h.details[id].correct).length}}).filter(x=>x.total);
    const visible=(showAllReview?h.ids:wrong).map(id=>index.get(id));
    return `<div class="page-heading"><span class="eyebrow"><span class="line"></span> SESSION COMPLETE</span><h1>Your results are in.</h1><p>${new Date(h.date).toLocaleString()} · ${h.total} questions · ${formatTime(h.duration)} spent</p></div>
      <div class="result-hero">
        <div class="score-ring" style="--score:${percent}%"><div><strong>${percent}%</strong><small>ACCURACY</small></div></div>
        <div class="result-details"><span class="eyebrow">${percent>=70?"✦ GOOD PROGRESS":"↗ KEEP PRACTICING"}</span><h1>${assessment}</h1><p>${h.correct} correct out of ${h.total} questions. ${wrong.length} question${wrong.length===1?"":"s"} to revisit. This is a study score, not an official passing prediction.</p><div class="result-actions"><button class="btn btn-primary" data-action="start" data-mode="quick">▶ New practice round</button>${wrong.length?'<button class="btn" data-action="retry-last">↻ Retry incorrect answers</button>':""}<button class="btn btn-ghost" data-view="dashboard">Go to dashboard →</button></div></div>
      </div>
      <div class="section-heading"><div><span class="eyebrow"><span class="line"></span> PERFORMANCE</span><h2>Score by exam domain</h2></div></div>
      <div class="breakdown-grid">${summary.map(x=>`<div class="breakdown-item"><div class="top"><span>${esc(x.t.name)}</span><span>${x.right}/${x.total} · ${pct(x.right,x.total)}%</span></div><div class="small-progress"><span style="width:${pct(x.right,x.total)}%;background:${x.t.color}"></span></div></div>`).join("")}</div>
      <div class="section-heading"><div><span class="eyebrow"><span class="line"></span> REVIEW MODE</span><h2>${showAllReview?"All answered questions":"Questions to revisit"}</h2><p>Use the explanations to understand the reasoning behind each answer.</p></div><button class="text-link" data-action="review-toggle">${showAllReview?"Show missed only":"Show all "+h.total+" questions"} ↗</button></div>
      <div class="review-list">${visible.length?visible.map(q=>reviewCard(q,h.details[q.id])).join(""):'<div class="empty-state"><h3>Perfect session! ✦</h3><p>Every answer was correct. Try a full mock exam or explore another domain.</p><button class="btn" data-action="start" data-mode="mock">Take a mock exam</button></div>'}</div>`;
  }
  function reviewCard(q,record){
    const your=(record.selected||[]).map(i=>q.options[i]).join("; ")||"Not answered";
    return `<div class="review-card"><div class="bank-meta"><span class="chip ${record.correct?"chip-green":"chip-red"}">${record.correct?"✓ CORRECT":"✕ REVIEW"}</span><span class="chip">${q.id}</span><span class="chip">${esc(topic(q.topic).name)}</span></div><h3>${esc(q.question)}</h3><p class="review-answer">Your answer: <span class="${record.correct?"":"incorrect"}">${esc(your)}</span></p>${!record.correct?`<p class="review-answer">Correct answer: <b>${q.correct.map(i=>esc(q.options[i])).join("; ")}</b></p>`:""}<p>${esc(q.explanation)}</p><button class="small-button" data-action="bookmark" data-id="${q.id}">${bookmarks.has(q.id)?"★ Saved":"☆ Save for later"}</button></div>`;
  }
  function library(){
    return `<div class="page-heading"><span class="eyebrow"><span class="line"></span> EXPLORE THE QUESTION BANK</span><h1>Know the concepts. Nail the exam.</h1><p>80 original questions, sortable by domain and difficulty. Save anything you'd like to revisit.</p></div>
      <div class="toolbar"><div class="search-box"><span>⌕</span><input id="bank-search" aria-label="Search questions" type="search" placeholder="Search questions, CLI commands, concepts…" value="${esc(search)}"></div>
        <select class="filter-select" id="bank-topic" aria-label="Filter by domain"><option value="all">All exam domains</option>${TOPICS.map(t=>`<option value="${t.id}" ${filterTopic===t.id?"selected":""}>${t.objective}. ${esc(t.name)}</option>`).join("")}</select>
        <select class="filter-select" id="bank-difficulty" aria-label="Filter by difficulty"><option value="all">All difficulties</option>${["easy","medium","hard"].map(d=>`<option value="${d}" ${filterDifficulty===d?"selected":""}>${d[0].toUpperCase()+d.slice(1)}</option>`).join("")}</select>
        <button class="filter-toggle ${bookmarkFilter?"active":""}" data-action="bookmark-filter">☆ Saved only</button>
      </div><div class="section-heading"><div><h2 id="bank-count">Question bank</h2></div><button class="text-link" data-action="start" data-mode="bookmarked">Practice saved questions ↗</button></div><div id="bank-results" class="bank-list">${bankResults()}</div>`;
  }
  function bankResults(){
    const latest=latestMap();
    const items=QUESTIONS.filter(q=>(filterTopic==="all"||q.topic===filterTopic)&&(filterDifficulty==="all"||q.difficulty===filterDifficulty)&&(!bookmarkFilter||bookmarks.has(q.id))&&(q.question+" "+q.options.join(" ")+" "+q.explanation).toLowerCase().includes(search.toLowerCase()));
    return items.length?items.map(q=>{
      const attempted=latest.get(q.id);
      return `<div class="bank-item"><span class="bank-id">${q.id}</span><div class="bank-main"><div class="bank-meta"><span class="chip chip-purple">DOMAIN ${topic(q.topic).objective}</span><span class="chip">${q.difficulty.toUpperCase()}</span><span class="chip">${q.type==="multi"?"MULTI-SELECT":q.type==="tf"?"TRUE / FALSE":"SINGLE-SELECT"}</span>${attempted?`<span class="chip ${attempted.correct?"chip-green":"chip-red"}">${attempted.correct?"✓ LAST CORRECT":"↻ REVISIT"}</span>`:""}</div><strong>${esc(q.question)}</strong></div><div class="bank-actions"><button class="star-button ${bookmarks.has(q.id)?"saved":""}" aria-label="Save question" data-action="bookmark" data-id="${q.id}">${bookmarks.has(q.id)?"★":"☆"}</button><button class="small-button" data-action="open-question" data-id="${q.id}">Practice →</button></div></div>`;
    }).join(""):`<div class="empty-state"><h3>No questions match</h3><p>Try changing the search, domain, difficulty, or saved filter.</p><button class="btn" data-action="filters-clear">Clear filters</button></div>`;
  }
  const guidePoints={
    iac:["Infrastructure as Code patterns and benefits","Declarative configuration and multi-cloud","Managing change through version control"],
    fundamentals:["Providers, sources, version constraints and aliases","Provider initialization and lock files","How providers interact with resources and state"],
    workflow:["terraform init, validate, fmt, plan, apply, destroy","Saved execution plans and approval","Core write/plan workflow"],
    configuration:["Resources, data, variables, outputs and types","for_each, count, expressions and functions","depends_on, lifecycle, conditions and secrets","Ephemeral values and write-only arguments"],
    modules:["Registry, Git and local module sources","Input/output contracts and variable scope","Version constraints and reusable interfaces"],
    state:["Local and remote backends","State locking, state commands and drift","Refresh-only, moved and removed resources"],
    maintenance:["Import blocks and terraform import","State inspection and resource addresses","Debug logs, troubleshooting and replacement"],
    hcp:["Workspaces, projects and remote runs","Variable sets, policies and private registry","VCS integration, run triggers and drift detection"]
  };
  function guide(){
    return `<div class="page-heading"><span class="eyebrow"><span class="line"></span> EXAM OBJECTIVES</span><h1>What's actually in 004?</h1><p>The eight official objective areas, with bite-sized topics to guide your revision.</p></div>
      <div class="guide-banner"><div><strong>Built around HashiCorp's official 004 syllabus</strong><p>The exam tests Terraform 1.12. This tool contains original study questions, not leaked or official exam items.</p></div><a class="btn btn-primary" href="https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004" target="_blank" rel="noopener noreferrer">Official objectives ↗</a></div>
      <div class="guide-grid">${TOPICS.map(t=>`<article class="guide-card"><span class="eyebrow">OBJECTIVE ${t.objective} / 08</span><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p><ul class="guide-bullets">${guidePoints[t.id].map(line=>`<li>${esc(line)}</li>`).join("")}</ul><div style="margin-top:21px"><button class="btn" data-action="topic" data-topic="${t.id}">Practice this domain →</button></div></article>`).join("")}</div><div class="section-heading"><div><h2>Keep learning</h2><p>Use the official source of truth alongside these questions.</p></div></div><div class="panel"><p class="tip"><a class="tip-link" href="https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004" target="_blank" rel="noopener noreferrer">↗ HashiCorp official 004 learning path</a><br><a class="tip-link" href="https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-questions-004" target="_blank" rel="noopener noreferrer">↗ HashiCorp official sample question formats</a><br><a class="tip-link" href="https://developer.hashicorp.com/terraform/language" target="_blank" rel="noopener noreferrer">↗ Terraform language reference</a></p><button class="btn btn-danger" data-action="reset">Clear local progress</button><p class="mini-caption">Reset removes your practice history, bookmarked questions, and unfinished session from this browser only.</p></div>`;
  }
  function render(){
    sidebar();
    root.innerHTML=view==="dashboard"?dashboard():view==="quiz"?quiz():view==="results"?results():view==="library"?library():guide();
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-action], [data-view]");
    if(!button)return;
    if(button.tagName==="A"&&button.dataset.view)event.preventDefault();
    const action=button.dataset.action;
    if(!action&&button.dataset.view){setView(button.dataset.view);return}
    if(action==="start")start(button.dataset.mode||"quick");
    else if(action==="topic")start("topic",button.dataset.topic);
    else if(action==="resume"){if(session)setView("quiz");else start("quick")}
    else if(action==="choice")choose(Number(button.dataset.choice));
    else if(action==="check")check();
    else if(action==="next")navigate(1);
    else if(action==="prev")navigate(-1);
    else if(action==="jump"){if(session){session.current=Number(button.dataset.index);saveSession();render();window.scrollTo({top:0,behavior:"smooth"})}}
    else if(action==="flag"){if(session){const id=currentQuestion().id;session.flags=session.flags.includes(id)?session.flags.filter(x=>x!==id):[...session.flags,id];saveSession();render()}}
    else if(action==="finish")finish();
    else if(action==="quit"){if(session){saveSession();setView("dashboard");toast("Session saved — you can resume any time.")}}
    else if(action==="review-toggle"){showAllReview=!showAllReview;render()}
    else if(action==="retry-last"){const h=history[0];if(h)start("missed",null,h.ids.filter(id=>!h.details[id].correct))}
    else if(action==="bookmark"){const id=button.dataset.id;if(bookmarks.has(id))bookmarks.delete(id);else bookmarks.add(id);store.set("bookmarks",[...bookmarks]);render()}
    else if(action==="bookmark-filter"){bookmarkFilter=!bookmarkFilter;render()}
    else if(action==="open-question")start("single",null,[button.dataset.id]);
    else if(action==="filters-clear"){search="";filterTopic="all";filterDifficulty="all";bookmarkFilter=false;render()}
    else if(action==="theme"){document.body.dataset.theme=document.body.dataset.theme==="dark"?"light":"dark";store.set("theme",document.body.dataset.theme);sidebar()}
    else if(action==="reset"){if(window.confirm("Clear your saved progress, bookmarks and unfinished session?")){history=[];bookmarks.clear();session=null;["history","bookmarks","session"].forEach(k=>store.del(k));toast("Local progress cleared.");setView("dashboard")}}
  });
  document.addEventListener("change",event=>{
    if(event.target.id==="bank-topic"){filterTopic=event.target.value;render()}
    if(event.target.id==="bank-difficulty"){filterDifficulty=event.target.value;render()}
  });
  document.addEventListener("input",event=>{
    if(event.target.id==="bank-search"){
      search=event.target.value;
      const target=document.getElementById("bank-results"),count=document.getElementById("bank-count");
      if(target)target.innerHTML=bankResults();
      if(count)count.textContent="Search results";
    }
  });
  document.addEventListener("keydown",event=>{
    if(view!=="quiz"||!session||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))return;
    if(["1","2","3","4"].includes(event.key)&&!event.ctrlKey&&!event.altKey&&!event.metaKey){event.preventDefault();choose(Number(event.key)-1)}
    else if(event.key==="ArrowRight"&&!event.altKey){event.preventDefault();navigate(1)}
    else if(event.key==="ArrowLeft"&&!event.altKey){event.preventDefault();navigate(-1)}
    else if(event.key==="Enter"&&!event.target.closest("button,a")){event.preventDefault();if(session.mode!=="mock"&&!session.checked[currentQuestion().id])check();else if(session.current<session.ids.length-1)navigate(1)}
  });
  setInterval(()=>{
    if(!session)return;
    if(session.deadline&&Date.now()>=session.deadline){toast("Time is up. Your mock exam has been submitted.");finish(true);return}
    const timer=document.getElementById("timer-text");
    if(timer){timer.textContent=(session.mode==="mock"?"◷ ":"↗ ")+formatTime(timeRemaining());timer.classList.toggle("urgent",session.mode==="mock"&&timeRemaining()<300)}
  },1000);
  render();
})();
