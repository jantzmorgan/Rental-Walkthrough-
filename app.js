const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],KEY="rentalWalkthroughInspectionsV1";
let current=null,deferredPrompt=null;
const defaults=["Entry / Hall","Living Room","Kitchen","Primary Bedroom","Bedroom 2","Bathroom 1","Bathroom 2","Laundry","Exterior"];
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random(),today=()=>new Date().toISOString().slice(0,10);
const all=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}},put=x=>localStorage.setItem(KEY,JSON.stringify(x));
function blank(){return{id:uid(),address:"",type:"Move-In",tenant:"",inspector:"",date:today(),overall:"Good",generalNotes:"",rooms:defaults.map(name=>({id:uid(),name,condition:"Good",clean:"Clean",working:"Yes",notes:"",photos:[]})),tenantSig:"",inspectorSig:"",updatedAt:Date.now()}}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function view(n){$("#homeView").classList.toggle("hidden",n!="home");$("#editorView").classList.toggle("hidden",n!="editor");$("#reportView").classList.toggle("hidden",n!="report");scrollTo(0,0)}
function home(){let a=all().sort((x,y)=>y.updatedAt-x.updatedAt);$("#inspectionList").innerHTML="";$("#emptyState").classList.toggle("hidden",!!a.length);a.forEach(it=>{let e=document.createElement("div");e.className="card saved-item";e.innerHTML='<div><h3>'+esc(it.address||"Untitled property")+'</h3><div class="saved-meta">'+esc(it.type)+" • "+esc(it.date||"No date")+"<br>"+esc(it.tenant||"No tenant listed")+'</div></div><div class="saved-actions"><button class="ghost open">Open</button><button class="ghost dup">Duplicate</button><button class="danger-link del">Delete</button></div>';e.querySelector(".open").onclick=()=>open(it.id);e.querySelector(".dup").onclick=()=>{let c=JSON.parse(JSON.stringify(it));c.id=uid();c.updatedAt=Date.now();c.address+=(c.address?" ":"")+"(Copy)";let x=all();x.push(c);put(x);home()};e.querySelector(".del").onclick=()=>{if(confirm("Delete this inspection?")){put(all().filter(x=>x.id!==it.id));home()}};$("#inspectionList").appendChild(e)})}
function open(id){current=all().find(x=>x.id===id);if(current){fill();view("editor")}}
function fill(){addressInput.value=current.address||"";typeInput.value=current.type||"Move-In";tenantInput.value=current.tenant||"";inspectorInput.value=current.inspector||"";dateInput.value=current.date||today();overallInput.value=current.overall||"Good";generalNotes.value=current.generalNotes||"";roomsContainer.innerHTML="";current.rooms.forEach(room);sigRestore(tenantSig,current.tenantSig);sigRestore(inspectorSig,current.inspectorSig)}
function room(r){let f=roomTemplate.content.cloneNode(true),c=f.querySelector(".room-card");c.dataset.id=r.id;f.querySelector(".room-name").value=r.name;f.querySelector(".room-condition").value=r.condition;f.querySelector(".room-clean").value=r.clean;f.querySelector(".room-working").value=r.working;f.querySelector(".room-notes").value=r.notes||"";let g=f.querySelector(".photo-grid");(r.photos||[]).forEach((src,i)=>g.appendChild(photo(src,r.id,i)));f.querySelector(".photo-input").onchange=async e=>{for(let file of e.target.files)r.photos.push(await compress(file));sync(false);fill()};f.querySelector(".remove-room").onclick=()=>{if(confirm("Remove "+r.name+"?")){current.rooms=current.rooms.filter(x=>x.id!==r.id);fill()}};roomsContainer.appendChild(f)}
function photo(src,id,i){let e=document.createElement("div");e.className="photo";e.innerHTML='<img alt="Inspection photo"><button title="Remove">×</button>';e.querySelector("img").src=src;e.querySelector("button").onclick=()=>{current.rooms.find(x=>x.id===id).photos.splice(i,1);fill()};return e}
function compress(file){return new Promise((ok,no)=>{let im=new Image;im.onload=()=>{let sc=Math.min(1,1280/im.width),c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext("2d").drawImage(im,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",.78))};im.onerror=no;im.src=URL.createObjectURL(file)})}
function sync(sigs=true){if(!current)return;current.address=addressInput.value.trim();current.type=typeInput.value;current.tenant=tenantInput.value.trim();current.inspector=inspectorInput.value.trim();current.date=dateInput.value;current.overall=overallInput.value;current.generalNotes=generalNotes.value.trim();$$(".room-card").forEach(c=>{let r=current.rooms.find(x=>x.id===c.dataset.id);if(r){r.name=c.querySelector(".room-name").value.trim()||"Room";r.condition=c.querySelector(".room-condition").value;r.clean=c.querySelector(".room-clean").value;r.working=c.querySelector(".room-working").value;r.notes=c.querySelector(".room-notes").value.trim()}});if(sigs){current.tenantSig=tenantSig.toDataURL();current.inspectorSig=inspectorSig.toDataURL()}current.updatedAt=Date.now()}
function save(){sync();let a=all(),i=a.findIndex(x=>x.id===current.id);i>=0?a[i]=current:a.push(current);try{put(a);toast("Saved")}catch{alert("This inspection is too large for browser storage. Export it, then remove some photos.")}}
function addRoom(){sync();current.rooms.push({id:uid(),name:"New Room",condition:"Good",clean:"Clean",working:"Yes",notes:"",photos:[]});fill()}
function sig(canvas){let c=canvas.getContext("2d"),d=false;c.lineWidth=3;c.lineCap="round";function p(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}canvas.onpointerdown=e=>{e.preventDefault();d=true;let q=p(e);c.beginPath();c.moveTo(q.x,q.y)};canvas.onpointermove=e=>{if(d){e.preventDefault();let q=p(e);c.lineTo(q.x,q.y);c.stroke()}};addEventListener("pointerup",()=>d=false)}
function sigRestore(c,d){let x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);if(d){let im=new Image;im.onload=()=>x.drawImage(im,0,0,c.width,c.height);im.src=d}}
function report(){sync();save();let rooms=current.rooms.map(r=>'<section class="report-room"><h2>'+esc(r.name)+'</h2><p><strong>Condition:</strong> '+esc(r.condition)+' &nbsp; <strong>Cleanliness:</strong> '+esc(r.clean)+' &nbsp; <strong>Working:</strong> '+esc(r.working)+'</p>'+(r.notes?'<p><strong>Notes:</strong> '+esc(r.notes).replace(/\n/g,"<br>")+"</p>":"")+(r.photos.length?'<div class="report-photos">'+r.photos.map(p=>'<img src="'+p+'" alt="Inspection photo">').join("")+"</div>":"<p><em>No photos added.</em></p>")+"</section>").join("");reportContent.innerHTML='<h1>Rental Inspection Report</h1><div class="sub">'+esc(current.address||"Untitled property")+'</div><div class="report-grid"><div><strong>Inspection type</strong><br>'+esc(current.type)+'</div><div><strong>Date</strong><br>'+esc(current.date)+'</div><div><strong>Tenant</strong><br>'+esc(current.tenant||"—")+'</div><div><strong>Inspector</strong><br>'+esc(current.inspector||"—")+'</div><div><strong>Overall condition</strong><br>'+esc(current.overall)+'</div></div>'+(current.generalNotes?'<p><strong>General notes:</strong><br>'+esc(current.generalNotes).replace(/\n/g,"<br>")+"</p>":"")+rooms+'<section class="report-signatures"><div><img src="'+current.tenantSig+'"><div class="label">Tenant signature</div></div><div><img src="'+current.inspectorSig+'"><div class="label">Inspector signature</div></div></section>';view("report")}
function loadZip(){return new Promise((ok,no)=>{if(window.JSZip)return ok();let s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function loadPdf(){return new Promise((ok,no)=>{if(window.jspdf?.jsPDF)return ok();let s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function pdfSafe(s){return String(s??"").replace(/\s+/g," ").trim()}
function pdfImageType(src){let m=String(src||"").match(/^data:image\/(png|jpe?g|webp)/i);if(!m)return"JPEG";let t=m[1].toLowerCase();return t==="png"?"PNG":t==="webp"?"WEBP":"JPEG"}
function buildProfessionalPdf(){
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:"portrait",unit:"pt",format:"letter",compress:true});
  const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=44,blue=[28,78,121],light=[241,245,249],dark=[31,41,55],muted=[100,116,139];
  const line=(x1,y1,x2,y2)=>{doc.setDrawColor(220,226,232);doc.line(x1,y1,x2,y2)};
  const txt=(t,x,y,size=10,style="normal",color=dark)=>{doc.setFont("helvetica",style);doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(t??""),x,y)};
  const wrapped=(t,x,y,w,size=10,style="normal",lh=14,color=dark)=>{
    doc.setFont("helvetica",style);doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(t||"—"),w);doc.text(lines,x,y);return y+Math.max(1,lines.length)*lh;
  };
  const pageHeader=()=>{
    doc.setFillColor(...blue);doc.rect(0,0,W,56,"F");
    txt("RENTAL INSPECTION REPORT",M,35,16,"bold",[255,255,255]);
    if(current.address)txt(pdfSafe(current.address),W-M,35,9,"normal",[230,239,247]),doc.text(pdfSafe(current.address),W-M,35,{align:"right"});
  };
  const footer=()=>{
    const p=doc.internal.getCurrentPageInfo().pageNumber;
    line(M,H-34,W-M,H-34);txt("Rental Walkthrough",M,H-18,8,"normal",muted);txt("Page "+p,W-M,H-18,8,"normal",muted);doc.text("Page "+p,W-M,H-18,{align:"right"});
  };
  const newPage=()=>{doc.addPage();pageHeader();return 84};
  const ensure=(y,needed)=>y+needed>H-54?newPage():y;

  pageHeader();
  let y=92;
  txt("Property Inspection",M,y,25,"bold",dark);y+=26;
  y=wrapped(current.address||"Untitled property",M,y,W-M*2,13,"normal",18,muted)+10;

  doc.setFillColor(...light);doc.roundedRect(M,y,W-M*2,108,8,8,"F");
  const colW=(W-M*2)/2, rows=[
    ["Inspection type",current.type||"—","Date",current.date||"—"],
    ["Tenant",current.tenant||"—","Inspector",current.inspector||"—"],
    ["Overall condition",current.overall||"—","Rooms inspected",String(current.rooms.length)]
  ];
  rows.forEach((r,i)=>{let yy=y+24+i*31;txt(r[0].toUpperCase(),M+16,yy,7,"bold",muted);txt(pdfSafe(r[1]),M+16,yy+13,10,"bold",dark);txt(r[2].toUpperCase(),M+16+colW,yy,7,"bold",muted);txt(pdfSafe(r[3]),M+16+colW,yy+13,10,"bold",dark)});
  y+=128;
  if(current.generalNotes){
    txt("GENERAL NOTES",M,y,10,"bold",blue);y+=18;
    y=wrapped(current.generalNotes,M,y,W-M*2,10,"normal",14,dark)+8;
  }
  y=ensure(y,64);txt("ROOM SUMMARY",M,y,10,"bold",blue);y+=18;
  current.rooms.forEach((r,i)=>{
    y=ensure(y,34);
    if(i)line(M,y-7,W-M,y-7);
    txt(r.name||"Room",M,y,11,"bold",dark);
    txt([r.condition,r.clean,r.working].filter(Boolean).join("  •  "),W-M,y,9,"normal",muted);
    doc.text([r.condition,r.clean,r.working].filter(Boolean).join("  •  "),W-M,y,{align:"right"});
    y+=20;
  });
  footer();

  current.rooms.forEach((r,ri)=>{
    doc.addPage();pageHeader();let y=86;
    txt(String(ri+1).padStart(2,"0"),M,y,10,"bold",blue);txt(r.name||"Room",M+30,y,20,"bold",dark);y+=22;
    line(M,y,W-M,y);y+=20;
    const info=[["Condition",r.condition],["Cleanliness",r.clean],["Working",r.working],["Photos",String((r.photos||[]).length)]];
    const infoW=(W-M*2)/4;
    info.forEach((v,i)=>{txt(v[0].toUpperCase(),M+i*infoW,y,7,"bold",muted);txt(pdfSafe(v[1]||"—"),M+i*infoW,y+14,10,"bold",dark)});
    y+=44;
    if(r.notes){
      txt("NOTES",M,y,9,"bold",blue);y+=16;
      y=wrapped(r.notes,M,y,W-M*2,10,"normal",14,dark)+12;
    }
    if(!(r.photos||[]).length){
      y=ensure(y,60);doc.setFillColor(...light);doc.roundedRect(M,y,W-M*2,54,6,6,"F");txt("No photos added for this room.",M+16,y+31,10,"normal",muted);
    }else{
      txt("PHOTOS",M,y,9,"bold",blue);y+=14;
      const gap=12,boxW=(W-M*2-gap)/2,boxH=178;
      r.photos.forEach((src,pi)=>{
        const col=pi%2;
        if(col===0)y=ensure(y,boxH+26);
        const x=M+col*(boxW+gap);
        doc.setFillColor(248,250,252);doc.roundedRect(x,y,boxW,boxH,5,5,"F");
        try{
          const props=doc.getImageProperties(src),scale=Math.min((boxW-12)/props.width,(boxH-24)/props.height),iw=props.width*scale,ih=props.height*scale;
          doc.addImage(src,pdfImageType(src),x+(boxW-iw)/2,y+6,iw,ih,undefined,"FAST");
        }catch{}
        txt("Photo "+(pi+1),x+8,y+boxH-7,7,"normal",muted);
        if(col===1||pi===r.photos.length-1)y+=boxH+16;
      });
    }
    footer();
  });

  if(current.tenantSig||current.inspectorSig){
    doc.addPage();pageHeader();let y=92;
    txt("Signatures",M,y,22,"bold",dark);y+=34;
    [["Tenant signature",current.tenantSig,current.tenant||""],["Inspector signature",current.inspectorSig,current.inspector||""]].forEach(([label,src,name],i)=>{
      const x=i===0?M:M+266;
      txt(label.toUpperCase(),x,y,8,"bold",muted);
      doc.setDrawColor(220,226,232);doc.roundedRect(x,y+12,240,110,6,6);
      if(src)try{doc.addImage(src,"PNG",x+10,y+22,220,82,undefined,"FAST")}catch{}
      txt(name||" ",x,y+142,10,"bold",dark);line(x,y+148,x+240,y+148);
    });
    footer();
  }

  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...muted);doc.text("Page "+i+" of "+pages,W-M,H-18,{align:"right"})}
  return doc.output("arraybuffer");
}
function buildExportHtml(photoParts){
  return '<!doctype html><html><head><meta charset="utf-8"><title>Rental Inspection Report</title><style>@page{size:letter;margin:.55in}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1f2937;max-width:8.5in;margin:0 auto;padding:36px;background:#fff}header{border-bottom:4px solid #1c4e79;padding-bottom:18px;margin-bottom:24px}h1{margin:0;font-size:30px}h2{color:#1c4e79;border-bottom:1px solid #dbe3ea;padding-bottom:8px;margin-top:30px}.address{font-size:17px;color:#64748b;margin-top:6px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f1f5f9;padding:18px;border-radius:10px;margin:22px 0}.meta div{line-height:1.45}.notes{border-left:4px solid #1c4e79;padding:2px 0 2px 14px}.photos{display:grid;grid-template-columns:1fr 1fr;gap:12px}.photo{break-inside:avoid}.photo img{width:100%;height:260px;object-fit:contain;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px}.cap{font-size:11px;color:#64748b;margin-top:4px}.room{break-before:auto;break-inside:avoid-page}.status{font-size:13px;color:#475569}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:34px}.sig{border-top:1px solid #94a3b8;padding-top:8px}.sig img{max-width:100%;height:85px;object-fit:contain}@media print{body{padding:0}.room{break-inside:avoid-page}}@media(max-width:650px){.photos,.meta,.signatures{grid-template-columns:1fr}}</style></head><body><header><h1>Rental Inspection Report</h1><div class="address">'+esc(current.address||"Untitled property")+'</div></header><div class="meta"><div><b>Inspection type</b><br>'+esc(current.type)+'</div><div><b>Date</b><br>'+esc(current.date)+'</div><div><b>Tenant</b><br>'+esc(current.tenant||"—")+'</div><div><b>Inspector</b><br>'+esc(current.inspector||"—")+'</div><div><b>Overall condition</b><br>'+esc(current.overall)+'</div><div><b>Rooms inspected</b><br>'+current.rooms.length+'</div></div>'+(current.generalNotes?'<div class="notes"><b>General notes</b><br>'+esc(current.generalNotes).replace(/\n/g,"<br>")+'</div>':"")+photoParts.join("")+'<div class="signatures"><div class="sig">'+(current.tenantSig?'<img src="tenant-signature.png">':"")+'<br><b>Tenant signature</b><br>'+esc(current.tenant||"")+'</div><div class="sig">'+(current.inspectorSig?'<img src="inspector-signature.png">':"")+'<br><b>Inspector signature</b><br>'+esc(current.inspector||"")+'</div></div></body></html>';
}
async function exportZip(){
  sync();save();
  try{await Promise.all([loadZip(),loadPdf()])}catch{return alert("Could not load the export tools. Check your internet connection.")}
  let z=new JSZip,p=z.folder("photos"),n=0,parts=[];
  current.rooms.forEach((r,ri)=>{
    let imgs=[];
    (r.photos||[]).forEach((src,pi)=>{
      let m=src.match(/^data:image\/(\w+);base64,(.*)$/);if(!m)return;
      let ext=m[1]=="jpeg"?"jpg":m[1],rn=(r.name||"room-"+(ri+1)).replace(/[^a-z0-9-_]+/gi,"-"),fn=String(++n).padStart(3,"0")+"-"+rn+"-"+(pi+1)+"."+ext;
      p.file(fn,m[2],{base64:true});imgs.push('<div class="photo"><img src="photos/'+fn+'"><div class="cap">'+esc(r.name)+' — Photo '+(pi+1)+'</div></div>')
    });
    parts.push('<section class="room"><h2>'+esc(r.name)+'</h2><div class="status"><b>Condition:</b> '+esc(r.condition)+' &nbsp; <b>Cleanliness:</b> '+esc(r.clean)+' &nbsp; <b>Working:</b> '+esc(r.working)+'</div>'+(r.notes?'<p><b>Notes:</b> '+esc(r.notes).replace(/\n/g,"<br>")+'</p>':"")+(imgs.length?'<div class="photos">'+imgs.join("")+'</div>':'<p><i>No photos added.</i></p>')+'</section>')
  });
  [["tenant-signature.png",current.tenantSig],["inspector-signature.png",current.inspectorSig]].forEach(x=>{let m=(x[1]||"").match(/^data:image\/png;base64,(.*)$/);if(m)z.file(x[0],m[1],{base64:true})});
  z.file("inspection-report.pdf",buildProfessionalPdf());
  z.file("inspection-report.html",buildExportHtml(parts));
  z.file("inspection-data.json",JSON.stringify(current,null,2));
  let b=await z.generateAsync({type:"blob"}),u=URL.createObjectURL(b),a=document.createElement("a"),safe=(current.address||"rental-inspection").replace(/[^a-z0-9-_]+/gi,"-");
  a.href=u;a.download=safe+"-"+(current.date||"inspection")+".zip";a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);toast("Exported professional PDF + "+n+" photos")
}
function toast(t){let e=document.createElement("div");e.textContent=t;Object.assign(e.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:"#111827",color:"#fff",padding:"10px 16px",borderRadius:"999px",zIndex:99,fontWeight:700});document.body.appendChild(e);setTimeout(()=>e.remove(),1400)}

document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
document.addEventListener("gesturechange",e=>e.preventDefault(),{passive:false});
document.addEventListener("gestureend",e=>e.preventDefault(),{passive:false});
let lastTouchEnd=0;
document.addEventListener("touchend",e=>{
  const now=Date.now();
  if(now-lastTouchEnd<=350)e.preventDefault();
  lastTouchEnd=now;
},{passive:false});

newInspectionBtn.onclick=()=>{current=blank();fill();view("editor")};backBtn.onclick=()=>{save();home();view("home")};saveBtn.onclick=save;saveBottomBtn.onclick=save;addRoomBtn.onclick=addRoom;reportBtn.onclick=report;reportBottomBtn.onclick=report;reportBackBtn.onclick=()=>view("editor");printBtn.onclick=()=>print();clearAllBtn.onclick=()=>{if(confirm("Delete every saved inspection on this device?")){localStorage.removeItem(KEY);home()}};$$("[data-clear-sig]").forEach(b=>b.onclick=()=>{let c=$("#"+b.dataset.clearSig);c.getContext("2d").clearRect(0,0,c.width,c.height)});
let ex=document.createElement("button");ex.className="ghost";ex.textContent="Export ZIP";ex.onclick=exportZip;reportBtn.parentNode.insertBefore(ex,reportBtn);
let ex2=document.createElement("button");ex2.className="ghost large";ex2.textContent="Export ZIP";ex2.onclick=exportZip;reportBottomBtn.parentNode.insertBefore(ex2,reportBottomBtn);
sig(tenantSig);sig(inspectorSig);home();
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove("hidden")});installBtn.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add("hidden")}};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));