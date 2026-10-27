/**
 * NutriCalc Pro - BMI, Calorie & Nutrition Calculator
 * Maintains all original calculation formulas & strict medical safety constraints.
 */

// Utility Helpers
const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('th-TH');

// BMI Scales (Asian-Pacific Criteria: 15–35)
const MIN = 15, MAX = 35;
const bands = [
  { to: 18.5, c: '--c-low',  t: 'น้ำหนักน้อย', desc: 'น้ำหนักต่ำกว่าเกณฑ์มาตรฐาน ควรรับประทานอาหารที่มีคุณค่าทางโภชนาการเพิ่มขึ้น', pillClass: 'cat-low' },
  { to: 23,   c: '--c-ok',   t: 'ปกติ', desc: 'น้ำหนักอยู่ในเกณฑ์สุขภาพดี ความเสี่ยงต่อโรคที่เกี่ยวกับความอ้วนอยู่ในระดับต่ำสุด', pillClass: 'cat-ok' },
  { to: 25,   c: '--c-over', t: 'น้ำหนักเกิน', desc: 'น้ำหนักเกินเกณฑ์มาตรฐานเล็กน้อย ควรควบคุมอาหารและออกกำลังกายอย่างสม่ำเสมอ', pillClass: 'cat-over' },
  { to: 30,   c: '--c-ob1',  t: 'อ้วนระดับ 1', desc: 'น้ำหนักเกินเกณฑ์ในระดับที่เริ่มมีความเสี่ยงต่อโรคหัวใจ เบาหวาน และความดัน', pillClass: 'cat-ob1' },
  { to: MAX,  c: '--c-ob2',  t: 'อ้วนระดับ 2', desc: 'น้ำหนักเกินเกณฑ์ไปมาก ควรปรึกษาแพทย์หรือผู้เชี่ยวชาญเพื่อวางแผน', pillClass: 'cat-ob2' }
];

const pct = v => (Math.min(Math.max(v, MIN), MAX) - MIN) / (MAX - MIN) * 100;

// Initialize Visual Scale Bar & Ticks
(function initScale() {
  let prev = MIN;
  let html = '';
  bands.forEach(b => {
    const width = pct(b.to) - pct(prev);
    html += `<span style="width:${width}%;background:var(${b.c});"></span>`;
    prev = b.to;
  });
  $('scale').innerHTML = html;

  const ticks = [18.5, 23, 25, 30];
  $('ticks').innerHTML = ticks.map(v => `<i style="left:${pct(v)}%">${v}</i>`).join('');
})();

// Animated Number Counter for Smooth Transitions
function animateValue(element, start, end, duration = 600, isFloat = false) {
  if (!element) return;
  const startTime = performance.now();
  const diff = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease Out Quart
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = start + diff * ease;

    if (isFloat) {
      element.textContent = current.toFixed(1);
    } else {
      element.textContent = fmt(current);
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = isFloat ? end.toFixed(1) : fmt(end);
    }
  }

  requestAnimationFrame(update);
}

