import { jsPDF } from 'jspdf';

const MEAL_LABELS = {
  EARLY_MORNING: 'Early Morning', BREAKFAST: 'Breakfast', MID_MORNING: 'Mid Morning',
  LUNCH: 'Lunch', EVENING_SNACK: 'Evening Snack', DINNER: 'Dinner', BEDTIME: 'Bedtime',
};

const MEAL_TIMES = {
  EARLY_MORNING: '6:00 AM', BREAKFAST: '8:00 AM', MID_MORNING: '11:00 AM',
  LUNCH: '1:00 PM', EVENING_SNACK: '5:00 PM', DINNER: '8:00 PM', BEDTIME: '10:00 PM',
};

const BLUE   = [37, 99, 235];
const GREEN  = [34, 197, 94];
const AMBER  = [245, 158, 11];
const RED    = [239, 68, 68];
const PURPLE = [139, 92, 246];
const LBG    = [248, 250, 252];
const BORDER = [226, 232, 240];
const TMAIN  = [15, 23, 42];
const TGRAY  = [71, 85, 105];
const TMUTED = [148, 163, 184];
const WHITE  = [255, 255, 255];

function getMealColor(mealType) {
  return { EARLY_MORNING:[251,146,60], BREAKFAST:[37,99,235], MID_MORNING:[34,197,94], LUNCH:[245,158,11], EVENING_SNACK:[139,92,246], DINNER:[99,102,241], BEDTIME:[71,85,105] }[mealType] || BLUE;
}

