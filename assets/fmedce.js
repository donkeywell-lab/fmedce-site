(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed){ return function(){ seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  /* ---------- hero: noise resolving into signal ---------- */
  var fc = document.getElementById('field'), fx = fc && fc.getContext('2d');
  var pts = [], FW = 0, FH = 0, running = true, t0 = 0;

  function seedField(){
    var rand = rng(20260821), N = 460;
    pts = [];
    for (var i = 0; i < N; i++){
      var col = i % 23, row = Math.floor(i / 23);
      var gx = (col + 0.5) / 23, gy = (row + 0.5) / 21;
      pts.push({
        gx: gx, gy: gy,
        jx: (rand() - 0.5) * 0.42, jy: (rand() - 0.5) * 0.78,
        ph: rand() * 6.283,
        sp: 0.5 + rand() * 0.9
      });
    }
  }
  function sizeField(){
    if (!fc) return;
    FW = fc.clientWidth; FH = fc.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    fc.width = FW * dpr; fc.height = FH * dpr;
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawField(time){
    if (!fx || !FW) return;
    var t = (time - t0) / 1000;
    fx.clearRect(0, 0, FW, FH);
    for (var i = 0; i < pts.length; i++){
      var p = pts[i];
      var order = Math.min(1, Math.max(0, (p.gx - 0.10) / 0.78));
      order = order * order * (3 - 2 * order);
      var chaos = 1 - order;
      var breathe = reduce ? 0 : Math.sin(t * 0.26 * p.sp + p.ph) * 0.035 * chaos;
      var x = (p.gx + p.jx * chaos + breathe) * FW;
      var y = (p.gy + p.jy * chaos + breathe * 0.7) * FH;
      var a = 0.20 + order * 0.45;
      fx.beginPath();
      fx.arc(x, y, order > 0.72 ? 1.9 : 1.25, 0, 6.283);
      fx.fillStyle = 'rgba(127,196,220,' + a.toFixed(3) + ')';
      fx.fill();
    }
    for (var k = 0; k < 10; k++){
      fx.beginPath();
      fx.arc(FW * 0.935, FH * (0.26 + k * 0.05), 2.8, 0, 6.283);
      fx.fillStyle = 'rgba(227,156,126,0.9)';
      fx.fill();
    }
    if (running && !reduce) requestAnimationFrame(drawField);
  }

  if (fc){
    seedField(); sizeField();
    t0 = performance.now();
    requestAnimationFrame(drawField);
    var ft;
    window.addEventListener('resize', function(){ clearTimeout(ft); ft = setTimeout(function(){ sizeField(); if (reduce) drawField(performance.now()); }, 150); });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting && !running && !reduce){ running = true; t0 = performance.now(); requestAnimationFrame(drawField); }
          if (!e.isIntersecting) running = false;
        });
      }, {threshold:0}).observe(fc);
    }
  }

  /* ---------- the sieve: 400 marks in, 10 out ---------- */
  function drawSieve(cv, progress){
    var g = cv.getContext('2d');
    var w = cv.clientWidth, h = cv.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    var cols = [
      {n:420, x:w*0.16, c:'#4E7182', r:2.0, sp:22, al:0.62},
      {n:60,  x:w*0.50, c:'#68A9C1', r:2.9, sp:9,  al:0.85},
      {n:10,  x:w*0.84, c:'#9FDDF1', r:4.2, sp:4,  al:1.0}
    ];
    for (var ci = 0; ci < cols.length; ci++){
      var col = cols[ci], rand = rng(881 + ci * 401);
      var appear = Math.min(1, Math.max(0, (progress - ci * 0.22) / 0.55));
      var rows = Math.ceil(col.n / col.sp);
      var cw = col.sp * 8.2, ch = rows * 8.2;
      for (var i = 0; i < col.n; i++){
        if (i / col.n > appear) break;
        var cx = col.x - cw/2 + (i % col.sp) * 8.2 + (rand() - 0.5) * 2.0;
        var cy = h/2 - ch/2 + Math.floor(i / col.sp) * 8.2 + (rand() - 0.5) * 2.0;
        g.beginPath(); g.arc(cx, cy, col.r, 0, 6.283);
        g.fillStyle = col.c; g.globalAlpha = col.al;
        g.fill();
      }
    }
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(127,196,220,0.35)'; g.lineWidth = 1;
    [[w*0.29, w*0.39],[w*0.62, w*0.73]].forEach(function(seg){
      g.beginPath(); g.moveTo(seg[0], h/2); g.lineTo(seg[1], h/2); g.stroke();
      g.beginPath(); g.moveTo(seg[1]-6, h/2-4); g.lineTo(seg[1], h/2); g.lineTo(seg[1]-6, h/2+4); g.stroke();
    });
  }
  var sieveCv = document.querySelector('#sieve canvas');
  function runSieve(){
    if (!sieveCv) return;
    if (reduce){ drawSieve(sieveCv, 1); return; }
    var start = performance.now();
    (function step(now){
      var p = Math.min(1, (now - start) / 1600);
      drawSieve(sieveCv, p);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  window.addEventListener('resize', function(){ if (sieveCv && sieveCv.dataset.done) drawSieve(sieveCv, 1); });

  /* ---------- fascicle summit glyphs ---------- */
  function glyph(cv){
    var g = cv.getContext('2d'), s = cv.width, seed = +cv.dataset.seed || 1;
    var rand = rng(1013 * seed + 77);
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,s,s);
    var rings = 4 + Math.floor(rand() * 3);
    var tilt = (rand() - 0.5) * 0.9, squash = 0.72 + rand() * 0.26;
    var f1 = 2 + Math.floor(rand()*3), f2 = 4 + Math.floor(rand()*4);
    var a1 = 0.10 + rand()*0.13, a2 = 0.05 + rand()*0.08;
    var ph1 = rand()*6.28, ph2 = rand()*6.28;
    var dx = (rand()-0.5)*s*0.10, dy = (rand()-0.5)*s*0.10;
    g.translate(s/2, s/2); g.rotate(tilt);
    for (var r = 0; r < rings; r++){
      var t0r = r / rings, rad = s * 0.42 * (1 - t0r * 0.74);
      g.beginPath();
      for (var a = 0; a <= 72; a++){
        var t = (a/72) * Math.PI * 2;
        var k = rad * (1 + Math.sin(t*f1 + ph1 + r*0.5)*a1 + Math.sin(t*f2 + ph2 - r*0.3)*a2);
        var x = dx*t0r + Math.cos(t)*k, y = dy*t0r + Math.sin(t)*k*squash;
        a === 0 ? g.moveTo(x,y) : g.lineTo(x,y);
      }
      g.closePath();
      g.lineWidth = 2.4; g.strokeStyle = '#7FC4DC';
      g.globalAlpha = 0.24 + r * (0.6 / rings);
      g.stroke();
    }
    g.beginPath(); g.arc(dx, dy, 3.2, 0, 6.283);
    g.fillStyle = '#E39C7E'; g.globalAlpha = 0.95; g.fill();
    g.setTransform(1,0,0,1,0,0); g.globalAlpha = 1;
  }
  [].slice.call(document.querySelectorAll('canvas[data-seed]')).forEach(glyph);

  /* ---------- scroll rail ---------- */
  var rail = document.getElementById('rail'), ticking = false;
  function railUpdate(){
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    if (rail) rail.style.width = (Math.min(1, window.scrollY / max) * 100) + '%';
  }
  window.addEventListener('scroll', function(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){ railUpdate(); ticking = false; });
  }, {passive:true});
  railUpdate();

  /* ---------- reveals ---------- */
  var items = [].slice.call(document.querySelectorAll('.rv, .band'));
  if (reduce || !('IntersectionObserver' in window)){
    items.forEach(function(el){ el.classList.add('in'); });
    if (sieveCv){ runSieve(); sieveCv.dataset.done = '1'; }
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.id === 'sieve' && sieveCv){ runSieve(); sieveCv.dataset.done = '1'; }
        io.unobserve(e.target);
      });
    }, {rootMargin:'0px 0px -10% 0px', threshold:0.1});
    items.forEach(function(el){ io.observe(el); });
  }
})();
