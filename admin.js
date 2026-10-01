const STATS_URL="https://script.google.com/macros/s/AKfycbxK2lSrIdVTQkixPEGCG47Vea7s9yVQ2ZMHTXJQwb6a2cgrha2waX7QtxdNdv20gHgj/exec";

const sectionOrder=[
  ["muassasa","Muassasa turi"],["yonalis","Yo‘nalish"],["tajriba","Pedagogik tajriba"],
  ["platformalar","Raqamli vositalar"],["tayyorlash_vaqti","Dars materialini tayyorlash vaqti"],
  ["test_vaqti","Test tayyorlash vaqti"],["muammolar","Interaktiv dars muammolari"],
  ["ai_bahosi","AI yordamida dars yaratish"],["muhim_funksiya","Eng muhim funksiya"],
  ["platformaga_qiziqish","Platformaga qiziqish"],["beta_sinov","Beta-testga tayyorlik"],
  ["narx","Maqbul oylik narx"]
];

function esc(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function loadStats(){
  const status=document.getElementById("status");
  status.textContent="Ma’lumotlar yuklanmoqda...";
  const callback="statsCallback_"+Date.now();
  window[callback]=(data)=>{
    delete window[callback];
    script.remove();
    if(!data||!data.success){status.textContent="Statistika yuklanmadi.";return;}
    render(data);
  };
  const script=document.createElement("script");
  script.src=STATS_URL+"?action=stats&callback="+callback;
  script.onerror=()=>{delete window[callback];status.textContent="Ulanishda xatolik. Apps Script doGet/statistika qismini tekshiring.";};
  document.body.appendChild(script);
}

function render(data){
  document.getElementById("status").textContent="Oxirgi yangilanish: "+new Date().toLocaleString("uz-UZ");
  document.getElementById("total").textContent=data.total||0;
  document.getElementById("beta").textContent=(data.summary?.beta_interest_pct??0)+"%";
  document.getElementById("ai").textContent=(data.summary?.ai_positive_pct??0)+"%";
  document.getElementById("contacts").textContent=data.summary?.contacts||0;

  const root=document.getElementById("sections");
  root.innerHTML="";
  for(const [key,title] of sectionOrder){
    const values=data.sections?.[key]||[];
    const section=document.createElement("article");
    section.className="section";
    section.innerHTML="<h2>"+esc(title)+"</h2>";
    if(!values.length){section.innerHTML+="<div class='empty'>Ma’lumot yo‘q.</div>";root.appendChild(section);continue;}
    values.forEach(item=>{
      const row=document.createElement("div");row.className="row";
      row.innerHTML="<div class='label'>"+esc(item.label)+"<div class='bar'><i style='width:"+Math.min(100,Number(item.pct)||0)+"%'></i></div></div><div class='count'>"+item.count+"</div><div class='pct'>"+item.pct+"%</div>";
      section.appendChild(row);
    });
    root.appendChild(section);
  }
}

document.getElementById("refreshBtn").addEventListener("click",loadStats);
loadStats();