export function generateMealPlanPDF(plan, clientName = 'Client', dietitianName = 'Your Dietitian') {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW   = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
  let y      = 0;
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  const checkPage = (needed = 20) => {
    if (y + needed > PH - 16) { doc.addPage(); y = 16; }
  };

  // ── HEADER ──────────────────────────────────────────────────────
  doc.setFillColor(...BLUE);  doc.rect(0, 0, PW, 42, 'F');
  doc.setFillColor(29,78,216); doc.rect(0, 38, PW, 4, 'F');

  doc.setFillColor(...WHITE); doc.circle(ML+10, 18, 8, 'F');
  doc.setFontSize(12); doc.setTextColor(...BLUE); doc.setFont('helvetica','bold');
  doc.text('N', ML+7.2, 21.5);

  doc.setFontSize(20); doc.setTextColor(...WHITE);
  doc.text('Nutrivya', ML+22, 17);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.setTextColor(219,234,254);
  doc.text('Personalised Nutrition Planning', ML+22, 24);
  doc.setFontSize(8);
  doc.text(today, PW-MR, 14, { align:'right' });
  y = 50;

  // ── PLAN TITLE CARD ─────────────────────────────────────────────
  doc.setFillColor(...LBG); doc.roundedRect(ML, y, CW, 30, 3, 3, 'F');
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.roundedRect(ML, y, CW, 30, 3, 3, 'S');
  doc.setFillColor(...BLUE); doc.roundedRect(ML, y, 4, 30, 2, 2, 'F');

  doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...TMAIN);
  doc.text(plan.planName || 'Diet Plan', ML+10, y+11);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...TGRAY);
  doc.text(`Prepared for: ${clientName}`, ML+10, y+19);
  doc.text(`By: ${dietitianName}`, ML+10, y+26);
  if (plan.planDate) {
    const pd = new Date(plan.planDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
    doc.setFontSize(8); doc.setTextColor(...TMUTED);
    doc.text(`Plan Date: ${pd}`, ML+CW-4, y+11, { align:'right' });
  }
  y += 38;

  // ── MACROS SUMMARY ROW ──────────────────────────────────────────
  const totCal = plan.totalCalories||0, totPro = plan.totalProtein||0;
  const totCarb= plan.totalCarbs||0,   totFat = plan.totalFat||0, totFib=plan.totalFiber||0;
  const macros = [
    { label:'Calories', value:`${Math.round(totCal)}`, unit:'kcal', color:BLUE   },
    { label:'Protein',  value:`${totPro.toFixed(1)}`,  unit:'g',    color:GREEN  },
    { label:'Carbs',    value:`${totCarb.toFixed(1)}`, unit:'g',    color:AMBER  },
    { label:'Fat',      value:`${totFat.toFixed(1)}`,  unit:'g',    color:RED    },
    { label:'Fiber',    value:`${totFib.toFixed(1)}`,  unit:'g',    color:PURPLE },
  ];
  const mW = CW / macros.length;
  doc.setFillColor(...LBG); doc.roundedRect(ML, y, CW, 24, 3, 3, 'F');
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.roundedRect(ML, y, CW, 24, 3, 3, 'S');
  macros.forEach((m, i) => {
    const mx = ML + i*mW + mW/2;
    doc.setFillColor(...m.color); doc.rect(ML+i*mW+2, y+1, mW-4, 2.5, 'F');
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...m.color);
    doc.text(m.value, mx, y+13, { align:'center' });
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(...TMUTED);
    doc.text(m.unit, mx, y+17.5, { align:'center' });
    doc.setTextColor(...TGRAY);
    doc.text(m.label, mx, y+22, { align:'center' });
    if (i < macros.length-1) {
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
      doc.line(ML+(i+1)*mW, y+5, ML+(i+1)*mW, y+20);
    }
  });
  y += 32;

  // ── MEALS HEADING ────────────────────────────────────────────────
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
  doc.text('DAILY MEAL PLAN', ML, y);
  doc.setDrawColor(...BLUE); doc.setLineWidth(0.5); doc.line(ML, y+2, ML+CW, y+2);
  y += 9;

  // ── MEALS ────────────────────────────────────────────────────────
  (plan.meals || []).forEach(meal => {
    const mLabel  = (MEAL_LABELS[meal.mealType] || meal.mealName || meal.mealType) + (MEAL_TIMES[meal.mealType] ? ` (${MEAL_TIMES[meal.mealType]})` : '');
    const mColor  = getMealColor(meal.mealType);
    const items   = meal.foodItems || [];
    const cardH   = 12 + items.length * 7 + 8;
    checkPage(cardH + 8);

    // Card
    doc.setFillColor(...WHITE); doc.roundedRect(ML, y, CW, cardH, 2, 2, 'F');
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.25); doc.roundedRect(ML, y, CW, cardH, 2, 2, 'S');

    // Header strip
    doc.setFillColor(...mColor); doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
    doc.rect(ML, y+6, CW, 4, 'F');
    doc.setFontSize(9.5); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
    doc.text(mLabel, ML+5, y+7);
    doc.setFontSize(8.5); doc.setFont('helvetica','normal');
    doc.text(`${Math.round(meal.totalCalories||0)} kcal`, ML+CW-5, y+7, { align:'right' });
    y += 13;

    // Column headers
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...TMUTED);
    doc.text('Food Item', ML+5, y);
    doc.text('Qty',      ML+82,     y, { align:'right' });
    doc.text('Cal',      ML+106,    y, { align:'right' });
    doc.text('Protein',  ML+128,    y, { align:'right' });
    doc.text('Carbs',    ML+150,    y, { align:'right' });
    doc.text('Fat',      ML+CW-2,   y, { align:'right' });
    y += 2;
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.15);
    doc.line(ML+4, y, ML+CW-4, y);
    y += 3;

    items.forEach((fi, idx) => {
      doc.setFillColor(...(idx%2===0 ? LBG : WHITE));
      doc.rect(ML+1, y-1.5, CW-2, 6.5, 'F');

      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...TMAIN);
      const name = (fi.foodName||'—').length > 36 ? (fi.foodName||'—').substring(0,34)+'…' : (fi.foodName||'—');
      doc.text(name, ML+5, y+3);

      doc.setTextColor(...TGRAY);
      doc.text(`${fi.quantity||0}${fi.quantityUnit||'g'}`, ML+82, y+3, { align:'right' });

      doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
      doc.text(`${Math.round(fi.calories||0)}`, ML+106, y+3, { align:'right' });

      doc.setFont('helvetica','normal'); doc.setTextColor(34,197,94);
      doc.text(`${(fi.protein||0).toFixed(1)}g`, ML+128, y+3, { align:'right' });

      doc.setTextColor(245,158,11);
      doc.text(`${(fi.carbohydrates||0).toFixed(1)}g`, ML+150, y+3, { align:'right' });

      doc.setTextColor(239,68,68);
      doc.text(`${(fi.fat||0).toFixed(1)}g`, ML+CW-2, y+3, { align:'right' });
      y += 7;
    });

    // Subtotal row
    doc.setFillColor(241,245,249); doc.rect(ML+1, y-1, CW-2, 6, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...TGRAY);
    doc.text('Meal Total', ML+5, y+3);
    doc.setTextColor(...BLUE); doc.text(`${Math.round(meal.totalCalories||0)}`, ML+106, y+3, { align:'right' });
    doc.setTextColor(34,197,94); doc.text(`${(meal.totalProtein||0).toFixed(1)}g`, ML+128, y+3, { align:'right' });
    doc.setTextColor(245,158,11); doc.text(`${(meal.totalCarbs||0).toFixed(1)}g`, ML+150, y+3, { align:'right' });
    doc.setTextColor(239,68,68); doc.text(`${(meal.totalFat||0).toFixed(1)}g`, ML+CW-2, y+3, { align:'right' });
    y += 11;
  });

  // ── GRAND TOTAL BAR ──────────────────────────────────────────────
  checkPage(22);
  doc.setFillColor(...BLUE); doc.roundedRect(ML, y, CW, 18, 3, 3, 'F');
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
  doc.text('DAILY TOTAL', ML+5, y+7);
  doc.setFontSize(11);
  doc.text(`${Math.round(totCal)} kcal`, ML+106, y+7, { align:'right' });
  doc.setFontSize(8.5); doc.setTextColor(219,234,254);
  doc.text(`P: ${totPro.toFixed(1)}g`, ML+128, y+7, { align:'right' });
  doc.text(`C: ${totCarb.toFixed(1)}g`, ML+150, y+7, { align:'right' });
  doc.text(`F: ${totFat.toFixed(1)}g`, ML+CW-2, y+7, { align:'right' });
  doc.setFontSize(7.5); doc.setTextColor(191,219,254);
  doc.text('Follow meal timings as advised by your dietitian', ML+5, y+14);
  doc.text(`Fiber: ${totFib.toFixed(1)}g`, ML+CW-2, y+14, { align:'right' });
  y += 26;

  // ── GUIDELINES ──────────────────────────────────────────────────
  checkPage(36);
  doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(...TGRAY);
  doc.text('GENERAL GUIDELINES', ML, y);
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.line(ML, y+1.5, ML+CW, y+1.5);
  y += 6;
  const tips = [
    'Drink at least 8-10 glasses of water throughout the day.',
    'Eat meals at regular timings and avoid skipping any meal.',
    'Chew food slowly and mindfully — it greatly aids digestion.',
    'Avoid processed foods, packaged snacks, and sugary drinks.',
    'Track your meals in the Nutrivya app after eating each meal.',
    'If you have any concerns about your diet, contact your dietitian.',
  ];
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...TGRAY);
  tips.forEach(tip => {
    checkPage(7);
    doc.setFillColor(239,246,255); doc.roundedRect(ML, y-1, CW, 6.5, 1, 1, 'F');
    doc.setTextColor(...BLUE); doc.text('•', ML+3, y+3.5);
    doc.setTextColor(...TGRAY); doc.text(tip, ML+8, y+3.5);
    y += 8;
  });

  // ── FOOTER ALL PAGES ────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...LBG); doc.rect(0, PH-12, PW, 12, 'F');
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.line(0, PH-12, PW, PH-12);
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(...TMUTED);
    doc.text(`Generated by Nutrivya  •  ${dietitianName}  •  ${today}`, ML, PH-5);
    doc.text(`Page ${i} of ${pages}`, PW-MR, PH-5, { align:'right' });
  }

  const safe = (s) => (s||'').replace(/[^a-zA-Z0-9]/g,'_');
  doc.save(`${safe(clientName)}_${safe(plan.planName||'MealPlan')}.pdf`);
}
