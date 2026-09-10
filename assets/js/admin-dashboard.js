/**
 * STACKLY Administrator Command Center — SPA Controller
 */
(function () {
  'use strict';

  var USER_KEY = 'user';
  function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } }

  var user = getUser();
  if (!user || user.role !== 'Administrator') {
    window.location.href = 'login.html';
    return;
  }

  var initial = (user.fullName || 'A').charAt(0).toUpperCase();
  var displayName = user.fullName || 'Administrator';
  var email = user.email || 'admin@stackly.com';

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
    window.location.href = 'login.html';
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
  var chartsInit = { overview: false, users: false, deployments: false, fleet: false, security: false, billing: false, audit: false };

  function navigateTo(viewId) {
    views.forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');
    sidebarLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === viewId); });
    mobileLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === viewId); });
    var activeLink = document.querySelector('.sidebar-link[data-view="' + viewId + '"]');
    var title = activeLink ? activeLink.dataset.title || viewId : viewId;
    if (pageTitle) pageTitle.textContent = title;
    if (breadcrumb) breadcrumb.innerHTML = 'Admin Command Center / <span>' + title + '</span>';

    if (viewId === 'overview' && !chartsInit.overview) initOverview();
    if (viewId === 'users' && !chartsInit.users) initUsers();
    if (viewId === 'deployments' && !chartsInit.deployments) initDeployments();
    if (viewId === 'fleet' && !chartsInit.fleet) initFleet();
    if (viewId === 'security' && !chartsInit.security) initSecurity();
    if (viewId === 'billing' && !chartsInit.billing) initBilling();
    if (viewId === 'audit' && !chartsInit.audit) initAudit();
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
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    adminActions: [
      { severity: 'info', title: 'Added new operator account', desc: 'Jordan Blake was invited by Admin.', time: '3 min ago' },
      { severity: 'warning', title: 'Updated fleet firmware policy', desc: 'Auto-update window changed to 02:00 UTC.', time: '12 min ago' },
      { severity: 'info', title: 'Exported quarterly report', desc: 'Billing and performance data exported.', time: '28 min ago' },
      { severity: 'critical', title: 'Reset failed-login lockout', desc: 'User maria.lopez lockout cleared.', time: '41 min ago' },
      { severity: 'info', title: 'New site registered', desc: 'Berlin Factory Node added to deployments.', time: '1 hr ago' }
    ],
    users: [
      { name: 'Alex Chen', email: 'alex.chen@stackly.com', role: 'Operator', status: 'active', lastActive: '2m ago' },
      { name: 'Maria Lopez', email: 'maria.lopez@stackly.com', role: 'Operator', status: 'active', lastActive: '5m ago' },
      { name: 'Sam Park', email: 'sam.park@stackly.com', role: 'Operator', status: 'active', lastActive: '12m ago' },
      { name: 'Jordan Blake', email: 'jordan.blake@stackly.com', role: 'Operator', status: 'pending', lastActive: 'Never' },
      { name: 'Taylor Reed', email: 'taylor.reed@stackly.com', role: 'Administrator', status: 'active', lastActive: '1m ago' },
      { name: 'Casey Kim', email: 'casey.kim@stackly.com', role: 'Operator', status: 'inactive', lastActive: '3d ago' },
      { name: 'Riley Singh', email: 'riley.singh@stackly.com', role: 'Operator', status: 'active', lastActive: '18m ago' },
      { name: 'Drew Patel', email: 'drew.patel@stackly.com', role: 'Administrator', status: 'active', lastActive: '7m ago' }
    ],
    sites: [
      { name: 'Detroit Factory', location: 'USA', robots: 24, throughput: '1.2M' },
      { name: 'Berlin Node', location: 'Germany', robots: 18, throughput: '980K' },
      { name: 'Shenzhen Hub', location: 'China', robots: 22, throughput: '1.4M' },
      { name: 'São Paulo Plant', location: 'Brazil', robots: 12, throughput: '620K' },
      { name: 'Toronto Lab', location: 'Canada', robots: 8, throughput: '410K' }
    ],
    auditLogs: [
      { type: 'user', title: 'User role changed: Operator → Administrator', actor: 'Taylor Reed', time: '2m ago' },
      { type: 'security', title: 'Failed login attempt from 185.22.10.4', actor: 'System', time: '5m ago' },
      { type: 'system', title: 'Scheduled maintenance completed', actor: 'System', time: '14m ago' },
      { type: 'user', title: 'New user invitation sent', actor: 'Admin', time: '22m ago' },
      { type: 'security', title: '2FA enabled for administrator account', actor: 'Drew Patel', time: '31m ago' },
      { type: 'system', title: 'Backup configuration updated', actor: 'System', time: '48m ago' }
    ]
  };

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
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      var duration = 1500, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = prefix + Math.floor(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function buildSpark(id, color) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < 12; i++) {
      var h = Math.floor(Math.random() * 60) + 20;
      var bar = document.createElement('span');
      bar.style.height = h + '%';
      bar.style.background = i === 11 ? color : 'rgba(255,255,255,0.15)';
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
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' + message;
    container.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 4000);
  }

  // === OVERVIEW ===
  function initOverview() {
    chartsInit.overview = true;
    buildSpark('sparkUsers', '#0EA5E9');
    buildSpark('sparkRobots', '#06B6D4');
    buildSpark('sparkSites', '#10B981');
    buildSpark('sparkSavings', '#F59E0B');
    animateCountUps();
    renderServiceGrid();
    renderSitesList();
    renderLicenseBars();
    renderAdminActionsFeed();

    createChart(document.querySelector('#chartPlatformActivity'), { chart:{type:'area',height:300}, series:[{name:'Logins',data:[120,180,250,310,280,340,410,380,420,390,450,480]},{name:'Operations',data:[80,140,190,240,220,290,330,310,360,340,390,410]}], stroke:{width:2.5,curve:'straight'}, fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:0.35,opacityTo:0.05}}, colors:['#0EA5E9','#F59E0B'], xaxis:{categories:['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00']}, tooltip:{shared:true,intersect:false} });
    createChart(document.querySelector('#chartRoles'), { chart:{type:'donut',height:280}, series:[186,24,26,12], labels:['Operators','Administrators','Pending','Inactive'], colors:['#0EA5E9','#F59E0B','#06B6D4','#64748B'], plotOptions:{pie:{donut:{size:'68%'}}}, legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartFleetGrowth'), { chart:{type:'bar',height:280}, series:[{name:'Robots',data:[42,48,55,62,68,74,80,84]}], colors:['#06B6D4'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']} });
    createChart(document.querySelector('#chartMonthlySpend'), { chart:{type:'bar',height:280}, series:[{name:'Spend ($K)',data:[18,19,21,20,22,24,25,26]}], colors:['#0EA5E9'], plotOptions:{bar:{borderRadius:6,columnWidth:'55%',distributed:true}}, xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']}, dataLabels:{enabled:false} });
  }

  function renderServiceGrid() {
    var grid = document.getElementById('serviceGrid');
    if (!grid) return;
    var services = [{name:'Auth Service',status:'online'},{name:'API Gateway',status:'online'},{name:'Telemetry',status:'online'},{name:'Notifications',status:'degraded'},{name:'Billing',status:'online'},{name:'Audit Pipeline',status:'online'}];
    grid.innerHTML = '';
    services.forEach(function (s) {
      var item = document.createElement('div');
      item.className = 'service-item';
      item.innerHTML = '<span class="service-name">' + s.name + '</span><span class="service-status ' + s.status + '">' + s.status + '</span>';
      grid.appendChild(item);
    });
  }

  function renderSitesList() {
    var list = document.getElementById('sitesList');
    if (!list) return;
    list.innerHTML = '';
    D.sites.slice(0,5).forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'site-row';
      row.innerHTML = '<div class="site-info"><span class="site-name">' + s.name + '</span><span class="site-location">' + s.location + '</span></div><span class="site-value">' + s.throughput + '</span>';
      list.appendChild(row);
    });
  }

  function renderLicenseBars() {
    var container = document.getElementById('licenseBars');
    if (!container) return;
    var items = [{label:'Operator Seats',value:74},{label:'Robot Licenses',value:62},{label:'Storage',value:45},{label:'API Calls',value:88}];
    container.innerHTML = '';
    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'license-item';
      div.innerHTML = '<div class="license-label"><span>' + item.label + '</span><span>' + item.value + '%</span></div><div class="license-bar"><div class="license-fill" style="width:' + item.value + '%"></div></div>';
      container.appendChild(div);
    });
  }

  function renderAdminActionsFeed() {
    var feed = document.getElementById('adminActionsFeed');
    if (!feed) return;
    feed.innerHTML = '';
    D.adminActions.forEach(function (a, i) {
      var item = document.createElement('div');
      item.className = 'alert-item';
      item.style.animationDelay = (i * 0.06) + 's';
      item.innerHTML = '<div class="alert-severity ' + a.severity + '"></div><div class="alert-body"><div class="alert-title">' + a.title + '</div><div class="alert-desc">' + a.desc + '</div><div class="alert-time">' + a.time + '</div></div>';
      feed.appendChild(item);
    });
  }

  // === USERS ===
  function initUsers() {
    chartsInit.users = true;
    document.getElementById('userTotal').textContent = 248;
    document.getElementById('userOperators').textContent = 186;
    document.getElementById('userAdmins').textContent = 24;
    document.getElementById('userInactive').textContent = 12;
    document.getElementById('userPending').textContent = 26;

    createChart(document.querySelector('#chartUserGrowth'), { chart:{type:'area',height:280}, series:[{name:'Users',data:[180,195,210,205,225,230,240,248]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#0EA5E9'], xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']} });
    createChart(document.querySelector('#chartUserRoles'), { chart:{type:'pie',height:280}, series:[186,24,26,12], labels:['Operators','Admins','Pending','Inactive'], colors:['#0EA5E9','#F59E0B','#06B6D4','#64748B'], legend:{position:'bottom',fontSize:'12px'} });
    renderUsersTable();
  }

  function renderUsersTable() {
    var table = document.getElementById('usersTable');
    if (!table) return;
    var html = '<thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Active</th></tr></thead><tbody>';
    D.users.forEach(function (u) {
      var initials = u.name.split(' ').map(function (n) { return n.charAt(0); }).join('');
      html += '<tr><td><div class="table-user"><div class="table-avatar">' + initials + '</div><div><div style="font-weight:600">' + u.name + '</div><div style="font-size:11px;color:var(--text-muted)">' + u.email + '</div></div></div></td>';
      html += '<td><span class="table-role ' + u.role.toLowerCase() + '">' + u.role + '</span></td>';
      html += '<td><span class="table-status ' + u.status + '"></span>' + u.status.charAt(0).toUpperCase() + u.status.slice(1) + '</td>';
      html += '<td>' + u.lastActive + '</td></tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
  }

  // === DEPLOYMENTS ===
  function initDeployments() {
    chartsInit.deployments = true;
    createChart(document.querySelector('#chartDeploymentMap'), { chart:{type:'bubble',height:360}, series:[{name:'Sites',data:[[-83,42,24],[13,52,18],[114,22,22],[-46,-23,12],[-79,43,8]]}], colors:['#0EA5E9'], dataLabels:{enabled:false}, xaxis:{tickAmount:1,labels:{show:false}}, yaxis:{tickAmount:1,labels:{show:false}} });
    createChart(document.querySelector('#chartRobotsByRegion'), { chart:{type:'donut',height:280}, series:[24,18,22,12,8], labels:['North America','Europe','Asia','South America','Other'], colors:['#0EA5E9','#06B6D4','#F59E0B','#10B981','#64748B'], plotOptions:{pie:{donut:{size:'65%'}}}, legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartSiteUtilization'), { chart:{type:'bar',height:280}, series:[{name:'Utilization %',data:[92,88,95,78,85]}], colors:['#F59E0B'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:['Detroit','Berlin','Shenzhen','São Paulo','Toronto']} });
    createChart(document.querySelector('#chartDeploymentTimeline'), { chart:{type:'line',height:280}, series:[{name:'Sites',data:[6,7,8,9,10,11,12,12]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#10B981'], xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']} });
  }

  // === FLEET ===
  function initFleet() {
    chartsInit.fleet = true;
    createChart(document.querySelector('#chartFleetModels'), { chart:{type:'donut',height:280}, series:[32,28,16,8], labels:['Titan Arm','AGV','Drone','CNC/Welder'], colors:['#0EA5E9','#06B6D4','#F59E0B','#10B981'], plotOptions:{pie:{donut:{size:'65%'}}}, legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartFirmware'), { chart:{type:'bar',height:280}, series:[{name:'Units',data:[42,28,14]}], colors:['#06B6D4'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%',distributed:true}}, xaxis:{categories:['v4.2','v4.1','v4.0']} });
    createChart(document.querySelector('#chartFleetAvailability'), { chart:{type:'line',height:280}, series:[{name:'Availability %',data:[94,95,93,96,94,97,96,98]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#10B981'], xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']}, yaxis:{min:90,max:100} });
    createChart(document.querySelector('#chartUnitsBySite'), { chart:{type:'bar',height:280}, series:[{name:'Robots',data:[24,18,22,12,8]}], colors:['#0EA5E9'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:['Detroit','Berlin','Shenzhen','São Paulo','Toronto']} });
  }

  // === SECURITY ===
  function initSecurity() {
    chartsInit.security = true;
    createChart(document.querySelector('#chartLoginAttempts'), { chart:{type:'area',height:280}, series:[{name:'Successful',data:[120,132,128,145,138,152,160,158]},{name:'Failed',data:[12,18,14,22,16,20,24,18]}], stroke:{width:2.5,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#10B981','#EF4444'], xaxis:{categories:['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon']}, tooltip:{shared:true} });
    createChart(document.querySelector('#chartAccessByRole'), { chart:{type:'pie',height:280}, series:[186,24], labels:['Operators','Administrators'], colors:['#0EA5E9','#F59E0B'], legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartSessionDuration'), { chart:{type:'bar',height:280}, series:[{name:'Minutes',data:[45,62,38,55,72,48,60]}], colors:['#06B6D4'], plotOptions:{bar:{borderRadius:8,columnWidth:'55%'}}, xaxis:{categories:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']} });
    createChart(document.querySelector('#chartPolicyCompliance'), { chart:{type:'radialBar',height:280}, series:[98], labels:['Compliance'], colors:['#10B981'], plotOptions:{radialBar:{hollow:{size:'68%'},track:{background:'rgba(255,255,255,0.06)'},dataLabels:{name:{fontSize:'12px'},value:{fontFamily:"'Roboto Mono', monospace",fontSize:'24px',fontWeight:700}}}}, stroke:{lineCap:'round'} });
  }

  // === BILLING ===
  function initBilling() {
    chartsInit.billing = true;
    createChart(document.querySelector('#chartLicenseConsumption'), { chart:{type:'bar',height:280}, series:[{name:'Used',data:[230,180,210,150]},{name:'Total',data:[300,250,300,200]}], colors:['#0EA5E9','rgba(14,165,233,0.2)'], plotOptions:{bar:{borderRadius:8,columnWidth:'50%'}}, xaxis:{categories:['Operators','Admins','Robots','Storage']} });
    createChart(document.querySelector('#chartSpendCategory'), { chart:{type:'donut',height:280}, series:[45,25,18,12], labels:['Compute','Licensing','Storage','Support'], colors:['#0EA5E9','#06B6D4','#F59E0B','#10B981'], plotOptions:{pie:{donut:{size:'65%'}}}, legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartBillingHistory'), { chart:{type:'area',height:280}, series:[{name:'Invoice ($K)',data:[22,23,21,24,25,24,26,26]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#0EA5E9'], xaxis:{categories:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']} });
  }

  // === AUDIT ===
  function initAudit() {
    chartsInit.audit = true;
    createChart(document.querySelector('#chartEventsCategory'), { chart:{type:'pie',height:280}, series:[35,20,45], labels:['User','Security','System'], colors:['#0EA5E9','#EF4444','#F97316'], legend:{position:'bottom',fontSize:'12px'} });
    createChart(document.querySelector('#chartEventsTime'), { chart:{type:'area',height:280}, series:[{name:'Events',data:[42,38,45,52,48,60,55,62]}], stroke:{width:3,curve:'straight'}, fill:{type:'gradient',gradient:{opacityFrom:0.35,opacityTo:0.05}}, colors:['#F59E0B'], xaxis:{categories:['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon']} });
    renderAuditLogs('all');
    document.querySelectorAll('.audit-filter-bar .filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.audit-filter-bar .filter-chip').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        renderAuditLogs(this.dataset.filter);
      });
    });
  }

  function renderAuditLogs(filter) {
    var list = document.getElementById('auditLogList');
    if (!list) return;
    list.innerHTML = '';
    var items = filter === 'all' ? D.auditLogs : D.auditLogs.filter(function (a) { return a.type === filter; });
    items.forEach(function (a, i) {
      var item = document.createElement('div');
      item.className = 'audit-log-item';
      item.style.animationDelay = (i * 0.04) + 's';
      item.innerHTML = '<span class="audit-log-dot ' + a.type + '"></span><div class="audit-log-body"><div class="audit-log-title">' + a.title + '</div><div class="audit-log-meta">' + a.actor + ' · ' + a.time + '</div></div>';
      list.appendChild(item);
    });
  }

  // === PROFILE ===
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
    var health = document.getElementById('systemHealthMini');
    if (health) { var h = (97 + Math.random() * 3).toFixed(1); health.textContent = h + '%'; }
  }, 3000);

  setInterval(function () {
    var events = [
      { msg: 'New user invitation accepted', type: 'success' },
      { msg: 'Backup completed across all regions', type: 'info' },
      { msg: 'License usage threshold approaching', type: 'warning' },
      { msg: 'Security policy sync completed', type: 'info' },
      { msg: 'Fleet firmware rollout started', type: 'success' },
      { msg: 'Failed login spike detected', type: 'danger' }
    ];
    var evt = events[Math.floor(Math.random() * events.length)];
    showToast(evt.msg, evt.type);
    var badge = document.getElementById('notifBadge');
    if (badge) badge.textContent = (parseInt(badge.textContent, 10) || 0) + 1;
  }, 14000);

  // === INITIAL ===
  handleHash();
  if (!window.location.hash) navigateTo('overview');
})();