// Show Toast Notification
function showToast(message) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Main Calculation Function
function calc() {
  const sex = $('sex').value;
  const age = +$('age').value;
  const h = +$('h').value;
  const w = +$('w').value;
  const act = +$('act').value;
  const goal = $('goal').value;
  const err = $('err');

  // Input Validation
  if (!age || !h || !w) {
    err.textContent = 'กรุณากรอกอายุ ส่วนสูง และน้ำหนักให้ครบถ้วนก่อนคำนวณ';
    err.style.display = 'flex';
    return;
  }
  if (age < 18) {
    err.textContent = 'สูตรในเว็บนี้ออกแบบสำหรับผู้ใหญ่ (18 ปีขึ้นไป) หากอายุต่ำกว่า 18 ปี ควรปรึกษาแพทย์หรือนักกำหนดอาหาร เพราะเกณฑ์ของเด็กและวัยรุ่นต่างออกไป';
    err.style.display = 'flex';
    return;
  }
  if (age > 100 || h < 120 || h > 230 || w < 30 || w > 250) {
    err.textContent = 'ค่าที่กรอกอยู่นอกช่วงที่คำนวณได้ (อายุ 18–100 ปี, ส่วนสูง 120–230 ซม., น้ำหนัก 30–250 กก.)';
    err.style.display = 'flex';
    return;
  }
  err.textContent = '';
  err.style.display = 'none';

  // 1. BMI Calculation (Asian-Pacific Criteria)
  const m = h / 100;
  const bmi = w / (m * m);
  const band = bands.find(b => bmi < b.to) || bands[bands.length - 1];

  animateValue($('bmi'), 15, bmi, 500, true);
  $('bmiLabel').textContent = band.t;
  $('bmiLabel').style.setProperty('--tagc', `var(${band.c})`);
  if ($('bmiDescription')) {
    $('bmiDescription').textContent = band.desc;
  }

  // Pointer position & value badge
  const positionPct = pct(bmi);
  $('pin').style.left = `${positionPct}%`;
  if ($('pointerValue')) {
    $('pointerValue').textContent = bmi.toFixed(1);
  }

  // Highlight active BMI category pill
  document.querySelectorAll('.cat-pill').forEach(pill => pill.classList.remove('active'));
  const activePill = document.querySelector(`.${band.pillClass}`);
  if (activePill) activePill.classList.add('active');

  // Ideal weight range
  const lo = 18.5 * m * m;
  const hi = 22.9 * m * m;
  $('ideal').innerHTML = `น้ำหนักที่อยู่ในเกณฑ์ปกติสำหรับส่วนสูงนี้: <b>${lo.toFixed(1)} – ${hi.toFixed(1)} กก.</b>`;

  const weightDiffNote = $('weightDiffNote');
  if (weightDiffNote) {
    if (w > hi) {
      weightDiffNote.textContent = `(ปัจจุบันน้ำหนักเกินจากขอบบนเกณฑ์ปกติประมาณ ${(w - hi).toFixed(1)} กก.)`;
    } else if (w < lo) {
      weightDiffNote.textContent = `(ปัจจุบันน้ำหนักต่ำกว่าเกณฑ์ปกติประมาณ ${(lo - w).toFixed(1)} กก.)`;
    } else {
      weightDiffNote.textContent = `(น้ำหนักของคุณอยู่ในช่วงปกติแล้ว)`;
    }
  }

  // 2. BMR (Mifflin-St Jeor) and TDEE
  const bmr = 10 * w + 6.25 * h - 5 * age + (sex === 'm' ? 5 : -161);
  const tdee = bmr * act;

  // Initial target calories based on goal
  let target = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee;

  // STRICT MEDICAL SAFETY FLOOR ENFORCEMENT
  // Minimum safe calories: 1500 kcal for male, 1200 kcal for female.
  const floor = sex === 'm' ? 1500 : 1200;
  let floorTriggered = false;
  let note = '';

  if (target < floor) {
    target = floor;
    floorTriggered = true;
    note = `ปรับเป้าหมายขึ้นมาที่ขั้นต่ำปลอดภัย (${fmt(floor)} kcal) เพราะการกินน้อยกว่านี้เสี่ยงต่อสุขภาพ`;
  } else if (goal === 'lose') {
    note = 'ลบจาก TDEE 500 kcal ซึ่งลดได้ประมาณ 0.5 กก./สัปดาห์';
  } else if (goal === 'gain') {
    note = 'บวกจาก TDEE 300 kcal ควบคู่กับการฝึกแรงต้านเพื่อสร้างกล้ามเนื้อ';
  } else {
    note = 'พลังงานสมดุลเท่ากับ TDEE เพื่อรักษาน้ำหนักให้คงที่';
  }

  // Display Safety Floor Alert or General Calorie Note
  const safetyAlert = $('safetyFloorAlert');
  if (floorTriggered) {
    safetyAlert.style.display = 'flex';
    $('floorNote').textContent = note;
    $('generalCalorieNote').textContent = '';
  } else {
    safetyAlert.style.display = 'none';
    $('floorNote').textContent = '';
    $('generalCalorieNote').textContent = note;
  }

  // Animate Energy Stats
  animateValue($('bmr'), 0, bmr);
  animateValue($('tdee'), 0, tdee);
  animateValue($('target'), 0, target);

  // Water requirement (33 ml per kg)
  const waterLiters = w * 0.033;
  $('water').textContent = waterLiters.toFixed(1);
  if ($('waterGlasses')) {
    const glasses = Math.round(waterLiters / 0.25);
    $('waterGlasses').textContent = `ประมาณ ${glasses} แก้ว คิดจาก 33 มล. ต่อน้ำหนัก 1 กก.`;
  }

  // Calorie Delta Metric
  const delta = Math.round(target - tdee);
  const deltaEl = $('calorieDelta');
  const deltaDescEl = $('calorieDeltaDesc');
  if (deltaEl) {
    deltaEl.textContent = (delta > 0 ? `+${fmt(delta)}` : fmt(delta));
    if (deltaDescEl) {
      if (delta < 0) deltaDescEl.textContent = 'กินน้อยกว่าที่ใช้';
      else if (delta > 0) deltaDescEl.textContent = 'กินมากกว่าที่ใช้';
      else deltaDescEl.textContent = 'กินเท่าที่ใช้';
    }
  }

  // Goal Badge Pill & Explanation
  if ($('goalBadge')) {
    const goalMap = {
      'lose': 'ลดน้ำหนัก',
      'keep': 'คงน้ำหนัก',
      'gain': 'เพิ่มกล้ามเนื้อ'
    };
    $('goalBadge').textContent = goalMap[goal] || 'สุขภาพดี';
  }

  if ($('targetExplanation')) {
    if (floorTriggered) {
      $('targetExplanation').textContent = `ระบบปรับเป้าหมายให้อยู่ที่ขั้นต่ำปลอดภัย ${fmt(floor)} kcal/วัน เพื่อรักษาอัตราการเผาผลาญ`;
    } else if (goal === 'lose') {
      $('targetExplanation').textContent = 'กินน้อยกว่าที่ร่างกายใช้วันละ 500 กิโลแคลอรี่ เพื่อลดไขมัน';
    } else if (goal === 'gain') {
      $('targetExplanation').textContent = 'กินเกินที่ใช้เล็กน้อย ควบคู่กับการฝึกแรงต้าน';
    } else {
      $('targetExplanation').textContent = 'กินเท่าที่ร่างกายใช้ น้ำหนักจะคงที่';
    }
  }

  // 3. Macronutrient Distribution
  // Protein: g per kg based on goal & activity
  let perKg;
  if (goal === 'lose') {
    perKg = 1.6;
  } else if (goal === 'gain') {
    perKg = 1.8;
  } else {
    perKg = act <= 1.2 ? 0.8 : act <= 1.375 ? 1.0 : act <= 1.55 ? 1.2 : 1.4;
  }

  const proteinGrams = w * perKg;
  const fatGrams = (target * 0.25) / 9; // 25% of target calories
  const carbGrams = Math.max(0, (target - proteinGrams * 4 - fatGrams * 9) / 4);

  const kP = proteinGrams * 4;
  const kF = fatGrams * 9;
  const kC = carbGrams * 4;
  const kT = kP + kF + kC;

  const pctP = Math.round((kP / kT) * 100);
  const pctC = Math.round((kC / kT) * 100);
  const pctF = Math.round((kF / kT) * 100);
  $('ring').style.setProperty('--p', (kP / kT) * 100);
  $('ring').style.setProperty('--c', ((kP + kC) / kT) * 100);

  // Update Macro Bars & Percentages
  const parts = [
    { n: 'โปรตีน', g: proteinGrams, k: kP, c: 'var(--c-protein)', pct: pctP },
    { n: 'คาร์โบไฮเดรต', g: carbGrams, k: kC, c: 'var(--c-carb)', pct: pctC },
    { n: 'ไขมัน', g: fatGrams, k: kF, c: 'var(--c-fat)', pct: pctF }
  ];

  $('macroBar').innerHTML = parts.map(p =>
    `<span style="width:${(p.k / kT) * 100}%;background:${p.c}"></span>`
  ).join('');

  $('legend').innerHTML = parts.map(p =>
    `<span><i class="dot" style="background:${p.c}"></i>${p.n} ${fmt(p.g)} ก. (${p.pct}%)</span>`
  ).join('');

  // Update Detailed Macro Cards
  animateValue($('protein'), 0, proteinGrams);
  animateValue($('carb'), 0, carbGrams);
  animateValue($('fat'), 0, fatGrams);

  if ($('proteinPct')) $('proteinPct').textContent = `${pctP}%`;
  if ($('carbPct')) $('carbPct').textContent = `${pctC}%`;
  if ($('fatPct')) $('fatPct').textContent = `${pctF}%`;

  if ($('proteinCal')) $('proteinCal').textContent = fmt(kP);
  if ($('carbCal')) $('carbCal').textContent = fmt(kC);
  if ($('fatCal')) $('fatCal').textContent = fmt(kF);

  $('perKg').textContent = `(${perKg} ก./กก.น้ำหนักตัว)`;

  // Food Equivalents for Protein
  $('eggs').textContent = Math.round(proteinGrams / 6);
  $('chicken').textContent = fmt(proteinGrams / 0.31);
  $('tofu').textContent = fmt(proteinGrams / 0.08);

  // Thai meal equivalents (approximate protein per serving)
  const perMeal = proteinGrams / 3;
  $('perMeal').textContent = fmt(perMeal);
  const dishes = [
    { n: 'ข้าวมันไก่ 1 จาน', p: 25 },
    { n: 'ข้าวกะเพราไก่ไข่ดาว 1 จาน', p: 28 },
    { n: 'ต้มจืดเต้าหู้หมูสับ 1 ถ้วย', p: 12 },
    { n: 'ไข่ต้ม 2 ฟอง', p: 12 },
    { n: 'นมถั่วเหลืองไม่หวาน 1 กล่อง (250 มล.)', p: 8 },
    { n: 'ปลาทูทอด 1 ตัวกลาง + ข้าว', p: 20 }
  ];
  $('thaiMealList').innerHTML = dishes.map(d => {
    const share = Math.min(100, Math.round(d.p / perMeal * 100));
    return `<div class="thai-meal"><div class="thai-meal-top"><span>${d.n}</span><b>~${d.p} ก.</b></div><div class="thai-meal-bar"><i style="width:${share}%"></i></div><small>คิดเป็น ${Math.round(d.p / perMeal * 100)}% ของโปรตีนต่อมื้อ</small></div>`;
  }).join('');

  // Remember last inputs
  try { localStorage.setItem('nutricalc_last', JSON.stringify({ sex, age, h, w, act: $('act').value, goal })); } catch (e) {}

  // Save to History
  saveHistory({
    ts: Date.now(),
    date: new Date().toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    sex: sex === 'm' ? 'ชาย' : 'หญิง',
    age, h, w,
    bmi: bmi.toFixed(1),
    bmiLabel: band.t,
    target: Math.round(target)
  });

  // Close the on-screen keyboard on phones
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

  // Reveal Results & Smooth Scroll
  $('result').hidden = false;
  $('result').scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  });
}

