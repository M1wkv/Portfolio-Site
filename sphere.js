(()=>{const canvas=document.getElementById("sphereCanvas");
const ctx=canvas.getContext("2d");
const sizeRange=document.getElementById("sphereSizeRange");
const scaleRange=document.getElementById("elementScaleRange");
const fisheyeRange=document.getElementById("fisheyeRange");
const sizeDial=document.getElementById("sphereSizeDial");
const scaleDial=document.getElementById("elementScaleDial");
const sizeValue=document.getElementById("sphereSizeValue");
const scaleValue=document.getElementById("elementScaleValue");
const fisheyeValue=document.getElementById("fisheyeValue");
const spherePage=document.querySelector(".sphere-page");
const projectViewUi=document.getElementById("projectViewUi");
const projectBack=document.getElementById("projectBack");
const projectTitle=document.getElementById("projectTitle");
const projectScaleRange=document.getElementById("projectScaleRange");
const projectCountRange=document.getElementById("projectCountRange");
const projectGapRange=document.getElementById("projectGapRange");
const projectWidthRange=document.getElementById("projectWidthRange");
const projectLengthRange=document.getElementById("projectLengthRange");
const projectScaleValue=document.getElementById("projectScaleValue");
const projectCountValue=document.getElementById("projectCountValue");
const projectGapValue=document.getElementById("projectGapValue");
const projectWidthValue=document.getElementById("projectWidthValue");
const projectLengthValue=document.getElementById("projectLengthValue");
const projectIndex=document.getElementById("projectIndex");
const projectIndexList=document.getElementById("projectIndexList");
const waterInputs=Array.from(document.querySelectorAll("[data-water-setting]"));
const cvOpen=document.getElementById("cvOpen");
const cvView=document.getElementById("cvView");
const cvBack=document.getElementById("cvBack");
const cvSectionButtons=Array.from(document.querySelectorAll("[data-cv-face]"));
const cvSphereSizeRange=document.getElementById("cvSphereSizeRange");
const cvOverlayBlurRange=document.getElementById("cvOverlayBlurRange");
const cvOverlayDimRange=document.getElementById("cvOverlayDimRange");
const cvSphereSizeValue=document.getElementById("cvSphereSizeValue");
const cvOverlayBlurValue=document.getElementById("cvOverlayBlurValue");
const cvOverlayDimValue=document.getElementById("cvOverlayDimValue");
const cvPanels=Array.from(document.querySelectorAll(".cv-panel"));
const STORAGE_ASSETS="portfolioSphere.assets";
const STORAGE_CV="portfolioSphere.cvNodes";
const STORAGE_WATER="portfolioSphere.waterEffects.v1";
const bootstrapData=readBootstrapData();
const sphereSettings=bootstrapData.sphereSettings||window.PORTFOLIO_BOOTSTRAP?.sphereSettings||{};
const MAX_VISIBLE_ITEMS=Math.round(clampSetting(sphereSettings.itemCount,50,10,100));sizeRange.value=String(clampSetting(sphereSettings.size,0.6,0.1,1));scaleRange.value=String(clampSetting(sphereSettings.elementScale,0.6,0.1,1));fisheyeRange.value=String(clampSetting(sphereSettings.fisheye,0.15,0,1));projectScaleRange.value=String(clampSetting(sphereSettings.projectScale,0.5,0.4,1.6));projectGapRange.value=String(clampSetting(sphereSettings.projectGap,0.5,0.5,2));projectWidthRange.value=String(clampSetting(sphereSettings.projectWidth,0.75,0.6,1.6));projectLengthRange.value=String(clampSetting(sphereSettings.projectLength,1.25,0.5,1.8));document.documentElement.dataset.sphereMaxVisibleItems=String(MAX_VISIBLE_ITEMS);
const defaultAssets=window.PORTFOLIO_SUPABASE?[]:(window.SPHERE_ASSETS||[]).slice(0,100);
const bootstrapAssets=normalizeAssets(bootstrapData.assets||window.PORTFOLIO_BOOTSTRAP?.assets||[]);
const bootstrapProjectAssets=normalizeAssets(bootstrapData.projectAssets||window.PORTFOLIO_BOOTSTRAP?.projectAssets||[]);
let assets=bootstrapAssets.length?bootstrapAssets:loadStoredAssets();
let projectMediaAssets=bootstrapProjectAssets.length?bootstrapProjectAssets:assets;
let items=[];
let projectMediaItems=[];
let width=0;
let height=0;
let dpr=1;
let dragging=false;
let pointer={x:0,y:0};
let pointerStart={x:0,y:0};
let pointerMoved=false;
let rotation={x:-0.22,y:0.48};
let velocity={x:0.0011,y:0.0023};
let targetVelocity={x:0.0011,y:0.0023};
let direction={x:clampSetting(sphereSettings.rotationX,0.14,-0.32,0.32),y:clampSetting(sphereSettings.rotationY,-0.09,-0.32,0.32)};
let hovering=false;
let introStart=performance.now();
let hitTargets=[];
let viewMode="sphere";
let transitionTarget=0;
let transitionProgress=0;
let ribbonOffset=0;
let ribbonTargetOffset=0;
let ribbonVelocity=0;
let ribbonLastInputAt=0;
let ribbonAutoPausedUntil=0;
let ribbonAutoSpeed=0;
let ribbonAutoDirection=1;
let ribbonAutoPhaseStartedAt=0;
let projectFocusTarget=0;
let projectFocusProgress=0;
let projectZoomTarget=0;
let projectZoomProgress=0;
let activeProjectKey="";
let sphereProjectFocusKey="";
let sphereProjectFocusSrc="";
let sphereProjectFocusTarget=0;
let sphereProjectFocusProgress=0;
let sphereProjectFocusRotation={x:rotation.x,y:rotation.y};
const sphereProjectShownSources=new Map();
let cvLook="center";
let cvCamera={yaw:0,pitch:0};
let cvTargetCamera={yaw:0,pitch:0};
let cvWheelAccumulator=0;
let cvWheelLastAt=0;
let cvWheelLockedUntil=0;
let cvBoxYaw=0;
let cvBoxPitch=0;
let cvBoxVelocity={yaw:0.0022,pitch:0.0011};document.documentElement.dataset.sphereRuntimeStarted="true";
let cvActiveFace="center";
let cvTargetBox={yaw:0,pitch:0};
let cvSphereRotation={x:-0.18,y:0.36};
const cvSceneState={sphereSize:0.72,blur:18,dim:45};
const state={sphereSize:Number(sizeRange.value),elementScale:Number(scaleRange.value),fisheye:Number(fisheyeRange.value)};
const projectState={itemScale:0.5,itemCount:50,gap:0.5,cylinderWidth:0.75,cylinderLength:1.25};function clampSetting(value,fallback,min,max){const numeric=Number(value);return Math.max(min,Math.min(max,Number.isFinite(numeric)?numeric:fallback));}
const waterDefaults={transparency:75,frost:5};
let waterState={...waterDefaults};
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);width=window.innerWidth;height=window.innerHeight;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
function progress(input){return(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min));}
function updateUi(){state.sphereSize=Number(sizeRange.value);state.elementScale=Number(scaleRange.value);state.fisheye=Number(fisheyeRange.value);sizeDial?.style.setProperty("--progress",progress(sizeRange).toFixed(4));scaleDial?.style.setProperty("--progress",progress(scaleRange).toFixed(4));sizeValue.textContent=state.sphereSize>=1?"1.0":state.sphereSize.toFixed(1);sizeValue.classList.toggle("is-max",state.sphereSize>=1);scaleValue.textContent=state.elementScale.toFixed(2);if(fisheyeValue)fisheyeValue.textContent=state.fisheye.toFixed(2);}
function updateProjectUi(){projectState.itemScale=Number(projectScaleRange.value);projectState.itemCount=Math.round(Number(projectCountRange.value));projectState.gap=Number(projectGapRange.value);projectState.cylinderWidth=Number(projectWidthRange.value);projectState.cylinderLength=Number(projectLengthRange.value);projectScaleValue.textContent=projectState.itemScale.toFixed(2);projectCountValue.textContent=String(projectState.itemCount);projectGapValue.textContent=projectState.gap.toFixed(2);projectWidthValue.textContent=projectState.cylinderWidth.toFixed(2);projectLengthValue.textContent=projectState.cylinderLength.toFixed(2);}
function loadWaterSettings(){try{return{...waterDefaults,...JSON.parse(localStorage.getItem(STORAGE_WATER)||"{}")};}catch{return{...waterDefaults};}}
function updateWaterUi(save=true){waterInputs.forEach((input)=>{const key=input.dataset.waterSetting;waterState[key]=clampSetting(input.value,waterDefaults[key],0,100);const value=document.querySelector(`[data-water-value="${key}"]`);if(value)value.textContent=String(Math.round(waterState[key]));});spherePage.style.setProperty("--water-tint",(0.9*(1-waterState.transparency/100)).toFixed(3));spherePage.style.setProperty("--water-blur",`${(waterState.frost*0.24).toFixed(1)}px`);spherePage.style.setProperty("--water-scale",(1+waterState.frost*0.001).toFixed(3));if(save){try{localStorage.setItem(STORAGE_WATER,JSON.stringify(waterState));}catch{}}}
function initializeWaterEffects(){waterState=loadWaterSettings();waterInputs.forEach((input)=>{const key=input.dataset.waterSetting;input.value=String(clampSetting(waterState[key],waterDefaults[key],0,100));input.addEventListener("input",()=>updateWaterUi(true));});updateWaterUi(false);}
function effectiveElementScale(){return 0.2+state.elementScale*2.8;}
function fibonacciPoint(index,total){const offset=2/total;
const increment=Math.PI*(3-Math.sqrt(5));
const y=index*offset-1+offset/2;
const r=Math.sqrt(Math.max(0,1-y*y));
const phi=index*increment;return{x:Math.cos(phi)*r,y,z:Math.sin(phi)*r};}
function rotate(point){const cosY=Math.cos(rotation.y);
const sinY=Math.sin(rotation.y);
const cosX=Math.cos(rotation.x);
const sinX=Math.sin(rotation.x);
const x1=point.x*cosY-point.z*sinY;
const z1=point.x*sinY+point.z*cosY;
const y1=point.y*cosX-z1*sinX;
const z2=point.y*sinX+z1*cosX;return{x:x1,y:y1,z:z2};}
function exposeLoadedProjectDiagnostics(){const loaded={};
const failed={};items.forEach((item)=>{const key=item.projectId||"missing";if(item.loaded)loaded[key]=(loaded[key]||0)+1;if(item.loadFailed)failed[key]=(failed[key]||0)+1;});document.documentElement.dataset.sphereLoadedProjectCounts=JSON.stringify(loaded);document.documentElement.dataset.sphereFailedProjectCounts=JSON.stringify(failed);}
function startMediaItemLoad(item){if(item.loadStarted)return;item.loadStarted=true;item.img.onload=()=>{item.loaded=true;item.loadFailed=false;if(item.trackDiagnostics)exposeLoadedProjectDiagnostics();};item.img.onerror=()=>{item.loaded=false;item.loadFailed=true;if(item.trackDiagnostics)exposeLoadedProjectDiagnostics();};item.img.src=item.src;}
function createMediaItems(nextAssets,trackDiagnostics,eager=true){const nextItems=nextAssets.map((asset,index)=>{const img=new Image();img.decoding="async";return{img,src:asset.src,title:asset.title||`Work ${index + 1}`,projectId:asset.projectId||asset.project_id||"",loaded:false,loadFailed:false,loadStarted:false,trackDiagnostics};});if(eager)nextItems.forEach(startMediaItemLoad);return nextItems;}
function loadItems(nextAssets){items=createMediaItems(nextAssets.slice(0,MAX_VISIBLE_ITEMS),true,true);projectMediaItems=createMediaItems(projectMediaAssets.length?projectMediaAssets:nextAssets,false,false);sphereProjectShownSources.clear();document.documentElement.dataset.sphereRuntimeItemCount=String(items.length);document.documentElement.dataset.projectMediaItemCount=String(projectMediaItems.length);document.documentElement.dataset.projectMediaLoadedCount="0";renderProjectIndex();updateUi();}
function imageRatio(item){return item.loaded&&item.img.naturalHeight?item.img.naturalWidth/item.img.naturalHeight:0.74;}
function ribbonSlot(item,ribbonRadius,maxAngle){const ratio=Math.max(0.45,Math.min(2.4,imageRatio(item)));
const baseWidth=112*effectiveElementScale()*1.92*Math.sqrt(ratio);
let slot=Math.max(0.2,Math.min(0.7,(baseWidth+Math.max(48,width*0.045))/Math.max(1,ribbonRadius)));for(let pass=0;pass<3;pass++){const side=Math.min(1,Math.abs(slot)/maxAngle);
const visualScale=1+side*2;
const projectedWidth=baseWidth*visualScale*Math.max(0.42,1-Math.abs(Math.sin(slot))*0.38);
const gap=Math.max(54,Math.min(92,width*0.048));slot=Math.max(0.22,Math.min(0.82,(projectedWidth+gap)/Math.max(1,ribbonRadius)));}return slot*projectState.gap;}
function smoothstep(value){const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);}
function projectActive(){return viewMode==="project"||transitionProgress>0.6;}
function touchRibbon(delta){if(projectFocusTarget>0||projectFocusProgress>0.05)return;ribbonVelocity+=delta;ribbonLastInputAt=performance.now();ribbonAutoPausedUntil=ribbonLastInputAt+5000;ribbonAutoSpeed=0;ribbonAutoPhaseStartedAt=0;}
function ribbonAngle(index,total,slots){const normalizedOffset=((ribbonOffset%total)+total)%total;
const anchor=Math.floor(normalizedOffset);
const fraction=normalizedOffset-anchor;
const rel=Math.round(wrappedRelative(index,anchor,total));
let angle=-fraction*slots[anchor];if(rel>0){for(let step=0;step<rel;step++){const from=(anchor+step)%total;
const to=(from+1)%total;angle+=(slots[from]+slots[to])*0.5;}}else if(rel<0){for(let step=0;step>rel;step--){const from=(anchor+step+total)%total;
const to=(from-1+total)%total;angle-=(slots[from]+slots[to])*0.5;}}return angle;}
function drawCard(entry){const{item,x,y,z,depth,mode="sphere",alphaBoost=1}=entry;
const nearScale=mode==="ribbon"?1.85+depth*0.15:0.58+depth*0.88;
const visualScale=(entry.visualScale||1)*(mode==="ribbon"?projectState.itemScale:1);
const ratio=imageRatio(item);
const base=112*effectiveElementScale()*nearScale*visualScale;
let cardW=base*Math.sqrt(ratio);
let cardH=base/Math.sqrt(ratio);if(mode==="ribbon"&&entry.centerFocus>0.5&&projectFocusProgress>0.001){const viewportMargin=width<700?24:48;const targetHeight=Math.max(120,height-viewportMargin*2);const focusFit=1+(targetHeight/cardH-1)*projectFocusProgress;cardW*=focusFit;cardH*=focusFit;}
const alpha=mode==="ribbon"?alphaBoost:(0.22+depth*0.78)*alphaBoost;
const dxFromCenter=x-width/2;
const dyFromCenter=y-height/2;
const screenDistance=Math.min(1,Math.hypot(dxFromCenter,dyFromCenter)/Math.max(1,Math.min(width,height)*0.48));
const distortion=mode==="sphere"?screenDistance*screenDistance*state.fisheye:0;
const angle=Math.atan2(dyFromCenter,dxFromCenter);
const radialScale=1+distortion*0.72;
const tangentScale=Math.max(0.72,1-distortion*0.18);
const hitW=cardW*Math.max(radialScale,tangentScale);
const hitH=cardH*Math.max(radialScale,tangentScale);if(alpha>0.02)entry.hit={item,index:entry.index,x,y,z,w:hitW,h:hitH};else delete entry.hit;ctx.save();ctx.translate(x,y);if(mode==="ribbon"){const side=Math.max(-1,Math.min(1,(x-width/2)/Math.max(1,width*0.5)));
const faceTurn=entry.faceTurn||0;
const compress=Math.max(0.42,1-Math.abs(faceTurn)*0.38);ctx.transform(compress,0,0,1,0,0);}else{ctx.rotate(angle);ctx.scale(radialScale,tangentScale);ctx.rotate(-angle);}ctx.globalAlpha=alpha;if(item.loaded&&item.img.naturalWidth){ctx.drawImage(item.img,-cardW/2,-cardH/2,cardW,cardH);}else{const gradient=ctx.createLinearGradient(-cardW/2,-cardH/2,cardW/2,cardH/2);gradient.addColorStop(0,"rgba(255,255,255,0.18)");gradient.addColorStop(1,"rgba(255,255,255,0.04)");ctx.fillStyle=gradient;ctx.fillRect(-cardW/2,-cardH/2,cardW,cardH);}ctx.restore();}
function getVisibleItems(){return mixSpatialItems(items.slice(0,Math.min(MAX_VISIBLE_ITEMS,items.length)));}
function projectKey(item){return item?.projectId||item?.title||item?.src||"";}
function setProjectIndexActive(key){projectIndexList?.querySelectorAll(".project-index-button").forEach((button)=>{button.classList.toggle("is-active",button.dataset.projectKey===key);});}
function renderProjectIndex(){if(!projectIndex||!projectIndexList)return;
const projects=new Map();(projectMediaItems.length?projectMediaItems:items).forEach((item)=>{const key=projectKey(item);if(key&&!projects.has(key)){projects.set(key,item.title||"Проект");}});projectIndexList.innerHTML="";projects.forEach((title,key)=>{const button=document.createElement("button");button.className="project-index-button";button.type="button";button.dataset.projectKey=key;button.textContent=title;button.addEventListener("click",()=>focusSphereProject(key));projectIndexList.appendChild(button);});projectIndex.hidden=!projects.size;setProjectIndexActive(sphereProjectFocusKey);}
function nearestAngle(current,target){return current+Math.atan2(Math.sin(target-current),Math.cos(target-current));}
function clearSphereProjectFocus(){sphereProjectFocusTarget=0;sphereProjectFocusKey="";sphereProjectFocusSrc="";delete document.documentElement.dataset.sphereFocusedProject;delete document.documentElement.dataset.sphereFocusedSource;setProjectIndexActive("");}
function focusSphereProject(key){if(viewMode!=="sphere")return;
const visibleItems=getVisibleItems();
const projectCandidates=visibleItems.map((item,index)=>({item,index,point:fibonacciPoint(index,visibleItems.length)})).filter((entry)=>projectKey(entry.item)===key);if(!projectCandidates.length)return;
let shownSources=sphereProjectShownSources.get(key)||new Set();
let candidates=projectCandidates.filter((entry)=>!shownSources.has(entry.item.src));if(!candidates.length){shownSources=new Set();candidates=projectCandidates.filter((entry)=>entry.item.src!==sphereProjectFocusSrc);if(!candidates.length)candidates=projectCandidates;}
const selected=candidates.reduce((best,entry)=>rotate(entry.point).z>rotate(best.point).z?entry:best,candidates[0]);
shownSources.add(selected.item.src);sphereProjectShownSources.set(key,shownSources);
const horizontal=Math.hypot(selected.point.x,selected.point.z);
const targetY=Math.atan2(selected.point.x,selected.point.z);
const targetX=Math.atan2(selected.point.y,horizontal);
sphereProjectFocusKey=key;sphereProjectFocusSrc=selected.item.src;sphereProjectFocusTarget=1;sphereProjectFocusRotation={x:nearestAngle(rotation.x,targetX),y:nearestAngle(rotation.y,targetY)};velocity.x=0;velocity.y=0;targetVelocity.x=0;targetVelocity.y=0;document.documentElement.dataset.sphereFocusedProject=key;document.documentElement.dataset.sphereFocusedSource=selected.item.src;document.documentElement.dataset.sphereProjectShownCount=String(shownSources.size);setProjectIndexActive(key);}
function initialSphereSlot(index,count){const point=fibonacciPoint(index,count);
const cosY=Math.cos(0.48);
const sinY=Math.sin(0.48);
const cosX=Math.cos(-0.22);
const sinX=Math.sin(-0.22);
const x1=point.x*cosY-point.z*sinY;
const z1=point.x*sinY+point.z*cosY;
const y1=point.y*cosX-z1*sinX;
const z2=point.y*sinX+z1*cosX;return{index,depth:z2,angle:Math.atan2(y1,x1),radius:Math.hypot(x1,y1)};}
function mixSpatialItems(sourceItems){if(sourceItems.length<3)return sourceItems;
const groups=new Map();sourceItems.forEach((item)=>{const key=projectKey(item);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);});
const queues=Array.from(groups.entries()).map(([key,groupItems])=>({key,title:groupItems[0]?.title||"",items:groupItems.slice()})).filter((group)=>group.items.length);if(queues.length<2)return sourceItems;
const allSlots=sourceItems.map((_,index)=>initialSphereSlot(index,sourceItems.length));
const frontCandidates=allSlots.filter((slot)=>slot.depth>0.1);
const anchorSlots=[];
const anchorCount=Math.min(frontCandidates.length,queues.length*3);for(let anchorIndex=0;anchorIndex<anchorCount;anchorIndex++){const targetAngle=-Math.PI+(Math.PI*2*anchorIndex)/anchorCount;
const targetRadius=0.42+(Math.floor(anchorIndex/queues.length)%3)*0.12;
let bestIndex=0;
let bestScore=-Infinity;frontCandidates.forEach((slot,index)=>{const angleDistance=Math.abs(Math.atan2(Math.sin(slot.angle-targetAngle),Math.cos(slot.angle-targetAngle)));
const score=slot.depth*1.4-angleDistance*0.75-Math.abs(slot.radius-targetRadius)*1.2;if(score>bestScore){bestScore=score;bestIndex=index;}});anchorSlots.push(frontCandidates.splice(bestIndex,1)[0]);}const anchorIndexes=new Set(anchorSlots.map((slot)=>slot.index));
const depthSortedSlots=allSlots.filter((slot)=>!anchorIndexes.has(slot.index)).sort((a,b)=>b.depth-a.depth);
const slots=[];
const bandSize=Math.max(queues.length,queues.length*2);for(let start=0;start<depthSortedSlots.length;start+=bandSize){slots.push(...depthSortedSlots.slice(start,start+bandSize).sort((a,b)=>a.angle-b.angle));}const mixed=new Array(sourceItems.length);anchorSlots.forEach((slot,index)=>{const group=queues[index%queues.length];mixed[slot.index]=group.items.shift();});
let slotIndex=0;
let cycle=0;while(slotIndex<slots.length&&queues.some((group)=>group.items.length)){const active=queues.filter((group)=>group.items.length);
const start=cycle%active.length;for(let offset=0;offset<active.length&&slotIndex<slots.length;offset++){co…5484 tokens truncated…":"rgba(0,0,0,0.92)";ctx.fill();const shade=ctx.createLinearGradient(points[0].x,points[0].y,points[2].x,points[2].y);shade.addColorStop(0,"rgba(255,255,255,0.08)");shade.addColorStop(0.48,"rgba(255,255,255,0.015)");shade.addColorStop(1,"rgba(0,0,0,0.36)");ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle=active?"rgba(255,255,255,0.42)":"rgba(255,255,255,0.2)";ctx.lineWidth=active?1.35:0.85;ctx.stroke();ctx.restore();
const center=points.reduce((acc,point)=>({x:acc.x+point.x/points.length,y:acc.y+point.y/points.length,scale:acc.scale+point.scale/points.length}),{x:0,y:0,scale:0});
const node=face.node;
const mobile=width<700;
const faceWidth=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y);
const textScale=Math.max(0.52,Math.min(1.22,center.scale*1.22))*(active?1.08:0.92);
ctx.save();ctx.translate(center.x,center.y);ctx.globalAlpha=(active?0.96:0.52)*facing;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`700 ${Math.max(9,(mobile?9:11)*textScale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(cvBoxLabel(node),0,-58*textScale);ctx.font=`700 ${Math.max(20,(node.type==="hero"?(mobile?40:58):(mobile?28:40))*textScale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(node.title,0,-12*textScale);ctx.globalAlpha=(active?0.74:0.38)*facing;const bodySize=Math.max(11,(mobile?13:15)*textScale);const bodyFont=`${bodySize}px Helvetica Neue, Helvetica, Arial, sans-serif`;const lines=wrapText(node.body,Math.max(140,faceWidth*0.54),bodyFont).slice(0,mobile?3:4);ctx.font=bodyFont;lines.forEach((line,index)=>ctx.fillText(line,0,34*textScale+index*bodySize*1.45));ctx.restore();}
function drawCvRectangularCube(){ctx.save();ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);const sourceNodes=cvNodes.length?cvNodes:defaultCvNodes;cvBoxVelocity.yaw*=0.992;cvBoxVelocity.pitch*=0.992;cvBoxVelocity.yaw+=0.000012;cvBoxVelocity.pitch+=0.000005;cvBoxVelocity.yaw=Math.max(-0.035,Math.min(0.035,cvBoxVelocity.yaw));cvBoxVelocity.pitch=Math.max(-0.026,Math.min(0.026,cvBoxVelocity.pitch));cvBoxYaw+=cvBoxVelocity.yaw;cvBoxPitch+=cvBoxVelocity.pitch;cvBoxPitch=Math.max(-1.18,Math.min(1.18,cvBoxPitch));const mobile=width<700;const centerX=width/2;const centerY=height*(mobile?0.58:0.56);const boxScale=Math.min(mobile?width*0.88:width*0.54,height*0.72);const halfW=boxScale*0.5;const halfH=boxScale*(mobile?0.34:0.3);const halfD=boxScale*0.36;const focal=mobile?560:740;const cameraZ=mobile?880:980;const vertices={ntl:{x:-halfW,y:-halfH,z:halfD},ntr:{x:halfW,y:-halfH,z:halfD},nbr:{x:halfW,y:halfH,z:halfD},nbl:{x:-halfW,y:halfH,z:halfD},ftl:{x:-halfW,y:-halfH,z:-halfD},ftr:{x:halfW,y:-halfH,z:-halfD},fbr:{x:halfW,y:halfH,z:-halfD},fbl:{x:-halfW,y:halfH,z:-halfD}};
Object.keys(vertices).forEach((key)=>{vertices[key]=cvRotateBoxPoint(vertices[key],cvBoxYaw,cvBoxPitch);});
const faces=[{look:"center",node:cvBoxNodeForLook("center",sourceNodes),points:[vertices.ntl,vertices.ntr,vertices.nbr,vertices.nbl],depthBias:120},{look:"right",node:cvBoxNodeForLook("right",sourceNodes),points:[vertices.ntr,vertices.ftr,vertices.fbr,vertices.nbr],depthBias:30},{look:"left",node:cvBoxNodeForLook("left",sourceNodes),points:[vertices.ftl,vertices.ntl,vertices.nbl,vertices.fbl],depthBias:30},{look:"top",node:cvBoxNodeForLook("top",sourceNodes),points:[vertices.ftl,vertices.ftr,vertices.ntr,vertices.ntl],depthBias:10},{look:"bottom",node:cvBoxNodeForLook("bottom",sourceNodes),points:[vertices.nbl,vertices.nbr,vertices.fbr,vertices.fbl],depthBias:10},{look:"back",node:cvBoxNodeForLook("right",sourceNodes),points:[vertices.ftr,vertices.ftl,vertices.fbl,vertices.fbr],depthBias:-80}];
faces.forEach((face)=>{face.avgZ=face.points.reduce((sum,point)=>sum+point.z,0)/face.points.length;});const maxZ=Math.max(...faces.map((face)=>face.avgZ));faces.forEach((face)=>{face.active=face.avgZ===maxZ;});faces.sort((a,b)=>a.avgZ-b.avgZ).forEach((face)=>drawCvBoxFace(face,centerX,centerY,focal,cameraZ));ctx.restore();}
function render(){ctx.clearRect(0,0,width,height);if(viewMode==="cv"){drawCvRectangularCube();requestAnimationFrame(render);return;}transitionProgress+=(transitionTarget-transitionProgress)*0.075;projectFocusProgress+=(projectFocusTarget-projectFocusProgress)*0.065;projectZoomProgress+=(projectZoomTarget-projectZoomProgress)*0.08;sphereProjectFocusProgress+=(sphereProjectFocusTarget-sphereProjectFocusProgress)*0.08;if(Math.abs(projectFocusTarget-projectFocusProgress)<0.002){projectFocusProgress=projectFocusTarget;}if(Math.abs(projectZoomTarget-projectZoomProgress)<0.002){projectZoomProgress=projectZoomTarget;}if(Math.abs(sphereProjectFocusTarget-sphereProjectFocusProgress)<0.002){sphereProjectFocusProgress=sphereProjectFocusTarget;}if(Math.abs(transitionTarget-transitionProgress)<0.002){transitionProgress=transitionTarget;}if(projectActive()){const now=performance.now();
const autoMoving=updateRibbonAutoscroll(now);ribbonTargetOffset+=ribbonVelocity;ribbonVelocity*=dragging?0.72:0.9;if(Math.abs(ribbonVelocity)<0.0005){ribbonVelocity=0;}const idleTime=now-ribbonLastInputAt;if(!autoMoving&&!dragging&&idleTime>260&&Math.abs(ribbonVelocity)<0.018){const snapIndex=Math.round(ribbonTargetOffset);ribbonTargetOffset+=(snapIndex-ribbonTargetOffset)*0.12;if(Math.abs(snapIndex-ribbonTargetOffset)<0.001){ribbonTargetOffset=snapIndex;}syncCenteredProjectTitle();}else if(autoMoving){syncCenteredProjectTitle();}}ribbonOffset+=(ribbonTargetOffset-ribbonOffset)*0.075;
const hoverFactor=hovering?0.42:1.18;if(sphereProjectFocusTarget>0||sphereProjectFocusProgress>0.002){rotation.x+=(sphereProjectFocusRotation.x-rotation.x)*0.085;rotation.y+=(sphereProjectFocusRotation.y-rotation.y)*0.085;velocity.x*=0.8;velocity.y*=0.8;targetVelocity.x*=0.8;targetVelocity.y*=0.8;}else{targetVelocity.x+=direction.y*0.000006;targetVelocity.y+=direction.x*0.000006;targetVelocity.x*=0.998;targetVelocity.y*=0.998;targetVelocity.x=Math.max(-0.02,Math.min(0.02,targetVelocity.x));targetVelocity.y=Math.max(-0.02,Math.min(0.02,targetVelocity.y));velocity.x+=(targetVelocity.x-velocity.x)*0.055;velocity.y+=(targetVelocity.y-velocity.y)*0.055;rotation.x+=velocity.x*2.18*hoverFactor;rotation.y+=velocity.y*2.18*hoverFactor;}
const visibleItems=getRenderItems();
const sphereEntries=getSphereEntries(visibleItems);
const ribbonEntries=getRibbonEntries(visibleItems);
const eased=transitionProgress*transitionProgress*(3-2*transitionProgress);
const entries=sphereEntries.map((sphereEntry,index)=>{const ribbonEntry=ribbonEntries[index];const sphereScale=sphereEntry.visualScale||1;const sphereAlpha=sphereEntry.alphaBoost??1;return{item:sphereEntry.item,index,x:sphereEntry.x+(ribbonEntry.x-sphereEntry.x)*eased,y:sphereEntry.y+(ribbonEntry.y-sphereEntry.y)*eased,z:sphereEntry.z+(ribbonEntry.z-sphereEntry.z)*eased,depth:sphereEntry.depth+(ribbonEntry.depth-sphereEntry.depth)*eased,mode:eased>0.55?"ribbon":"sphere",faceTurn:(ribbonEntry.faceTurn||0)*eased,visualScale:sphereScale+((ribbonEntry.visualScale||1)-sphereScale)*eased,alphaBoost:sphereAlpha+((ribbonEntry.alphaBoost??1)-sphereAlpha)*eased,centerFocus:(ribbonEntry.centerFocus||0)*eased};}).sort((a,b)=>a.z-b.z);drawRibbonAtmosphere(eased);hitTargets=[];
const focusedEntries=projectFocusProgress>0.01?entries.filter((entry)=>entry.centerFocus>0.5):[];
const backgroundEntries=focusedEntries.length?entries.filter((entry)=>entry.centerFocus<=0.5):entries;backgroundEntries.forEach((entry)=>{drawCard(entry);if(entry.hit)hitTargets.push(entry.hit);});if(focusedEntries.length){ctx.save();ctx.globalAlpha=0.5*projectFocusProgress;ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);ctx.restore();focusedEntries.forEach((entry)=>{drawCard(entry);if(entry.hit)hitTargets.push(entry.hit);});}requestAnimationFrame(render);}
function drawCvRectangularCube(){ctx.save();ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);drawCvBackgroundSphere();const sourceNodes=cvNodes.length?cvNodes:defaultCvNodes;const targetYaw=cvNearestAngle(cvBoxYaw,cvTargetBox.yaw);cvBoxYaw+=(targetYaw-cvBoxYaw)*0.055;cvBoxPitch+=(cvTargetBox.pitch-cvBoxPitch)*0.055;if(!dragging&&Math.abs(targetYaw-cvBoxYaw)<0.035&&Math.abs(cvTargetBox.pitch-cvBoxPitch)<0.035){cvBoxYaw+=Math.sin(performance.now()*0.00042)*0.00034;cvBoxPitch+=Math.cos(performance.now()*0.00037)*0.00016;}if(dragging){cvBoxYaw+=cvBoxVelocity.yaw;cvBoxPitch+=cvBoxVelocity.pitch;cvBoxVelocity.yaw*=0.94;cvBoxVelocity.pitch*=0.94;}cvBoxPitch=Math.max(-1.18,Math.min(1.18,cvBoxPitch));const mobile=width<700;const centerX=width/2;const centerY=height*(mobile?0.58:0.56);const boxScale=Math.min(mobile?width*0.88:width*0.54,height*0.72);const halfW=boxScale*0.5;const halfH=boxScale*(mobile?0.34:0.3);const halfD=boxScale*0.36;const focal=mobile?560:740;const cameraZ=mobile?880:980;const v={ntl:{x:-halfW,y:-halfH,z:halfD},ntr:{x:halfW,y:-halfH,z:halfD},nbr:{x:halfW,y:halfH,z:halfD},nbl:{x:-halfW,y:halfH,z:halfD},ftl:{x:-halfW,y:-halfH,z:-halfD},ftr:{x:halfW,y:-halfH,z:-halfD},fbr:{x:halfW,y:halfH,z:-halfD},fbl:{x:-halfW,y:halfH,z:-halfD}};Object.keys(v).forEach((key)=>{v[key]=cvRotateBoxPoint(v[key],cvBoxYaw,cvBoxPitch);});const faces=[{look:"center",node:cvBoxNodeForLook("center",sourceNodes),points:[v.ntl,v.ntr,v.nbr,v.nbl],depthBias:120},{look:"right",node:cvBoxNodeForLook("right",sourceNodes),points:[v.ntr,v.ftr,v.fbr,v.nbr],depthBias:30},{look:"left",node:cvBoxNodeForLook("left",sourceNodes),points:[v.ftl,v.ntl,v.nbl,v.fbl],depthBias:30},{look:"top",node:cvBoxNodeForLook("top",sourceNodes),points:[v.ftl,v.ftr,v.ntr,v.ntl],depthBias:10},{look:"bottom",node:cvBoxNodeForLook("bottom",sourceNodes),points:[v.nbl,v.nbr,v.fbr,v.fbl],depthBias:10},{look:"back",node:cvBoxNodeForLook("right",sourceNodes),points:[v.ftr,v.ftl,v.fbl,v.fbr],depthBias:-80}];faces.forEach((face)=>{face.avgZ=face.points.reduce((sum,point)=>sum+point.z,0)/face.points.length;face.active=face.look===cvActiveFace;});faces.sort((a,b)=>a.avgZ-b.avgZ).forEach((face)=>drawCvBoxFace(face,centerX,centerY,focal,cameraZ));ctx.restore();}
function cvBoxLabel(node){return cvFaceLabels[node.look]||node.title||"Раздел";}
function findHit(clientX,clientY){return hitTargets.filter((target)=>(Math.abs(clientX-target.x)<=target.w/2&&Math.abs(clientY-target.y)<=target.h/2)).sort((a,b)=>b.z-a.z)[0];}
function openProject(item){clearSphereProjectFocus();activeProjectKey=projectKey(item);
const projectItems=getProjectItems();
projectCountRange.value=String(Math.min(Number(projectCountRange.max),Math.max(1,projectItems.length)));updateProjectUi();
const index=Math.max(0,projectItems.findIndex((candidate)=>candidate.src===item.src));document.documentElement.dataset.activeProjectItemCount=String(projectItems.length);ribbonTargetOffset=index;ribbonOffset=index;ribbonVelocity=0;ribbonAutoSpeed=0;ribbonAutoPhaseStartedAt=0;ribbonAutoPausedUntil=performance.now()+5000;projectFocusTarget=0;projectFocusProgress=0;projectZoomTarget=0;projectZoomProgress=0;transitionTarget=1;viewMode="project";spherePage.classList.add("is-project");projectTitle.textContent=projectLabel(item,index);projectViewUi.hidden=false;projectViewUi.classList.remove("is-media-open");}
function toggleProjectMedia(){if(viewMode!=="project")return;
const opening=projectFocusTarget<0.5;projectFocusTarget=opening?1:0;projectZoomTarget=0;projectZoomProgress=0;projectViewUi.classList.toggle("is-media-open",opening);ribbonVelocity=0;ribbonAutoSpeed=0;ribbonAutoPhaseStartedAt=0;ribbonAutoPausedUntil=performance.now()+(opening?600000:5000);if(opening){
const centeredIndex=Math.round(ribbonOffset);ribbonOffset=centeredIndex;ribbonTargetOffset=centeredIndex;syncCenteredProjectTitle();}}
function centerProjectItem(item,index){const visibleItems=getProjectItems();
const nextIndex=Number.isFinite(index)?index:visibleItems.findIndex((candidate)=>candidate===item);if(nextIndex>=0){ribbonTargetOffset=nextIndex;ribbonVelocity=0;ribbonAutoSpeed=0;ribbonLastInputAt=performance.now();ribbonAutoPausedUntil=ribbonLastInputAt+5000;ribbonAutoPhaseStartedAt=0;projectTitle.textContent=projectLabel(item,nextIndex);}}
function syncCenteredProjectTitle(){if(viewMode!=="project")return;
const visibleItems=getProjectItems();if(!visibleItems.length)return;
const index=((Math.round(ribbonTargetOffset)%visibleItems.length)+visibleItems.length)%visibleItems.length;projectTitle.textContent=projectLabel(visibleItems[index],index);}
function closeProject(){document.documentElement.dataset.activeProjectItemCount="0";projectFocusTarget=0;projectFocusProgress=0;projectZoomTarget=0;projectZoomProgress=0;transitionTarget=0;viewMode="sphere";activeProjectKey="";spherePage.classList.remove("is-project");projectViewUi.hidden=true;projectViewUi.classList.remove("is-media-open");}
function openCv(){closeProject();viewMode="cv";transitionTarget=0;transitionProgress=0;cvWheelAccumulator=0;cvWheelLockedUntil=0;cvBoxYaw=-0.38;cvBoxPitch=0.22;cvBoxVelocity={yaw:0,pitch:0};setCvFace("center",false);updateCvSceneUi();spherePage.classList.add("is-cv");cvView.hidden=false;}
function closeCv(){viewMode="sphere";cvWheelAccumulator=0;spherePage.classList.remove("is-cv");cvView.hidden=true;}
function renderCvCamera(look){const deg=Math.PI/180;
const horizontalLook=58;
const verticalLook=44;
const panels={center:{yaw:0,pitch:0,scale:0.78,distance:1.36},top:{yaw:0,pitch:verticalLook,scale:0.92,distance:0.82},bottom:{yaw:0,pitch:-verticalLook,scale:0.92,distance:0.82},left:{yaw:-horizontalLook,pitch:0,scale:0.92,distance:0.82},right:{yaw:horizontalLook,pitch:0,scale:0.92,distance:0.82},};
const camera=panels[look]||panels.center;
const viewport=Math.min(window.innerWidth,window.innerHeight);
const radius=Math.min(window.innerWidth*0.72,window.innerHeight*0.96,760);
const focal=viewport*1.18;
const depthOffset=focal*0.68;cvPanels.forEach((panel)=>{const data=panels[panel.dataset.look]||panels.center;
const panelRadius=radius*(data.distance||1);
const yaw=data.yaw*deg;
const pitch=data.pitch*deg;
let x=Math.sin(yaw)*Math.cos(pitch)*panelRadius;
let y=-Math.sin(pitch)*panelRadius;
let z=-Math.cos(yaw)*Math.cos(pitch)*panelRadius;
const cy=Math.cos(camera.yaw*deg);
const sy=Math.sin(camera.yaw*deg);
const yawX=x*cy+z*sy;
const yawZ=-x*sy+z*cy;x=yawX;z=yawZ;
const cx=Math.cos(camera.pitch*deg);
const sx=Math.sin(camera.pitch*deg);
const pitchY=y*cx-z*sx;
const pitchZ=y*sx+z*cx;y=pitchY;z=pitchZ;
const depth=Math.max(80,-z);
const projection=focal/(depth+depthOffset);
const screenX=x*projection;
const screenY=y*projection;
const yawDelta=data.yaw-camera.yaw;
const pitchDelta=data.pitch-camera.pitch;
const active=panel.dataset.look===look;
const angleDistance=Math.hypot(yawDelta/horizontalLook,pitchDelta/verticalLook);
const depthScale=Math.max(0.72,Math.min(1.08,projection*1.16));
const activeScale=panel.dataset.look==="center"?1.02:1.1;
const baseScale=data.scale*depthScale*(active?activeScale:0.98);
const opacity=active?1:Math.max(0.22,0.72-angleDistance*0.22);
const blur=active?0:Math.min(1.25,angleDistance*0.26);
const faceYaw=Math.max(-82,Math.min(82,-yawDelta*1.16));
const facePitch=Math.max(-68,Math.min(68,pitchDelta*1.16));
const layer=Math.round(3000-depth+(active&&panel.dataset.look!=="center"?90:0));panel.style.setProperty("--cv-x",`${screenX.toFixed(2)}px`);panel.style.setProperty("--cv-y",`${screenY.toFixed(2)}px`);panel.style.setProperty("--cv-scale",baseScale.toFixed(3));panel.style.setProperty("--cv-ry",`${faceYaw.toFixed(2)}deg`);panel.style.setProperty("--cv-rx",`${facePitch.toFixed(2)}deg`);panel.style.setProperty("--cv-opacity",opacity.toFixed(3));panel.style.setProperty("--cv-blur",`${blur.toFixed(2)}px`);panel.style.setProperty("--cv-z",String(layer));});}
function cvLookFromPoint(clientX,clientY){const widthRatio=clientX/Math.max(1,window.innerWidth);
const heightRatio=clientY/Math.max(1,window.innerHeight);if(heightRatio<0.28)return "top";if(heightRatio>0.72)return "bottom";if(widthRatio<0.32)return "left";if(widthRatio>0.68)return "right";return "center";}
canvas.addEventListener("pointerdown",(event)=>{if(viewMode==="cv"){dragging=true;hovering=true;pointer.x=event.clientX;pointer.y=event.clientY;pointerStart.x=event.clientX;pointerStart.y=event.clientY;pointerMoved=false;canvas.setPointerCapture(event.pointerId);return;}if(projectFocusTarget>0||projectFocusProgress>0.05){pointerStart.x=event.clientX;pointerStart.y=event.clientY;pointerMoved=false;return;}if(viewMode==="sphere"&&sphereProjectFocusTarget>0){clearSphereProjectFocus();}dragging=true;hovering=true;pointer.x=event.clientX;pointer.y=event.clientY;pointerStart.x=event.clientX;pointerStart.y=event.clientY;pointerMoved=false;canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener("pointermove",(event)=>{if(!dragging)return;
const dx=event.clientX-pointer.x;
const dy=event.clientY-pointer.y;if(Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6){pointerMoved=true;}if(viewMode==="cv"){cvBoxYaw+=dx*0.006;cvBoxPitch+=dy*0.006;cvBoxVelocity.yaw=dx*0.00045;cvBoxVelocity.pitch=dy*0.00045;pointer.x=event.clientX;pointer.y=event.clientY;return;}if(viewMode==="project"||transitionProgress>0.6){touchRibbon(-dx*0.0028);pointer.x=event.clientX;pointer.y=event.clientY;return;}rotation.y+=dx*0.005;rotation.x+=dy*0.005;targetVelocity.y+=dx*0.000022;targetVelocity.x+=dy*0.000022;pointer.x=event.clientX;pointer.y=event.clientY;});
canvas.addEventListener("pointerup",(event)=>{if(viewMode==="cv"){dragging=false;if(canvas.hasPointerCapture(event.pointerId)){canvas.releasePointerCapture(event.pointerId);}return;}if(projectFocusTarget>0||projectFocusProgress>0.05){toggleProjectMedia();return;}dragging=false;if(canvas.hasPointerCapture(event.pointerId)){canvas.releasePointerCapture(event.pointerId);}if(!pointerMoved&&(viewMode==="project"||transitionProgress>0.6)){const hit=findHit(event.clientX,event.clientY);if(hit){const items=getProjectItems();const centered=((Math.round(ribbonTargetOffset)%items.length)+items.length)%items.length;const selected=((hit.index%items.length)+items.length)%items.length;if(selected===centered){toggleProjectMedia();}else{centerProjectItem(hit.item,hit.index);}}return;}if(!pointerMoved&&transitionProgress<0.2){const hit=findHit(event.clientX,event.clientY);if(hit)openProject(hit.item);}});
canvas.addEventListener("pointerenter",()=>{hovering=true;});
canvas.addEventListener("pointerleave",()=>{hovering=false;dragging=false;});
canvas.addEventListener("wheel",(event)=>{event.preventDefault();if(viewMode==="cv"){handleCvWheel(event);return;}if(projectFocusTarget>0||projectFocusProgress>0.05)return;if(viewMode==="project"||transitionProgress>0.6){touchRibbon(event.deltaY*0.0012);return;}const nextValue=Number(sizeRange.value)-event.deltaY*0.0009;sizeRange.value=String(Math.max(Number(sizeRange.min),Math.min(Number(sizeRange.max),nextValue)));updateUi();},{passive:false});
projectBack.addEventListener("click",()=>{if(projectFocusTarget>0||projectFocusProgress>0.05){toggleProjectMedia();return;}closeProject();});
cvOpen.addEventListener("click",openCv);
cvBack.addEventListener("click",closeCv);
cvView.addEventListener("wheel",handleCvWheel,{passive:false});
cvSectionButtons.forEach((button)=>button.addEventListener("click",()=>setCvFace(button.dataset.cvFace)));
[cvSphereSizeRange,cvOverlayBlurRange,cvOverlayDimRange].forEach((input)=>input?.addEventListener("input",updateCvSceneUi));
canvas.addEventListener("pointermove",()=>{if(viewMode==="cv"&&dragging){cvTargetBox={yaw:cvBoxYaw,pitch:cvBoxPitch};}});
[sizeRange,scaleRange,fisheyeRange].forEach((input)=>{input.addEventListener("input",updateUi);});
[projectScaleRange,projectCountRange,projectGapRange,projectWidthRange,projectLengthRange].forEach((input)=>{input.addEventListener("input",updateProjectUi);});
window.addEventListener("resize",resize);resize();updateUi();updateProjectUi();initializeWaterEffects();loadItems(assets);Promise.all([loadStoredAssetsAsync(),loadStoredCvNodesAsync()]).then(([nextAssets,nextCvNodes])=>{assets=nextAssets;cvNodes=nextCvNodes;loadItems(assets);});render();})();

