/**
 * STACKLY Operator Command Center — Enhanced SPA Controller
 */
(function () {
  'use strict';

  var USER_KEY = 'user';
  function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } }

  var user = getUser();
  if (!user || user.role !== 'Operator') {
    window.location.href = 'login.html';
    return;
  }

  var initial = (user.fullName || 'O').charAt(0).toUpperCase();
  var displayName = user.fullName || 'Operator';
  var email = user.email || 'operator@stackly.com';

  function setUserUI() {
    var map = {
      'avatarInitial': initial, 'userDisplayName': displayName,
      'dropdownAvatar': initial, 'dropdownName': displayName,
      'dropdownEmail': email, 'dropdownRole': user.role,
      'profileAvatar': initial, 'profileName': displayName,
      'profileRoleBadge': user.role, 'profileFullName': displayName,
      'profileEmail': email, 'profileRoleInput': user.role
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'INPUT') el.value = map[id]; else el.textContent = map[id];
    });
  }
  setUserUI();

  document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
  });

  document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var newName = document.getElementById('profileFullName').value.trim();
    var newEmail = document.getElementById('profileEmail').value.trim();
    if (newName) user.fullName = newName;
    if (newEmail) user.email = newEmail;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    displayName = user.fullName; email = user.email; initial = displayName.charAt(0).toUpperCase();
    setUserUI();
    showToast('Profile updated successfully', 'success');
  });

  var avatarBtn = document.getElementById('userAvatarBtn');
  var dropdown = document.getElementById('userDropdown');
  avatarBtn.addEventListener('click', function (e) { e.stopPropagation(); dropdown.classList.toggle('open'); });
  document.addEventListener('click', function () { dropdown.classList.remove('open'); });
  document.getElementById('navToProfile').addEventListener('click', function () { navigateTo('profile'); dropdown.classList.remove('open'); });

  document.getElementById('searchBtn').addEventListener('click', function () { showToast('Global search coming soon', 'info'); });
  document.getElementById('fullscreenBtn').addEventListener('click', function () {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function(){});
    else document.exitFullscreen();
  });

  function updateClock() {
    var now = new Date();
    var clock = document.getElementById('headerClock');
    if (clock) clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    var last = document.getElementById('lastLoginTime');
    if (last) last.textContent = now.toLocaleDateString() + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  setInterval(updateClock, 1000);
  updateClock();

  var sidebarLinks = document.querySelectorAll('.sidebar-link');
  var mobileLinks = document.querySelectorAll('.mobile-nav-link[data-view]');
  var views = document.querySelectorAll('.dash-view');
  var pageTitle = document.getElementById('pageTitle');
  var breadcrumb = document.getElementById('headerBreadcrumb');
  var chartsInit = { overview: false, live: false, equipment: false, alerts: false, tasks: false, reports: false };

  function navigateTo(viewId) {
    views.forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');
    sidebarLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === viewId); });
    mobileLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === viewId); });
    var activeLink = document.querySelector('.sidebar-link[data-view="' + viewId + '"]');
    var title = activeLink ? activeLink.dataset.title || viewId : viewId;
    if (pageTitle) pageTitle.textContent = title;
    if (breadcrumb) breadcrumb.innerHTML = 'Command Center / <span>' + title + '</span>';

    if (viewId === 'overview' && !chartsInit.overview) initOverview();
    if (viewId === 'live-operations' && !chartsInit.live) initLive();
    if (viewId === 'equipment' && !chartsInit.equipment) initEquipment();
    if (viewId === 'alerts' && !chartsInit.alerts) initAlerts();
    if (viewId === 'tasks' && !chartsInit.tasks) initTasks();
    if (viewId === 'reports' && !chartsInit.reports) initReports();
    if (viewId === 'profile') initProfile();

    var sb = document.getElementById('dashSidebar');
    if (sb) sb.classList.remove('mobile-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Force chart resize after view becomes visible
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }

  sidebarLinks.forEach(function (link) { link.addEventListener('click', function (e) { e.preventDefault(); navigateTo(this.dataset.view); }); });
  mobileLinks.forEach(function (link) { link.addEventListener('click', function (e) { e.preventDefault(); navigateTo(this.dataset.view); }); });
  var hamb = document.getElementById('hamburgerBtn');
  if (hamb) hamb.addEventListener('click', function () { var sb = document.getElementById('dashSidebar'); if (sb) sb.classList.toggle('mobile-open'); });
  var more = document.getElementById('mobileMoreBtn');
  if (more) more.addEventListener('click', function () { var sb = document.getElementById('dashSidebar'); if (sb) sb.classList.toggle('mobile-open'); });

  function handleHash() {
    var hash = window.location.hash.replace('#', '') || 'overview';
    navigateTo(hash);
  }
  window.addEventListener('hashchange', handleHash);

  var D = {
    hours: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],
    activityData: [120, 180, 150, 210, 380, 520, 610, 580, 490, 420, 310, 200],
    activityData2: [90, 140, 130, 170, 320, 460, 540, 510, 430, 370, 260, 160],
    taskStatus: { labels: ['Completed','In Progress','Pending','Failed'], values: [48,24,18,10] },
    shiftPerf: { labels: ['Shift A','Shift B','Shift C','Shift D'], completed: [42,38,35,45], target: [40,40,40,40] },
    oeeData: [82,84,83,87,86,89,88,91,90,92],
    alerts: [
      { severity:'critical', title:'Motor Overheat — Unit 7B', desc:'Temperature exceeded threshold on servo motor.', time:'2 min ago' },
      { severity:'warning', title:'Low Battery — Drone 12', desc:'Battery below 15%, returning to dock.', time:'8 min ago' },
      { severity:'info', title:'Shift Rotation Complete', desc:'Shift B handover to Shift C completed.', time:'15 min ago' },
      { severity:'critical', title:'Conveyor Jam — Line 3', desc:'Object detected blocking conveyor belt.', time:'22 min ago' },
      { severity:'warning', title:'Sensor Calibration Due', desc:'LiDAR unit 4A requires recalibration.', time:'31 min ago' },
      { severity:'info', title:'Task Batch Completed', desc:'24 tasks finished in current queue.', time:'45 min ago' }
    ],
    equipment: [
      { name:'Titan Arm #1', status:'online', availability:96, hours:2847, age:2 },
      { name:'AGV Fleet Alpha', status:'online', availability:92, hours:1934, age:3 },
      { name:'Conveyor Line 3', status:'maintenance', availability:78, hours:3201, age:5 },
      { name:'Drone Unit 12', status:'online', availability:88, hours:892, age:1 },
      { name:'CNC Router B2', status:'online', availability:94, hours:4120, age:4 },
      { name:'Welder Station 5', status:'offline', availability:0, hours:2156, age:6 },
      { name:'Packaging Bot P1', status:'online', availability:98, hours:1543, age:2 },
      { name:'Quality Scanner Q2', status:'online', availability:91, hours:3012, age:4 }
    ],
    tasks: [
      { title:'Calibrate LiDAR Unit 4A', status:'todo', priority:'high', assignee:'Alex Chen' },
      { title:'Replace Conveyor Belt Section', status:'todo', priority:'medium', assignee:'Maria Lopez' },
      { title:'Update Firmware — AGV Fleet', status:'todo', priority:'low', assignee:'Sam Park' },
      { title:'Inspect Motor 7B Wiring', status:'progress', priority:'high', assignee:'Jordan Blake' },
      { title:'Run Diagnostics — Drone 12', status:'progress', priority:'medium', assignee:'Alex Chen' },
      { title:'Generate Shift Report', status:'progress', priority:'low', assignee:'Taylor Reed' },
      { title:'Complete Safety Audit', status:'done', priority:'high', assignee:'Maria Lopez' },
      { title:'Deploy New Task Queue', status:'done', priority:'medium', assignee:'Sam Park' },
      { title:'Backup System Logs', status:'done', priority:'low', assignee:'Jordan Blake' },
      { title:'Train Operator Interface', status:'done', priority:'medium', assignee:'Taylor Reed' }
    ],
    operators: ['Alex Chen','Maria Lopez','Sam Park','Jordan Blake','Taylor Reed','Casey Kim','Riley Singh','Drew Patel'],
    env: [{ label:'Temp', value:'24.2°C' }, { label:'Humidity', value:'42%' }, { label:'Pressure', value:'1013' }, { label:'Vibration', value:'0.8' }],
    priorityDist: { labels:['Critical','High','Medium','Low'], values:[8,14,22,12] }
  };

  var severities = ['critical','warning','info'];
  var alertTitles = ['Motor Temperature Warning','Battery Critical Level','Sensor Malfunction Detected','Communication Timeout','Collision Avoidance Triggered','Task Deadline Approaching','System Update Available','Network Latency Spike','Payload Imbalance Detected','Firmware Version Mismatch'];
  D.fullAlerts = [];
  for (var i = 0; i < 24; i++) {
    D.fullAlerts.push({ severity: severities[i % 3], title: alertTitles[i % alertTitles.length] + ' #' + (i + 1), desc: 'Automated alert generated by monitoring system.', time: (i * 3 + 2) + ' min ago' });
  }

  var chartDefaults = {
    chart: { background: 'transparent', foreColor: '#94A3B8', fontFamily: "'Inter', sans-serif", toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 700 } },
    theme: { mode: 'dark' },
    grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
    tooltip: { theme: 'dark', style: { fontSize: '12px' } },
    xaxis: { labels: { style: { colors: '#64748B', fontSize: '11px' } }, axisBorder: { color: 'rgba(255,255,255,0.06)' }, axisTicks: { color: 'rgba(255,255,255,0.06)' } },
    yaxis: { labels: { style: { colors: '#64748B', fontSize: '11px' } } },
    dataLabels: { enabled: false }
  };

  function createChart(el, opts) {
    var merged = {
      chart: Object.assign({}, chartDefaults.chart, opts.chart || {}),
      theme: chartDefaults.theme,
      grid: chartDefaults.grid,
      tooltip: chartDefaults.tooltip,
      xaxis: Object.assign({}, chartDefaults.xaxis, opts.xaxis || {}),
      yaxis: Object.assign({}, chartDefaults.yaxis, opts.yaxis || {}),
      dataLabels: opts.dataLabels !== undefined ? opts.dataLabels : chartDefaults.dataLabels
    };
    ['series','labels','colors','stroke','fill','plotOptions','legend','markers','title'].forEach(function (k) { if (opts[k] !== undefined) merged[k] = opts[k]; });
    new ApexCharts(el, merged).render();
  }

  function animateCountUps() {
    document.querySelectorAll('.count-up').forEach(function (el) {
      var target = parseInt(el.dataset.target, 10) || 0;
      var suffix = el.dataset.suffix || '';
      var duration = 1500, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.floor(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function buildSpark(id, color) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (var j = 0; j < 12; j++) {
      var h = Math.floor(Math.random() * 60) + 20;
      var bar = document.createElement('span');
      bar.style.height = h + '%';
      bar.style.background = j === 11 ? color : 'rgba(255,255,255,0.15)';
      el.appendChild(bar);
    }
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    var icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      danger: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' + message;
    container.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 4000);
  }

  // === VIEW INITIALIZERS ===
  function initOverview() {
    chartsInit.overview = true;
    buildSpark('sparkTasks', '#06B6D4');
    buildSpark('sparkAlerts', '#EF4444');
    buildSpark('sparkUptime', '#10B981');
    buildSpark('sparkCompleted', '#F59E0B');
    animateCountUps();
    renderProductionLine();
    renderOperatorsList();
    renderEnvGrid();

    createChart(document.querySelector('#chartActivityTrend'), { chart:{type:'area',height:300}, series:[{name:'Tasks Completed',data:D.activityData},{name:'Tasks Assigned',data:D.activityData2}], stroke:{width:2.5,curve:'straight'}, fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:0.35,opacityTo:0.05,stops:[0,90,100]}}, colors:['#06B6D4','#F59E0B'], xaxis:{categories:D.hours}, tooltip:{shared:true,intersect:false} });
    createChart(document.querySelector('#chartTaskStatus'), { chart:{type:'donut',height:280}, series:D.taskStatus.values, labels:D.taskStatus.labels, colors:['#06B6D4','#10B981','#F97316','#EF4444'], plotOptions:{pie:{donut:{size:'68%',labels:{show:true,name:{show:true},value:{show:true,fontFamily:"'Roboto Mono', monospace",fontWeight:700,fontSize:'18px'}}}}}, legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartShiftPerf'), { chart:{type:'bar',height:280}, series:[{name:'Completed',data:D.shiftPerf.completed},{name:'Target',data:D.shiftPerf.target}], colors:['#06B6D4','rgba(6,182,212,0.2)'], plotOptions:{bar:{borderRadius:8,columnWidth:'50%',borderRadiusApplication:'end'}}, xaxis:{categories:D.shiftPerf.labels} });
    createChart(document.querySelector('#chartOEE'), { chart:{type:'line',height:280}, series:[{name:'OEE %',data:D.oeeData}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:0.35,opacityTo:0.05}}, colors:['#10B981'], xaxis:{categories:['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10']}, yaxis:{min:75,max:100} });
    renderAlertsFeed();
  }

  function renderProductionLine() {
    var stages = [{label:'Inbound',value:'94%',status:'completed'},{label:'Assembly',value:'87%',status:'active'},{label:'QA Scan',value:'92%',status:'active'},{label:'Packaging',value:'78%',status:'active'},{label:'Outbound',value:'65%',status:'pending'}];
    var line = document.getElementById('productionLine');
    if (!line) return;
    line.innerHTML = '';
    stages.forEach(function (s, i) {
      var div = document.createElement('div');
      div.className = 'prod-stage ' + s.status;
      div.innerHTML = '<div class="prod-stage-label">' + s.label + '</div><div class="prod-stage-value">' + s.value + '</div>';
      line.appendChild(div);
      if (i < stages.length - 1) { var arrow = document.createElement('span'); arrow.className = 'prod-stage-arrow'; arrow.textContent = '→'; line.appendChild(arrow); }
    });
  }

  function renderOperatorsList() {
    var list = document.getElementById('operatorsList');
    if (!list) return;
    list.innerHTML = '';
    D.operators.slice(0,5).forEach(function (name) {
      var initials = name.split(' ').map(function (n) { return n.charAt(0); }).join('');
      var row = document.createElement('div');
      row.className = 'operator-row';
      row.innerHTML = '<div class="operator-avatar">' + initials + '</div><div class="operator-info"><div class="operator-name">' + name + '</div><div class="operator-role">Operator</div></div><span class="operator-status"></span>';
      list.appendChild(row);
    });
  }

  function renderEnvGrid() {
    var grid = document.getElementById('envGrid');
    if (!grid) return;
    grid.innerHTML = '';
    D.env.forEach(function (e) {
      var item = document.createElement('div');
      item.className = 'env-item';
      item.innerHTML = '<span class="env-value">' + e.value + '</span><div class="env-label">' + e.label + '</div>';
      grid.appendChild(item);
    });
  }

  function renderAlertsFeed() {
    var feed = document.getElementById('alertsFeed');
    if (!feed) return;
    feed.innerHTML = '';
    D.alerts.forEach(function (a, i) {
      var item = document.createElement('div');
      item.className = 'alert-item';
      item.style.animationDelay = (i * 0.06) + 's';
      item.innerHTML = '<div class="alert-severity ' + a.severity + '"></div><div class="alert-body"><div class="alert-title">' + a.title + '</div><div class="alert-desc">' + a.desc + '</div><div class="alert-time">' + a.time + '</div></div>';
      feed.appendChild(item);
    });
  }

  function initLive() {
    chartsInit.live = true;
    createChart(document.querySelector('#chartActivityTimeline'), { chart:{type:'area',height:300,animations:{enabled:true,easing:'linear',dynamicAnimation:{speed:1000}}}, series:[{name:'Throughput',data:D.activityData.slice()}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:0.45,opacityTo:0.05}}, colors:['#10B981'], xaxis:{categories:D.hours} });
    createChart(document.querySelector('#chartCpuMemScatter'), { chart:{type:'scatter',height:280}, series:[{name:'Nodes',data:[[45,62],[32,48],[78,84],[52,60],[89,92],[24,38],[67,72],[55,58]]}], colors:['#06B6D4'], xaxis:{title:{text:'CPU %',style:{fontSize:'11px',color:'#64748B'}},min:0,max:100}, yaxis:{title:{text:'Memory %',style:{fontSize:'11px',color:'#64748B'}},min:0,max:100} });
    createChart(document.querySelector('#chartRobotUtil'), { chart:{type:'bar',height:280}, series:[{name:'Utilization %',data:[92,88,76,95,84,79,91,86]}], colors:['#F59E0B'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%',distributed:true}}, xaxis:{categories:['R1','R2','R3','R4','R5','R6','R7','R8']} });
    renderHeatmap();
    renderLiveEvents();
  }

  function renderHeatmap() {
    var grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 7; c++) {
        var cell = document.createElement('div');
        cell.className = 'heatmap-cell level-' + Math.floor(Math.random() * 5);
        cell.title = 'Station ' + (r * 7 + c + 1);
        grid.appendChild(cell);
      }
    }
  }

  function renderLiveEvents() {
    var list = document.getElementById('liveEventsList');
    if (!list) return;
    list.innerHTML = '';
    var events = [{title:'AGV Alpha completed route A-7',type:'success',time:'Just now'},{title:'Quality scan passed — Batch #4492',type:'info',time:'12s ago'},{title:'Conveyor Line 2 speed adjusted',type:'warning',time:'34s ago'},{title:'Operator Chen logged into Station 4',type:'info',time:'1m ago'},{title:'Welder Station 5 returned online',type:'success',time:'2m ago'}];
    events.forEach(function (e, i) {
      var item = document.createElement('div');
      item.className = 'live-event-item';
      item.style.animationDelay = (i * 0.08) + 's';
      item.innerHTML = '<span class="live-event-dot ' + e.type + '"></span><div class="live-event-content"><div class="live-event-title">' + e.title + '</div><div class="live-event-time">' + e.time + '</div></div>';
      list.appendChild(item);
    });
  }

  function initEquipment() {
    chartsInit.equipment = true;
    var online = D.equipment.filter(function (e) { return e.status === 'online'; }).length;
    var maint = D.equipment.filter(function (e) { return e.status === 'maintenance'; }).length;
    var offline = D.equipment.filter(function (e) { return e.status === 'offline'; }).length;
    var elOnline = document.getElementById('equipOnline'); if (elOnline) elOnline.textContent = online;
    var elMaint = document.getElementById('equipMaint'); if (elMaint) elMaint.textContent = maint;
    var elOffline = document.getElementById('equipOffline'); if (elOffline) elOffline.textContent = offline;
    var elTotal = document.getElementById('equipTotal'); if (elTotal) elTotal.textContent = D.equipment.length;

    var grid = document.getElementById('equipmentGrid');
    if (grid) {
      grid.innerHTML = '';
      D.equipment.forEach(function (eq, i) {
        var card = document.createElement('div');
        card.className = 'equip-card';
        card.style.animationDelay = (i * 0.08) + 's';
        card.innerHTML = '<div class="equip-header"><span class="equip-name">' + eq.name + '</span><span class="equip-status ' + eq.status + '">' + eq.status.charAt(0).toUpperCase() + eq.status.slice(1) + '</span></div><div class="equip-meta"><span>' + eq.hours.toLocaleString() + ' hrs</span><span>Age: ' + eq.age + 'y</span></div><div class="equip-progress-wrap"><div class="equip-progress-label"><span>Availability</span><span>' + eq.availability + '%</span></div><div class="equip-progress-bar"><div class="equip-progress-fill" style="width:' + eq.availability + '%"></div></div></div>';
        grid.appendChild(card);
      });
    }

    createChart(document.querySelector('#chartAvailability'), { chart:{type:'radialBar',height:280}, series:[91], labels:['Overall Availability'], colors:['#06B6D4'], plotOptions:{radialBar:{hollow:{size:'68%'},track:{background:'rgba(255,255,255,0.06)'},dataLabels:{name:{fontSize:'12px'},value:{fontFamily:"'Roboto Mono', monospace",fontSize:'24px',fontWeight:700}}}}, stroke:{lineCap:'round'} });
    createChart(document.querySelector('#chartDowntime'), { chart:{type:'bar',height:280}, series:[{name:'Downtime (hrs)',data:[4.2,3.8,5.1,2.9,6.3,3.5,4.8]}], colors:['#EF4444'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']} });
    createChart(document.querySelector('#chartMtbf'), { chart:{type:'line',height:280}, series:[{name:'MTBF (hrs)',data:[820,845,800,880,910,895,930]},{name:'MTTR (hrs)',data:[2.4,2.1,2.8,1.9,1.7,2.0,1.8]}], colors:['#06B6D4','#F59E0B'], stroke:{width:[3,3],curve:'straight'}, xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul']}, tooltip:{shared:true} });
    createChart(document.querySelector('#chartEquipAge'), { chart:{type:'donut',height:280}, series:[8,12,6,4], labels:['0-2 yrs','2-4 yrs','4-6 yrs','6+ yrs'], colors:['#10B981','#06B6D4','#F59E0B','#EF4444'], plotOptions:{pie:{donut:{size:'65%'}}}, legend:{position:'bottom',fontSize:'12px'} });
    renderMaintenanceCalendar();
  }

  function renderMaintenanceCalendar() {
    var cal = document.getElementById('maintenanceCalendar');
    if (!cal) return;
    cal.innerHTML = '';
    var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    days.forEach(function (d) { var h = document.createElement('div'); h.className = 'cal-day-header'; h.textContent = d; cal.appendChild(h); });
    var maintDays = [3,7,12,15,18,22,27];
    for (var k = 1; k <= 30; k++) {
      var day = document.createElement('div');
      day.className = 'cal-day' + (maintDays.indexOf(k) >= 0 ? ' has-maintenance' : '');
      day.textContent = k;
      if (maintDays.indexOf(k) >= 0) day.title = 'Scheduled maintenance';
      cal.appendChild(day);
    }
  }

  function initAlerts() {
    chartsInit.alerts = true;
    var crit = D.fullAlerts.filter(function (a) { return a.severity === 'critical'; }).length;
    var warn = D.fullAlerts.filter(function (a) { return a.severity === 'warning'; }).length;
    var info = D.fullAlerts.filter(function (a) { return a.severity === 'info'; }).length;
    var elCrit = document.getElementById('alertCriticalCount'); if (elCrit) elCrit.textContent = crit;
    var elWarn = document.getElementById('alertWarningCount'); if (elWarn) elWarn.textContent = warn;
    var elInfo = document.getElementById('alertInfoCount'); if (elInfo) elInfo.textContent = info;
    var elTotal = document.getElementById('alertTotalCount'); if (elTotal) elTotal.textContent = D.fullAlerts.length;

    createChart(document.querySelector('#chartSeverity'), { chart:{type:'pie',height:280}, series:[35,40,25], labels:['Critical','Warning','Info'], colors:['#EF4444','#F97316','#06B6D4'], legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartAlertVolume'), { chart:{type:'area',height:280}, series:[{name:'Alerts',data:[12,18,14,22,16,20,24,19,15,21,17,13]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:0.35,opacityTo:0.05}}, colors:['#EF4444'], xaxis:{categories:D.hours} });
    createChart(document.querySelector('#chartAlertsByAsset'), { chart:{type:'bar',height:280}, series:[{name:'Alerts',data:[8,12,5,9,6,11,4,7]}], colors:['#F59E0B'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%',distributed:true}}, xaxis:{categories:['Arm #1','AGV','Conv','Drone','CNC','Welder','Pack','Scan']} });
    createChart(document.querySelector('#chartResolution'), { chart:{type:'line',height:280}, series:[{name:'Avg Resolution (min)',data:[18,22,15,28,12,20,16,14]}], colors:['#F59E0B'], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']} });

    renderAlertsList('all');
    document.querySelectorAll('.filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        renderAlertsList(this.dataset.filter);
      });
    });
  }

  function renderAlertsList(filter) {
    var list = document.getElementById('alertsList');
    if (!list) return;
    list.innerHTML = '';
    var items = filter === 'all' ? D.fullAlerts : D.fullAlerts.filter(function (a) { return a.severity === filter; });
    items.forEach(function (a, i) {
      var card = document.createElement('div');
      card.className = 'alert-card';
      card.style.animationDelay = (i * 0.04) + 's';
      card.innerHTML = '<div class="alert-card-header"><span class="alert-card-severity ' + a.severity + '">' + a.severity.toUpperCase() + '</span><span class="alert-card-time">' + a.time + '</span></div><div class="alert-card-title">' + a.title + '</div><div class="alert-card-desc">' + a.desc + '</div>';
      list.appendChild(card);
    });
  }

  function initTasks() {
    chartsInit.tasks = true;
    updateTaskSummary();
    createChart(document.querySelector('#chartPriority'), { chart:{type:'bar',height:280}, series:[{name:'Tasks',data:D.priorityDist.values}], colors:['#EF4444','#F97316','#06B6D4','#10B981'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%',distributed:true}}, xaxis:{categories:D.priorityDist.labels} });
    createChart(document.querySelector('#chartCompletion'), { chart:{type:'line',height:280}, series:[{name:'Completion %',data:[72,78,74,82,80,85,88,84,86,90]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#10B981'], xaxis:{categories:['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10']}, yaxis:{min:60,max:100} });
    renderKanban();
    createChart(document.querySelector('#chartFunnel'), { chart:{type:'bar',height:280}, series:[{name:'Tasks',data:[120,95,78,62,48]}], colors:['#06B6D4'], plotOptions:{bar:{horizontal:true,borderRadius:8,barHeight:'55%'}}, xaxis:{categories:['Created','Assigned','In Progress','Review','Completed']} });
    createChart(document.querySelector('#chartTasksByAssignee'), { chart:{type:'bar',height:280}, series:[{name:'Tasks',data:[5,3,4,2,3]}], colors:['#F59E0B'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:D.operators.slice(0,5)} });
  }

  function updateTaskSummary() {
    var total = document.getElementById('taskTotalCount'); if (total) total.textContent = D.tasks.length;
    var overdue = document.getElementById('taskOverdueCount'); if (overdue) overdue.textContent = 3;
    var due = document.getElementById('taskDueCount'); if (due) due.textContent = 8;
    var done = document.getElementById('taskDoneCount'); if (done) done.textContent = D.tasks.filter(function (t) { return t.status === 'done'; }).length;
  }

  function renderKanban() {
    var todo = document.getElementById('kanbanTodo');
    var progress = document.getElementById('kanbanProgress');
    var done = document.getElementById('kanbanDone');
    if (!todo || !progress || !done) return;
    todo.innerHTML = ''; progress.innerHTML = ''; done.innerHTML = '';
    D.tasks.forEach(function (t) {
      var card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = '<div class="kanban-card-title">' + t.title + '</div><div class="kanban-card-meta"><span class="kanban-card-priority ' + t.priority + '">' + t.priority.toUpperCase() + '</span><span>' + t.assignee + '</span></div>';
      if (t.status === 'todo') todo.appendChild(card);
      else if (t.status === 'progress') progress.appendChild(card);
      else done.appendChild(card);
    });
    var cTodo = document.getElementById('kanbanTodoCount'); if (cTodo) cTodo.textContent = todo.children.length;
    var cProg = document.getElementById('kanbanProgressCount'); if (cProg) cProg.textContent = progress.children.length;
    var cDone = document.getElementById('kanbanDoneCount'); if (cDone) cDone.textContent = done.children.length;
  }

  function initReports() {
    chartsInit.reports = true;
    var exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) exportBtn.addEventListener('click', function () {
      var csv = 'Week,Efficiency,Throughput,Quality\n';
      var weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10'];
      var eff = [82,85,83,88,86,90,87,91,89,93];
      var thr = [1100,1200,1150,1300,1250,1400,1350,1450,1400,1500];
      var qual = [94,96,95,97,96,98,97,99,98,99];
      for (var w = 0; w < weeks.length; w++) csv += weeks[w] + ',' + eff[w] + ',' + thr[w] + ',' + qual[w] + '\n';
      var blob = new Blob([csv], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'stackly-performance-report.csv';
      a.click();
      showToast('Report exported successfully', 'success');
    });

    createChart(document.querySelector('#chartMultiMetric'), { chart:{type:'line',height:360}, series:[{name:'Efficiency %',data:[82,85,83,88,86,90,87,91,89,93]},{name:'Throughput',data:[1100,1200,1150,1300,1250,1400,1350,1450,1400,1500]},{name:'Quality Score',data:[94,96,95,97,96,98,97,99,98,99]}], stroke:{width:[3,3,3],curve:'straight'}, colors:['#06B6D4','#F59E0B','#10B981'], xaxis:{categories:['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10']}, tooltip:{shared:true,intersect:false}, yaxis:[{seriesName:'Efficiency %',min:70,max:100,title:{text:'Efficiency %',style:{fontSize:'11px'}}},{seriesName:'Throughput',opposite:true,title:{text:'Throughput',style:{fontSize:'11px'}}},{seriesName:'Quality Score',min:90,max:100,show:false}] });
    createChart(document.querySelector('#chartOperatorTarget'), { chart:{type:'bar',height:280}, series:[{name:'Operator',data:[42,38,35,45]},{name:'Target',data:[40,40,40,40]}], colors:['#06B6D4','rgba(6,182,212,0.2)'], plotOptions:{bar:{borderRadius:8,columnWidth:'50%'}}, xaxis:{categories:['Shift A','Shift B','Shift C','Shift D']} });
    createChart(document.querySelector('#chartEfficiency'), { chart:{type:'donut',height:280}, series:[87,8,5], labels:['Efficient','Idle','Downtime'], colors:['#10B981','#F59E0B','#EF4444'], plotOptions:{pie:{donut:{size:'65%'}}}, legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartDefectPareto'), { chart:{type:'bar',height:280}, series:[{name:'Defects',data:[42,28,19,14,9,6]}], colors:['#EF4444'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:['Scratch','Dimension','Color','Assembly','Leakage','Other']} });
    createChart(document.querySelector('#chartCostPerUnit'), { chart:{type:'area',height:280}, series:[{name:'Cost ($)',data:[12.4,12.1,11.8,11.5,11.2,10.9,10.7,10.5]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#06B6D4'], xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']} });
  }

  function initProfile() {
    var heatmap = document.getElementById('activityHeatmap');
    if (!heatmap || heatmap.dataset.rendered) return;
    heatmap.dataset.rendered = 'true';
    heatmap.innerHTML = '';
    for (var i = 0; i < 49; i++) {
      var day = document.createElement('div');
      day.className = 'heatmap-day active-' + Math.floor(Math.random() * 5);
      heatmap.appendChild(day);
    }
  }

  // === LIVE SIMULATION ===
  setInterval(function () {
    var val = document.getElementById('throughputValue');
    if (val) val.textContent = (1200 + Math.floor(Math.random() * 300)).toLocaleString();
    var lat = document.getElementById('latencyValue');
    if (lat) lat.textContent = (8 + Math.floor(Math.random() * 18));
    var health = document.getElementById('systemHealthMini');
    if (health) { var h = (96 + Math.random() * 4).toFixed(1); health.textContent = h + '%'; }
  }, 2500);

  setInterval(function () {
    var events = [
      { msg: 'Task batch completed: 12 units processed', type: 'success' },
      { msg: 'AGV Fleet Alpha recharging at dock 3', type: 'info' },
      { msg: 'Sensor calibration scheduled for tomorrow', type: 'warning' },
      { msg: 'New task assigned: Inspect Welder Station 5', type: 'info' },
      { msg: 'Throughput spike detected on Line 2', type: 'success' },
      { msg: 'Network latency normalized', type: 'info' }
    ];
    var evt = events[Math.floor(Math.random() * events.length)];
    showToast(evt.msg, evt.type);
    var badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = (parseInt(badge.textContent, 10) || 0) + 1; }
  }, 12000);

  // === INITIAL ===
  handleHash();
  if (!window.location.hash) navigateTo('overview');
})();