// History Management
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('nutricalc_history') || '[]');
  } catch (e) {
    return [];
  }
}

function saveHistory(entry) {
  try {
    const list = getHistory();
    list.unshift(entry);
    const trimmed = list.slice(0, 30); // Keep last 30 records for the trend chart
    localStorage.setItem('nutricalc_history', JSON.stringify(trimmed));
    renderHistory();
  } catch (e) {}
}

function renderHistory() {
  const list = getHistory();
  const historySec = $('historySection');
  const historyList = $('historyList');
  if (!historySec || !historyList) return;

  if (list.length === 0) {
    historySec.style.display = 'none';
    return;
  }

  historySec.style.display = 'block';
  renderTrend(list);
  historyList.innerHTML = list.slice(0, 5).map(item => `
    <div class="history-item">
      <div>
        <strong>BMI: ${item.bmi} (${item.bmiLabel})</strong> — เป้าหมาย ${fmt(item.target)} kcal
        <div class="history-meta">${item.sex}, ${item.age} ปี, ${item.h} ซม., ${item.w} กก.</div>
      </div>
      <span class="history-meta">${item.date}</span>
    </div>
  `).join('');
}

// Weight Trend Chart (inline SVG, themed via CSS variables)
function renderTrend(list) {
  const box = $('trendChart');
  if (!box) return;
  const pts = list.filter(i => i.w).slice(0, 30).reverse();
  if (pts.length < 2) { box.hidden = true; return; }
  const W = 600, H = 180, P = { l: 40, r: 14, t: 14, b: 26 };
  const ws = pts.map(p => +p.w);
  const lo = Math.floor(Math.min(...ws) - 1), hi = Math.ceil(Math.max(...ws) + 1);
  const x = i => P.l + (W - P.l - P.r) * (i / (pts.length - 1));
  const y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(+p.w).toFixed(1)}`).join(' ');
  const dots = pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(+p.w).toFixed(1)}" r="4" fill="var(--accent)"></circle>`).join('');
  const diff = ws[ws.length - 1] - ws[0];
  const sign = diff > 0 ? '+' : '';
  box.innerHTML = `
    <div class="trend-head"><strong>น้ำหนักตามเวลา (${pts.length} ครั้งล่าสุด)</strong><span>${sign}${diff.toFixed(1)} กก. จากครั้งแรก</span></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟน้ำหนักตามเวลา">
      <line x1="${P.l}" y1="${y(lo)}" x2="${W - P.r}" y2="${y(lo)}" stroke="var(--border)"></line>
      <line x1="${P.l}" y1="${y(hi)}" x2="${W - P.r}" y2="${y(hi)}" stroke="var(--border)"></line>
      <text x="${P.l - 6}" y="${y(hi) + 4}" text-anchor="end" fill="var(--text-muted)" font-size="12">${hi}</text>
      <text x="${P.l - 6}" y="${y(lo) + 4}" text-anchor="end" fill="var(--text-muted)" font-size="12">${lo}</text>
      <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"></path>
      ${dots}
    </svg>`;
  box.hidden = false;
}

