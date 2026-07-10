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
const cvElementScaleRange=document.getElementById("cvElementScaleRange");
const cvOverlayBlurRange=document.getElementById("cvOverlayBlurRange");
const cvOverlayDimRange=document.getElementById("cvOverlayDimRange");
const cvSphereSizeValue=document.getElementById("cvSphereSizeValue");
const cvElementScaleValue=document.getElementById("cvElementScaleValue");
const cvOverlayBlurValue=document.getElementById("cvOverlayBlurValue");
const cvOverlayDimValue=document.getElementById("cvOverlayDimValue");
const cvPanels=Array.from(document.querySelectorAll(".cv-panel"));
const STORAGE_ASSETS="portfolioSphere.assets";
const STORAGE_CV="portfolioSphere.cvNodes";
const STORAGE_WATER="portfolioSphere.waterEffects.v1";
const bootstrapData=readBootstrapData();
const sphereSettings=bootstrapData.sphereSettings||window.PORTFOLIO_BOOTSTRAP?.sphereSettings||{};
const MAX_VISIBLE_ITEMS=Math.round(clampSetting(sphereSettings.itemCount,50,10,100));sizeRange.value=String(clampSetting(sphereSettings.size,0.6,0.1,1));scaleRange.value=String(clampSetting(sphereSettings.elementScale,0.6,0.1,1));fisheyeRange.value=String(clampSetting(sphereSettings.fisheye,0.15,0,1));projectScaleRange.value=String(clampSetting(sphereSettings.projectScale,0.5,0.4,1.6));projectGapRange.value=String(clampSetting(sphereSettings.projectGap,0.5,0.5,2));projectWidthRange.value=String(clampSetting(sphereSettings.projectWidth,0.75,0.6,1.6));projectLengthRange.value=String(clampSetting(sphereSettings.projectLength,1.25,0.5,1.8));document.documentElement.dataset.sphereMaxVisibleItems=String(MAX_VISIBLE_ITEMS);
const defaultAssets=(window.SPHERE_ASSETS||[]).slice(0,100);
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
const cvSceneState={sphereSize:0.72,elementScale:0.6,blur:18,dim:45};
let cvLastInteractionAt=performance.now();
let cvAutoPitchDirection=1;
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
const start=cycle%active.length;for(let offset=0;offset<active.length&&slotIndex<slots.length;offset++){const group=active[(start+offset)%active.length];mixed[slots[slotIndex].index]=group.items.shift();slotIndex+=1;}cycle+=1;}return mixed.filter(Boolean);}
function getProjectItems(){if(!activeProjectKey)return getVisibleItems();
const matchingItems=projectMediaItems.filter((item)=>projectKey(item)===activeProjectKey);matchingItems.forEach(startMediaItemLoad);document.documentElement.dataset.projectMediaLoadedCount=String(matchingItems.filter((item)=>item.loadStarted).length);return matchingItems.length?matchingItems:getVisibleItems();}
function getProjectRenderItems(){const source=getProjectItems();if(!source.length)return source;const target=Math.max(1,projectState.itemCount);if(target<=source.length)return source;return Array.from({length:target},(_,index)=>source[index%source.length]);}
function getRenderItems(){return projectActive()?getProjectRenderItems():getVisibleItems();}
function getSphereEntries(visibleItems){const count=visibleItems.length;
const introElapsed=Math.min(1,(performance.now()-introStart)/720);
const introScale=0.18+(1-Math.pow(1-introElapsed,3))*0.82;
const radius=Math.min(width,height)*(0.22+state.sphereSize*0.38)*introScale;
const perspective=radius*3.4;return visibleItems.map((item,index)=>{const point=rotate(fibonacciPoint(index,count));
const depth=(point.z+1)/2;
const perspectiveScale=perspective/(perspective-point.z*radius);
const selected=Boolean(sphereProjectFocusSrc&&item.src===sphereProjectFocusSrc);
const dimmed=Boolean(sphereProjectFocusKey&&projectKey(item)!==sphereProjectFocusKey);
return{item,index,x:width/2+point.x*radius*perspectiveScale,y:height/2+point.y*radius*perspectiveScale,z:point.z,depth,mode:"sphere",visualScale:1+(selected?0.15*sphereProjectFocusProgress:0),alphaBoost:dimmed?1-0.25*sphereProjectFocusProgress:1};});}
function wrappedRelative(index,offset,total){let rel=index-offset;rel=((rel+total/2)%total+total)%total-total/2;return rel;}
function getRibbonEntries(visibleItems){const total=visibleItems.length;
const ribbonRadius=Math.min(width*1.18,1760)*projectState.cylinderWidth;
const maxAngle=1.28;
const centerY=height*0.43;
const offscreenStep=width*1.4;
const slots=visibleItems.map((item)=>ribbonSlot(item,ribbonRadius,maxAngle));return visibleItems.map((item,index)=>{const rawAngle=ribbonAngle(index,total,slots);
const outside=Math.max(0,Math.abs(rawAngle)-maxAngle);
const angle=Math.max(-maxAngle,Math.min(maxAngle,rawAngle));
const side=Math.min(1,Math.abs(rawAngle)/maxAngle);
const rel=wrappedRelative(index,ribbonOffset,total);
const visibleByCount=Math.abs(rel)<=Math.max(0,(projectState.itemCount-1)/2);
const centerFade=Math.min(1,Math.abs(rel)/11);
const innerZ=(side-outside*0.08)*projectState.cylinderLength;
const sidePush=Math.sin(angle);
const edgeX=Math.sin(maxAngle)*ribbonRadius+outside*offscreenStep;
const edgePresence=smoothstep(1-outside*0.34);
const innerX=outside>0?width/2+Math.sign(rawAngle)*edgeX:width/2+sidePush*ribbonRadius;
const innerDepth=Math.min(1,0.28+Math.pow(side,0.92)*0.72*projectState.cylinderLength);
const edgeFade=Math.max(0,1-outside*0.72);
const innerScale=(1+side*2*projectState.cylinderLength)*(0.34+edgePresence*0.66);
const zoom=projectZoomProgress;
const outerRadius=Math.min(width*0.62,1040)*(1-zoom*0.14)*projectState.cylinderWidth;
const outerEdgeX=Math.sin(maxAngle)*outerRadius+outside*offscreenStep;
const outerX=outside>0?width/2+Math.sign(rawAngle)*outerEdgeX:width/2+sidePush*outerRadius;
const outerCurve=Math.max(0,Math.cos(angle));
const outerZ=(outerCurve-side*0.76-outside*0.1)*projectState.cylinderLength;
const outerDepth=0.38+outerCurve*0.62;
const centerFocus=Math.max(0,1-Math.abs(rel)*2);
const expandedOuterScale=(0.68+outerCurve*1.05)*(0.4+edgePresence*0.6);
const outerScale=centerFocus>0.5?innerScale:expandedOuterScale;
const focus=projectFocusProgress;return{item,index,x:innerX+(outerX-innerX)*focus,y:centerY+(height*0.5-centerY)*focus,z:innerZ+(outerZ-innerZ)*focus,depth:innerDepth+(outerDepth-innerDepth)*focus,mode:"ribbon",faceTurn:sidePush*(1-focus*0.42),visualScale:innerScale+(outerScale-innerScale)*focus,alphaBoost:visibleByCount?1:0,centerFocus};});}
function updateRibbonAutoscroll(now){if(viewMode!=="project"||dragging||now<ribbonAutoPausedUntil||projectFocusTarget>0||projectFocusProgress>0.05){ribbonAutoSpeed+=(0-ribbonAutoSpeed)*0.08;return false;}if(!ribbonAutoPhaseStartedAt){ribbonAutoPhaseStartedAt=now;}let elapsed=now-ribbonAutoPhaseStartedAt;
const cycle=24000;if(elapsed>=cycle){const cycles=Math.floor(elapsed/cycle);ribbonAutoPhaseStartedAt+=cycles*cycle;elapsed=now-ribbonAutoPhaseStartedAt;if(cycles%2===1){ribbonAutoDirection*=-1;}}const cycleTime=elapsed;
let targetSpeed;if(cycleTime<20000){const startEase=smoothstep(Math.min(1,cycleTime/1800));targetSpeed=ribbonAutoDirection*0.0022*startEase;}else if(cycleTime<21000){const kick=smoothstep((cycleTime-20000)/1000);targetSpeed=-ribbonAutoDirection*(0.024+kick*0.068);}else{const stop=1-smoothstep((cycleTime-21000)/3000);targetSpeed=-ribbonAutoDirection*0.024*stop;}const response=Math.abs(targetSpeed)>Math.abs(ribbonAutoSpeed)?0.34:0.075;ribbonAutoSpeed+=(targetSpeed-ribbonAutoSpeed)*response;ribbonTargetOffset+=ribbonAutoSpeed;return true;}
function drawRibbonAtmosphere(progress){return progress;}
function projectLabel(item,index){const rawTitle=(item.title||"").trim();if(rawTitle&&rawTitle.length<=28&&!rawTitle.includes("_")&&!/^work\s+\d+$/i.test(rawTitle)){return rawTitle.toUpperCase();}return `DESIGN CASE ${String(index + 1).padStart(2, "0")}`;}const defaultCvNodes=[{look:"center",yaw:0,pitch:0,eyebrow:"CV / ART DIRECTION / AI DESIGN",title:"Alexander",body:"Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.",type:"hero"},{look:"top",yaw:0,pitch:34,title:"Profile",body:"Visual direction, generative content, interface composition and cinematic digital cases."},{look:"bottom",yaw:0,pitch:-34,title:"Experience",body:"Portfolio systems, AI campaigns, social content packs, landing visuals and case studies."},{look:"left",yaw:-42,pitch:0,title:"Tools",body:"Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea and web layout basics."},{look:"right",yaw:42,pitch:0,title:"Contact",body:"Available for visual identity, AI art direction, portfolio sites and design case packaging."}];
const bootstrapCvNodes=bootstrapData.cvNodes||window.PORTFOLIO_BOOTSTRAP?.cvNodes||[];
let cvNodes=bootstrapCvNodes.length?normalizeCvNodes(bootstrapCvNodes):loadStoredCvNodes();function readJsonStorage(key,fallback){try{const value=localStorage.getItem(key);if(!value)return fallback;
const parsed=JSON.parse(value);return parsed||fallback;}catch(error){return fallback;}}
function readBootstrapData(){try{return JSON.parse(document.getElementById("sphereBootstrapData")?.textContent||"{}")||{};}catch(error){return{};}}
function normalizeAssets(nextAssets){if(!Array.isArray(nextAssets))return defaultAssets.slice();return nextAssets.filter((asset)=>asset&&typeof asset.src==="string"&&asset.src.trim()).map((asset)=>({src:asset.src.trim(),title:typeof asset.title==="string"?asset.title.trim():"",projectId:typeof asset.projectId==="string"?asset.projectId:(typeof asset.project_id==="string"?asset.project_id:"")}));}
function loadStoredAssets(){return normalizeAssets(readJsonStorage(STORAGE_ASSETS,defaultAssets));}async function loadStoredAssetsAsync(){try{const directAssets=normalizeAssets(bootstrapData.assets||window.PORTFOLIO_BOOTSTRAP?.assets||[]);if(directAssets.length)return directAssets;
const storedAssets=loadStoredAssets();if(storedAssets.length)return storedAssets;if(!window.PortfolioStorage)return storedAssets;return normalizeAssets(await window.PortfolioStorage.get(STORAGE_ASSETS)||storedAssets);}catch(error){return loadStoredAssets();}}async function loadSupabaseAssets(){const client=window.createPortfolioSupabase?window.createPortfolioSupabase():null;if(!client)return[];
const{data:projects,error:projectError}=await client.from("projects").select("id,title,cover_url,sort_order,status").eq("status","published").order("sort_order",{ascending:true}).order("created_at",{ascending:false});if(projectError||!Array.isArray(projects)||!projects.length)return[];
const ids=projects.map((project)=>project.id);
const{data:images}=await client.from("project_images").select("project_id,image_url,title,sort_order").in("project_id",ids).order("sort_order",{ascending:true}).order("created_at",{ascending:true});
const byProject=new Map();(images||[]).forEach((image)=>{if(!byProject.has(image.project_id))byProject.set(image.project_id,[]);byProject.get(image.project_id).push(image);});
const media=[];projects.forEach((project)=>{if(project.cover_url)media.push({src:project.cover_url,title:project.title||""});(byProject.get(project.id)||[]).forEach((image)=>{if(image.image_url)media.push({src:image.image_url,title:project.title||image.title||""});});});return normalizeAssets(media);}
function normalizeCvNodes(nextNodes){const byLook=new Map(Array.isArray(nextNodes)?nextNodes.map((node)=>[node.look,node]):[]);return defaultCvNodes.map((defaultNode)=>{const stored=byLook.get(defaultNode.look)||{};return{...defaultNode,eyebrow:typeof stored.eyebrow==="string"?stored.eyebrow:defaultNode.eyebrow,title:typeof stored.title==="string"?stored.title:defaultNode.title,body:typeof stored.body==="string"?stored.body:defaultNode.body};});}
function loadStoredCvNodes(){return normalizeCvNodes(readJsonStorage(STORAGE_CV,defaultCvNodes));}async function loadStoredCvNodesAsync(){try{const directNodes=bootstrapData.cvNodes||window.PORTFOLIO_BOOTSTRAP?.cvNodes||[];if(directNodes.length)return normalizeCvNodes(directNodes);if(!window.PortfolioStorage)return loadStoredCvNodes();return normalizeCvNodes(await window.PortfolioStorage.get(STORAGE_CV)||loadStoredCvNodes());}catch(error){return loadStoredCvNodes();}}async function loadSupabaseCvNodes(){const client=window.createPortfolioSupabase?window.createPortfolioSupabase():null;if(!client)return[];
const[{data:profile},{data:cv},{data:services},{data:contacts}]=await Promise.all([client.from("profile").select("*").limit(1).maybeSingle(),client.from("cv_sections").select("*").order("sort_order",{ascending:true}),client.from("services").select("*").order("sort_order",{ascending:true}),client.from("contacts").select("*").limit(1).maybeSingle()]);if(!profile&&(!Array.isArray(cv)||!cv.length))return[];
const serviceText=Array.isArray(services)?services.map((service)=>service.title).filter(Boolean).join(", "):"";
const contactText=contacts?[contacts.telegram,contacts.email,contacts.phone].filter(Boolean).join(" / "):"";
const cvText=Array.isArray(cv)?cv.map((section)=>[section.title,section.description].filter(Boolean).join(": ")).filter(Boolean).join(" "):"";
const profileText=profile?.short_description||defaultCvNodes[0].body;return[{look:"center",yaw:0,pitch:0,eyebrow:profile?.role||defaultCvNodes[0].eyebrow,title:profile?.name||defaultCvNodes[0].title,body:profileText,type:"hero"},{look:"top",yaw:0,pitch:34,title:"Profile",body:profileText},{look:"bottom",yaw:0,pitch:-34,title:"CV",body:cvText||defaultCvNodes[2].body},{look:"left",yaw:-42,pitch:0,title:"Services",body:serviceText||defaultCvNodes[3].body},{look:"right",yaw:42,pitch:0,title:"Contact",body:contactText||defaultCvNodes[4].body}];}
function cvDirection(yawDeg,pitchDeg){const yaw=yawDeg*Math.PI/180;
const pitch=pitchDeg*Math.PI/180;return{x:Math.sin(yaw)*Math.cos(pitch),y:-Math.sin(pitch),z:Math.cos(yaw)*Math.cos(pitch)};}
function cvCameraPoint(point){const cy=Math.cos(cvCamera.yaw*Math.PI/180);
const sy=Math.sin(cvCamera.yaw*Math.PI/180);
let x=point.x*cy-point.z*sy;
let z=point.x*sy+point.z*cy;
let y=point.y;
const cx=Math.cos(cvCamera.pitch*Math.PI/180);
const sx=Math.sin(cvCamera.pitch*Math.PI/180);
const y2=y*cx+z*sx;
const z2=-y*sx+z*cx;return{x,y:y2,z:z2};}
function wrapText(text,maxWidth,font){ctx.font=font;
const words=text.split(" ");
const lines=[];
let line="";words.forEach((word)=>{const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width<=maxWidth||!line){line=next;}else{lines.push(line);line=word;}});if(line)lines.push(line);return lines;}
function drawCvBlock(entry){const{node,x,y,z,scale,alpha,active}=entry;
const isHero=node.type==="hero";
const blockW=(isHero?620:360)*scale;
const blockH=(isHero?270:210)*scale;
const radius=Math.max(26,58*scale);ctx.save();ctx.translate(x,y);
const turn=Math.max(-0.74,Math.min(0.74,entry.xNorm*0.52));
const lift=Math.max(-0.4,Math.min(0.4,-entry.yNorm*0.3));
const edgeCompress=Math.max(0.66,1-entry.edge*0.18);
const verticalBend=1+entry.edge*0.06-Math.abs(lift)*0.18;ctx.transform(edgeCompress,lift,turn,verticalBend,0,0);ctx.globalAlpha=alpha;
const gradient=ctx.createRadialGradient(0,0,0,0,0,Math.max(blockW,blockH)*0.72);gradient.addColorStop(0,active?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.055)");gradient.addColorStop(0.6,"rgba(255,255,255,0.018)");gradient.addColorStop(1,"rgba(255,255,255,0.003)");ctx.fillStyle=gradient;ctx.beginPath();ctx.roundRect(-blockW/2,-blockH/2,blockW,blockH,radius);ctx.fill();ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";if(isHero){ctx.globalAlpha=alpha*0.58;ctx.font=`${Math.max(9, 12 * scale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(node.eyebrow,0,-blockH*0.27);ctx.globalAlpha=alpha;ctx.font=`700 ${Math.max(44, 96 * scale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(node.title,0,-blockH*0.02);ctx.globalAlpha=alpha*0.78;
const bodyFont=`${Math.max(13, 20 * scale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;
const lines=wrapText(node.body,blockW*0.72,bodyFont).slice(0,3);lines.forEach((line,index)=>ctx.fillText(line,0,blockH*0.24+index*25*scale));}else{ctx.globalAlpha=alpha*0.9;ctx.font=`700 ${Math.max(12, 18 * scale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(node.title.toUpperCase(),0,-blockH*0.15);ctx.globalAlpha=alpha*0.74;
const bodyFont=`${Math.max(12, 16 * scale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;
const lines=wrapText(node.body,blockW*0.7,bodyFont).slice(0,4);lines.forEach((line,index)=>ctx.fillText(line,0,blockH*0.08+index*22*scale));}ctx.restore();}
function cvProjectSurfacePoint(yawDeg,pitchDeg,radius,centerX,centerY){const cameraPoint=cvCameraPoint(cvDirection(yawDeg,pitchDeg));
const curvedX=Math.tanh(cameraPoint.x*1.14);
const curvedY=Math.tanh(cameraPoint.y*1.04);
const clampedZ=Math.max(-0.5,Math.min(1,cameraPoint.z));
const edge=Math.max(0,Math.min(1,Math.hypot(curvedX,curvedY)));
const insidePush=0.9+edge*0.36;
const visibility=Math.max(0.28,Math.min(1,(clampedZ+0.46)/1.46));return{x:centerX+curvedX*radius*1.42*insidePush,y:centerY+curvedY*radius*1.08*insidePush,z:cameraPoint.z,edge,visibility};}
function strokeCvSurfacePath(points,alpha,widthValue){let drawing=false;ctx.beginPath();points.forEach((point)=>{if(point.visibility<=0.03){drawing=false;return;}if(!drawing){ctx.moveTo(point.x,point.y);drawing=true;}else{ctx.lineTo(point.x,point.y);}});ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.lineWidth=widthValue;ctx.stroke();}
function drawCvSphereSurface(radius,centerX,centerY){ctx.save();ctx.lineCap="round";ctx.lineJoin="round";[-50,-25,0,25,50].forEach((pitch)=>{const points=[];for(let yaw=-86;yaw<=86;yaw+=3){points.push(cvProjectSurfacePoint(yaw,pitch,radius,centerX,centerY));}strokeCvSurfacePath(points,pitch===0?0.062:0.042,pitch===0?1.2:0.9);});[-72,-36,0,36,72].forEach((yaw)=>{const points=[];for(let pitch=-58;pitch<=58;pitch+=3){points.push(cvProjectSurfacePoint(yaw,pitch,radius,centerX,centerY));}strokeCvSurfacePath(points,yaw===0?0.056:0.038,yaw===0?1.1:0.85);});for(let row=0;row<7;row++){const pitch=-48+row*16;for(let col=0;col<13;col++){const yaw=-78+col*13+(row%2?4:0);
const point=cvProjectSurfacePoint(yaw,pitch,radius,centerX,centerY);if(point.visibility<=0.05)continue;
const dotSize=0.7+point.edge*0.9;ctx.globalAlpha=0.06*point.visibility;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(point.x,point.y,dotSize,0,Math.PI*2);ctx.fill();}}ctx.restore();}
function drawCvHemisphere(){cvCamera.yaw+=(cvTargetCamera.yaw-cvCamera.yaw)*0.065;cvCamera.pitch+=(cvTargetCamera.pitch-cvCamera.pitch)*0.065;
const radius=Math.min(width,height)*0.4;
const centerX=width/2;
const centerY=height/2;ctx.save();ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);
const domeGradient=ctx.createRadialGradient(centerX,centerY,radius*0.08,centerX,centerY,radius*1.42);domeGradient.addColorStop(0,"rgba(0,0,0,0.12)");domeGradient.addColorStop(0.42,"rgba(255,255,255,0.012)");domeGradient.addColorStop(0.7,"rgba(255,255,255,0.052)");domeGradient.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=domeGradient;ctx.beginPath();ctx.ellipse(centerX,centerY,radius*1.82,radius*1.18,0,0,Math.PI*2);ctx.fill();drawCvSphereSurface(radius,centerX,centerY);
const entries=cvNodes.map((node)=>{const surfacePoint=cvProjectSurfacePoint(node.yaw,node.pitch,radius,centerX,centerY);
const z=Math.max(0.05,surfacePoint.z);
const edge=surfacePoint.edge;
const perspective=0.82+edge*0.42;
const active=node.look===cvLook;
const baseScale=node.type==="hero"?(active?0.52:0.42):0.82;
const scale=baseScale*perspective*(active?1.08:0.9);
const alpha=node.type==="hero"?(active?0.84:0.54):(active?1:Math.max(0.36,0.58+edge*0.16));return{node,x:surfacePoint.x,y:surfacePoint.y,z,edge,scale,alpha,active,xNorm:(surfacePoint.x-centerX)/Math.max(1,radius),yNorm:(surfacePoint.y-centerY)/Math.max(1,radius)};}).sort((a,b)=>{const aHero=a.node.type==="hero";
const bHero=b.node.type==="hero";if(aHero!==bHero)return aHero?-1:1;return a.active===b.active?a.edge-b.edge:a.active?1:-1;});entries.forEach(drawCvBlock);ctx.restore();}
function cvModulo(value,total){return((value%total)+total)%total;}
function cvBoxLabel(node){return({center:"ГЛАВНОЕ",top:"ПРОФИЛЬ",bottom:"РЕЗЮМЕ",left:"УСЛУГИ",right:"КОНТАКТЫ"})[node.look]||node.title||"РАЗДЕЛ";}
function handleCvWheel(event){if(viewMode!=="cv")return;event.preventDefault();}
function cvBoxNodeForLook(look,sourceNodes=cvNodes){const nodes=sourceNodes.length?sourceNodes:defaultCvNodes;return nodes.find((node)=>node.look===look)||nodes[0]||defaultCvNodes[0];}
const cvFaceTargets={center:{yaw:0,pitch:0},left:{yaw:Math.PI/2,pitch:0},right:{yaw:-Math.PI/2,pitch:0},top:{yaw:0,pitch:-Math.PI/2},bottom:{yaw:0,pitch:Math.PI/2},back:{yaw:Math.PI,pitch:0}};
const cvFaceLabels={center:"Главное",left:"Профиль",right:"Резюме",top:"Услуги",bottom:"Контакты",back:"+1"};
function cvNearestAngle(current,target){let next=target;while(next-current>Math.PI)next-=Math.PI*2;while(next-current<-Math.PI)next+=Math.PI*2;return next;}
function setCvFace(face,immediate=false){if(!cvFaceTargets[face])return;cvActiveFace=face;const target=cvFaceTargets[face];cvTargetBox={yaw:cvNearestAngle(cvBoxYaw,target.yaw),pitch:target.pitch};if(immediate){cvBoxYaw=cvTargetBox.yaw;cvBoxPitch=cvTargetBox.pitch;}cvBoxVelocity={yaw:0,pitch:0};cvLastInteractionAt=performance.now();cvSectionButtons.forEach((button)=>button.classList.toggle("is-active",button.dataset.cvFace===face));}
function updateCvSceneUi(){if(!cvSphereSizeRange)return;cvSceneState.sphereSize=Number(cvSphereSizeRange.value);cvSceneState.elementScale=Number(cvElementScaleRange.value);cvSceneState.blur=Number(cvOverlayBlurRange.value);cvSceneState.dim=Number(cvOverlayDimRange.value);cvSphereSizeValue.textContent=cvSceneState.sphereSize.toFixed(2);cvElementScaleValue.textContent=cvSceneState.elementScale.toFixed(2);cvOverlayBlurValue.textContent=String(Math.round(cvSceneState.blur));cvOverlayDimValue.textContent=String(Math.round(cvSceneState.dim));}
function cvBackgroundPoint(point){const cy=Math.cos(cvSphereRotation.y);const sy=Math.sin(cvSphereRotation.y);const cp=Math.cos(cvSphereRotation.x);const sp=Math.sin(cvSphereRotation.x);const x=point.x*cy+point.z*sy;const z=-point.x*sy+point.z*cy;return{x,y:point.y*cp-z*sp,z:point.y*sp+z*cp};}
function drawCvBackgroundSphere(){const source=items.length?items.slice(0,Math.min(100,items.length)):defaultAssets;const count=Math.max(1,source.length);const centerX=width/2;const centerY=height*0.54;const radius=Math.min(width,height)*(0.25+cvSceneState.sphereSize*0.34);cvSphereRotation.y+=0.00055;cvSphereRotation.x+=0.00012;ctx.save();ctx.filter=`blur(${cvSceneState.blur.toFixed(1)}px)`;source.forEach((item,index)=>{const point=cvBackgroundPoint(fibonacciPoint(index,count));const depth=(point.z+1)/2;const x=centerX+point.x*radius*1.18;const y=centerY+point.y*radius*0.82;const size=(22+depth*32)*cvSceneState.sphereSize;const image=item.img;ctx.globalAlpha=0.12+depth*0.2;ctx.fillStyle="rgba(255,255,255,0.08)";if(item.loaded&&image?.naturalWidth){const ratio=image.naturalWidth/image.naturalHeight||1;const w=ratio>=1?size:size*ratio;const h=ratio>=1?size/ratio:size;ctx.drawImage(image,x-w/2,y-h/2,w,h);}else{ctx.fillRect(x-size/2,y-size/2,size,size);}});ctx.restore();ctx.save();ctx.fillStyle=`rgba(0,0,0,${(cvSceneState.dim/100).toFixed(3)})`;ctx.fillRect(0,0,width,height);ctx.restore();}
function cvRotateBoxPoint(point,yaw,pitch){const cy=Math.cos(yaw);
const sy=Math.sin(yaw);
const cp=Math.cos(pitch);
const sp=Math.sin(pitch);
const x=point.x*cy+point.z*sy;
const z=-point.x*sy+point.z*cy;
const y=point.y*cp-z*sp;
return{x,y,z:point.y*sp+z*cp};}
function cvProjectBoxPoint(point,centerX,centerY,focal,cameraZ){const depth=cameraZ-point.z;
const scale=focal/Math.max(80,depth);return{x:centerX+point.x*scale,y:centerY+point.y*scale,z:point.z,scale};}
function drawCvBoxFace(face,centerX,centerY,focal,cameraZ){const points=face.points.map((point)=>cvProjectBoxPoint(point,centerX,centerY,focal,cameraZ));
const avgZ=points.reduce((sum,point)=>sum+point.z,0)/points.length;
const facing=Math.max(0.2,Math.min(1,(avgZ+face.depthBias+360)/820));
const active=face.active;
ctx.save();ctx.beginPath();points.forEach((point,index)=>{if(index)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});ctx.closePath();ctx.globalAlpha=(active?0.98:0.78)*facing;ctx.fillStyle=active?"rgba(8,8,8,0.98)":"rgba(0,0,0,0.92)";ctx.fill();const shade=ctx.createLinearGradient(points[0].x,points[0].y,points[2].x,points[2].y);shade.addColorStop(0,"rgba(255,255,255,0.08)");shade.addColorStop(0.48,"rgba(255,255,255,0.015)");shade.addColorStop(1,"rgba(0,0,0,0.36)");ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle=active?"rgba(255,255,255,0.42)":"rgba(255,255,255,0.2)";ctx.lineWidth=active?1.35:0.85;ctx.stroke();ctx.restore();
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
function drawCvBackgroundSphere(){const source=items.length?items.slice(0,Math.min(100,items.length)):defaultAssets;const count=Math.max(1,source.length);const centerX=width/2;const centerY=height*0.54;const radius=Math.min(width,height)*(0.14+state.sphereSize*cvSceneState.sphereSize*0.48);cvSphereRotation.y+=0.00045+direction.x*0.0009;cvSphereRotation.x+=0.00012+direction.y*0.0005;ctx.save();ctx.filter=`blur(${cvSceneState.blur.toFixed(1)}px)`;source.forEach((item,index)=>{const point=cvBackgroundPoint(fibonacciPoint(index,count));const depth=(point.z+1)/2;let x=centerX+point.x*radius*1.18;let y=centerY+point.y*radius*0.82;const fromCenter=Math.min(1,Math.hypot(x-centerX,y-centerY)/Math.max(1,Math.min(width,height)*0.52));const fish=fromCenter*fromCenter*state.fisheye;x=centerX+(x-centerX)*(1+fish*0.75);y=centerY+(y-centerY)*(1+fish*0.75);const size=(18+depth*42)*(0.42+state.elementScale);const image=item.img;ctx.globalAlpha=0.12+depth*0.22;ctx.fillStyle="rgba(255,255,255,0.08)";if(item.loaded&&image?.naturalWidth){const ratio=image.naturalWidth/image.naturalHeight||1;const w=ratio>=1?size:size*ratio;const h=ratio>=1?size/ratio:size;ctx.drawImage(image,x-w/2,y-h/2,w,h);}else{ctx.fillRect(x-size/2,y-size/2,size,size);}});ctx.restore();ctx.save();ctx.fillStyle=`rgba(0,0,0,${(cvSceneState.dim/100).toFixed(3)})`;ctx.fillRect(0,0,width,height);ctx.restore();}
function drawCvBoxFace(face,centerX,centerY,focal,cameraZ){const points=face.points.map((point)=>cvProjectBoxPoint(point,centerX,centerY,focal,cameraZ));const avgZ=points.reduce((sum,point)=>sum+point.z,0)/points.length;const facing=Math.max(0.2,Math.min(1,(avgZ+face.depthBias+360)/820));const active=face.active;ctx.save();ctx.beginPath();points.forEach((point,index)=>{if(index)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});ctx.closePath();ctx.globalAlpha=(active?0.62:0.42)*facing;ctx.fillStyle=active?"rgba(7,7,7,0.46)":"rgba(0,0,0,0.27)";ctx.fill();const shade=ctx.createLinearGradient(points[0].x,points[0].y,points[2].x,points[2].y);shade.addColorStop(0,"rgba(255,255,255,0.075)");shade.addColorStop(0.55,"rgba(255,255,255,0.012)");shade.addColorStop(1,"rgba(0,0,0,0.1)");ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle=active?"rgba(255,255,255,0.34)":"rgba(255,255,255,0.16)";ctx.lineWidth=active?1.15:0.7;ctx.stroke();ctx.restore();const center=points.reduce((acc,point)=>({x:acc.x+point.x/points.length,y:acc.y+point.y/points.length,scale:acc.scale+point.scale/points.length}),{x:0,y:0,scale:0});const node=face.node;const mobile=width<700;const faceWidth=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y);const textScale=Math.max(0.52,Math.min(1.22,center.scale*1.22))*(active?1.08:0.92);ctx.save();ctx.translate(center.x,center.y);ctx.globalAlpha=(active?0.94:0.5)*facing;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`700 ${Math.max(9,(mobile?9:11)*textScale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(face.label||cvBoxLabel(node),0,-58*textScale);ctx.font=`700 ${Math.max(20,(node.type==="hero"?(mobile?40:58):(mobile?28:40))*textScale)}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(node.title,0,-12*textScale);ctx.globalAlpha=(active?0.74:0.36)*facing;const bodySize=Math.max(11,(mobile?13:15)*textScale);const bodyFont=`${bodySize}px Helvetica Neue, Helvetica, Arial, sans-serif`;const lines=wrapText(node.body,Math.max(140,faceWidth*0.54),bodyFont).slice(0,mobile?3:4);ctx.font=bodyFont;lines.forEach((line,index)=>ctx.fillText(line,0,34*textScale+index*bodySize*1.45));ctx.restore();}
function drawCvRectangularCube(){ctx.save();ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);drawCvBackgroundSphere();const sourceNodes=cvNodes.length?cvNodes:defaultCvNodes;const now=performance.now();if(!dragging&&now-cvLastInteractionAt>1300){cvTargetBox.yaw+=0.0034;cvTargetBox.pitch+=0.00145*cvAutoPitchDirection;if(cvTargetBox.pitch>0.66||cvTargetBox.pitch<-0.66)cvAutoPitchDirection*=-1;}const targetYaw=cvNearestAngle(cvBoxYaw,cvTargetBox.yaw);cvBoxYaw+=(targetYaw-cvBoxYaw)*0.075;cvBoxPitch+=(cvTargetBox.pitch-cvBoxPitch)*0.075;if(dragging){cvBoxYaw+=cvBoxVelocity.yaw;cvBoxPitch+=cvBoxVelocity.pitch;cvBoxVelocity.yaw*=0.94;cvBoxVelocity.pitch*=0.94;}const mobile=width<700;const centerX=width/2;const centerY=height*(mobile?0.58:0.56);const boxScale=Math.min(mobile?width*0.88:width*0.54,height*0.72);const halfW=boxScale*0.5;const halfH=boxScale*(mobile?0.34:0.3);const halfD=boxScale*0.36;const focal=mobile?560:740;const cameraZ=mobile?880:980;const v={ntl:{x:-halfW,y:-halfH,z:halfD},ntr:{x:halfW,y:-halfH,z:halfD},nbr:{x:halfW,y:halfH,z:halfD},nbl:{x:-halfW,y:halfH,z:halfD},ftl:{x:-halfW,y:-halfH,z:-halfD},ftr:{x:halfW,y:-halfH,z:-halfD},fbr:{x:halfW,y:halfH,z:-halfD},fbl:{x:-halfW,y:halfH,z:-halfD}};Object.keys(v).forEach((key)=>{v[key]=cvRotateBoxPoint(v[key],cvBoxYaw,cvBoxPitch);});const faces=[{look:"center",node:cvBoxNodeForLook("center",sourceNodes),points:[v.ntl,v.ntr,v.nbr,v.nbl],depthBias:120},{look:"right",node:cvBoxNodeForLook("right",sourceNodes),points:[v.ntr,v.ftr,v.fbr,v.nbr],depthBias:30},{look:"left",node:cvBoxNodeForLook("left",sourceNodes),points:[v.ftl,v.ntl,v.nbl,v.fbl],depthBias:30},{look:"top",node:cvBoxNodeForLook("top",sourceNodes),points:[v.ftl,v.ftr,v.ntr,v.ntl],depthBias:10},{look:"bottom",node:cvBoxNodeForLook("bottom",sourceNodes),points:[v.nbl,v.nbr,v.fbr,v.fbl],depthBias:10},{look:"back",node:{...cvBoxNodeForLook("right",sourceNodes),look:"back",title:"+1",body:"Дополнительный раздел и материалы."},points:[v.ftr,v.ftl,v.fbl,v.fbr],depthBias:-80}];faces.forEach((face)=>{face.avgZ=face.points.reduce((sum,point)=>sum+point.z,0)/face.points.length;face.active=face.look===cvActiveFace;face.label=cvFaceLabels[face.look];});faces.sort((a,b)=>a.avgZ-b.avgZ).forEach((face)=>drawCvBoxFace(face,centerX,centerY,focal,cameraZ));ctx.restore();}
function drawCvBackgroundSphere(){const previousRotation={x:rotation.x,y:rotation.y};const previousHits=hitTargets;cvSphereRotation.y+=0.0008+direction.x*0.0012;cvSphereRotation.x+=0.00035+direction.y*0.0008;rotation.x=cvSphereRotation.x;rotation.y=cvSphereRotation.y;const entries=getSphereEntries(getVisibleItems()).sort((a,b)=>a.z-b.z);ctx.save();ctx.filter=`blur(${cvSceneState.blur.toFixed(1)}px)`;entries.forEach((entry)=>drawCard({...entry,alphaBoost:(entry.alphaBoost??1)*0.58}));ctx.restore();rotation.x=previousRotation.x;rotation.y=previousRotation.y;hitTargets=previousHits;ctx.save();ctx.fillStyle=`rgba(0,0,0,${(cvSceneState.dim/100).toFixed(3)})`;ctx.fillRect(0,0,width,height);ctx.restore();}
function findHit(clientX,clientY){return hitTargets.filter((target)=>(Math.abs(clientX-target.x)<=target.w/2&&Math.abs(clientY-target.y)<=target.h/2)).sort((a,b)=>b.z-a.z)[0];}
function drawCvBackgroundSphere(){const previousRotation={x:rotation.x,y:rotation.y};const previousSize=state.sphereSize;const previousElementScale=state.elementScale;const previousHits=hitTargets;state.sphereSize=cvSceneState.sphereSize;state.elementScale=cvSceneState.elementScale;cvSphereRotation.y+=0.0008+direction.x*0.0012;cvSphereRotation.x+=0.00035+direction.y*0.0008;rotation.x=cvSphereRotation.x;rotation.y=cvSphereRotation.y;const entries=getSphereEntries(getVisibleItems()).sort((a,b)=>a.z-b.z);ctx.save();ctx.filter=`blur(${cvSceneState.blur.toFixed(1)}px)`;entries.forEach((entry)=>drawCard({...entry,alphaBoost:(entry.alphaBoost??1)*0.58}));ctx.restore();rotation.x=previousRotation.x;rotation.y=previousRotation.y;state.sphereSize=previousSize;state.elementScale=previousElementScale;hitTargets=previousHits;ctx.save();ctx.fillStyle=`rgba(0,0,0,${(cvSceneState.dim/100).toFixed(3)})`;ctx.fillRect(0,0,width,height);ctx.restore();}
function drawCvBoxFace(face,centerX,centerY,focal,cameraZ){const points=face.points.map((point)=>cvProjectBoxPoint(point,centerX,centerY,focal,cameraZ));const avgZ=points.reduce((sum,point)=>sum+point.z,0)/points.length;const facing=Math.max(0.16,Math.min(1,(avgZ+face.depthBias+360)/820));const active=face.active;ctx.save();ctx.beginPath();points.forEach((point,index)=>{if(index)ctx.lineTo(point.x,point.y);else ctx.moveTo(point.x,point.y);});ctx.closePath();ctx.globalAlpha=(active?0.94:0.78)*facing;ctx.fillStyle=active?"rgba(0,0,0,0.96)":"rgba(0,0,0,0.9)";ctx.fill();ctx.strokeStyle=active?"rgba(255,255,255,0.28)":"rgba(255,255,255,0.13)";ctx.lineWidth=active?1.1:0.7;ctx.stroke();const p0=points[0],p1=points[1],p3=points[3];const ux={x:p1.x-p0.x,y:p1.y-p0.y};const vy={x:p3.x-p0.x,y:p3.y-p0.y};ctx.save();ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(points[2].x,points[2].y);ctx.lineTo(p3.x,p3.y);ctx.closePath();ctx.clip();ctx.translate(p0.x,p0.y);ctx.transform(ux.x/1000,ux.y/1000,vy.x/1000,vy.y/1000,0,0);ctx.globalAlpha=(active?0.96:0.45)*facing;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 19px Helvetica Neue, Helvetica, Arial, sans-serif";ctx.fillText(face.label||cvBoxLabel(face.node),500,350);ctx.font=`700 ${face.node.type==="hero"?88:58}px Helvetica Neue, Helvetica, Arial, sans-serif`;ctx.fillText(face.node.title,500,458);ctx.globalAlpha=(active?0.74:0.32)*facing;const bodyFont="23px Helvetica Neue, Helvetica, Arial, sans-serif";ctx.font=bodyFont;const lines=wrapText(face.node.body,700,bodyFont).slice(0,width<700?3:4);lines.forEach((line,index)=>ctx.fillText(line,500,550+index*36));ctx.restore();ctx.restore();}
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
[cvSphereSizeRange,cvElementScaleRange,cvOverlayBlurRange,cvOverlayDimRange].forEach((input)=>input?.addEventListener("input",updateCvSceneUi));
canvas.addEventListener("pointermove",()=>{if(viewMode==="cv"&&dragging){cvTargetBox={yaw:cvBoxYaw,pitch:cvBoxPitch};cvLastInteractionAt=performance.now();}});
[sizeRange,scaleRange,fisheyeRange].forEach((input)=>{input.addEventListener("input",updateUi);});
[projectScaleRange,projectCountRange,projectGapRange,projectWidthRange,projectLengthRange].forEach((input)=>{input.addEventListener("input",updateProjectUi);});
window.addEventListener("resize",resize);resize();updateUi();updateProjectUi();initializeWaterEffects();loadItems(assets);Promise.all([loadStoredAssetsAsync(),loadStoredCvNodesAsync()]).then(([nextAssets,nextCvNodes])=>{assets=nextAssets;cvNodes=nextCvNodes;loadItems(assets);});render();})();