// Gender Segmented Buttons
$('btnSexM').addEventListener('click', () => {
  $('sex').value = 'm';
  $('btnSexM').classList.add('active');
  $('btnSexF').classList.remove('active');
});

$('btnSexF').addEventListener('click', () => {
  $('sex').value = 'f';
  $('btnSexF').classList.add('active');
  $('btnSexM').classList.remove('active');
});

// Goal Radio Cards
document.querySelectorAll('.goal-card').forEach(card => {
  card.addEventListener('click', () => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio) {
      radio.checked = true;
      document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      $('goal').value = radio.value;
    }
  });
});

document.querySelectorAll('input[name="goal_radio"]').forEach(radio => {
  radio.addEventListener('change', e => {
    document.querySelectorAll('.goal-card').forEach(card => card.classList.remove('active'));
    const parentCard = e.target.closest('.goal-card');
    if (parentCard) parentCard.classList.add('active');
    $('goal').value = e.target.value;
  });
});

// Theme Management (Light / Dark)
const themeToggle = $('themeToggle');
function initTheme() {
  const saved = localStorage.getItem('nutricalc_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nutricalc_theme', next);
  });
}
initTheme();

// Quick Sample Data Demo
const quickFillBtn = $('quickFillBtn');
if (quickFillBtn) {
  quickFillBtn.addEventListener('click', () => {
    $('age').value = 28;
    $('h').value = 172;
    $('w').value = 68;
    $('act').value = '1.55';
    $('goal_keep').checked = true;
    $('goal').value = 'keep';
    document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('active'));
    $('goal_keep').closest('.goal-card').classList.add('active');
    $('btnSexM').click();
    calc();
    showToast('ใส่ข้อมูลตัวอย่างแล้ว');
  });
}

// Copy Results Summary
const copyBtn = $('copyBtn');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const bmi = $('bmi').textContent;
    const bmiLabel = $('bmiLabel').textContent;
    const target = $('target').textContent;
    const bmr = $('bmr').textContent;
    const tdee = $('tdee').textContent;
    const protein = $('protein').textContent;
    const carb = $('carb').textContent;
    const fat = $('fat').textContent;
    const water = $('water').textContent;

    const summary = `ผลคำนวณ BMI และพลังงานต่อวัน
- ดัชนีมวลกาย (BMI): ${bmi} (${bmiLabel})
- พลังงานเป้าหมายต่อวัน: ${target} กิโลแคลอรี่
- BMR ตอนพัก: ${bmr} kcal | TDEE รวมกิจกรรม: ${tdee} kcal
- สารอาหารหลัก: โปรตีน ${protein}g | คาร์บ ${carb}g | ไขมัน ${fat}g
- น้ำดื่มที่แนะนำ: ${water} ลิตร/วัน

* ค่าทั้งหมดเป็นการประมาณเพื่อความรู้ทั่วไป ไม่ใช่คำแนะนำทางการแพทย์`;

    navigator.clipboard.writeText(summary).then(() => {
      showToast('คัดลอกผลแล้ว');
    }).catch(() => {
      showToast('คัดลอกไม่สำเร็จ ลองเลือกข้อความแล้วคัดลอกเอง');
    });
  });
}

// Print Report
const printBtn = $('printBtn');
if (printBtn) {
  printBtn.addEventListener('click', () => {
    window.print();
  });
}

// Clear History
const clearHistoryBtn = $('clearHistoryBtn');
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('nutricalc_history');
    renderHistory();
    showToast('ล้างประวัติแล้ว');
  });
}

// Attach Event Listeners
$('go').addEventListener('click', calc);
document.querySelectorAll('input').forEach(i => {
  i.addEventListener('keydown', e => {
    if (e.key === 'Enter') calc();
  });
});

// Render existing history on load
renderHistory();

// Restore last used inputs (runs after all listeners are attached)
(function restoreLast() {
  try {
    const d = JSON.parse(localStorage.getItem('nutricalc_last') || 'null');
    if (!d) return;
    if (d.age) $('age').value = d.age;
    if (d.h) $('h').value = d.h;
    if (d.w) $('w').value = d.w;
    if (d.act) $('act').value = d.act;
    $(d.sex === 'f' ? 'btnSexF' : 'btnSexM').click();
    const g = $('goal_' + d.goal);
    if (g) g.closest('.goal-card').click();
  } catch (e) {}
})();
