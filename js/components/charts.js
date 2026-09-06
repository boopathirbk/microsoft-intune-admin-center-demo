/* ============================================================
   Charts — Canvas-based donut, bar, and line charts
   Supports Fluent 2 dark & light themes seamlessly
   ============================================================ */

function getChartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    textPrimary: isDark ? '#FFFFFF' : '#323130',
    textSecondary: isDark ? '#ADADAD' : '#605E5C',
    gridLine: isDark ? '#333333' : '#EDEBE9',
    emptyRing: isDark ? '#2B2B2B' : '#E1E1E1',
    pointDot: isDark ? '#1E1E1E' : '#FFFFFF',
  };
}

export class DonutChart {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = config.width || 200;
    this.height = config.height || 200;
    this.outerRadius = config.outerRadius || 90;
    this.innerRadius = config.innerRadius || 55;
    this.segments = config.segments || [];
    this.centerText = config.centerText || '';
    this.centerSubtext = config.centerSubtext || '';

    canvas.width = this.width;
    canvas.height = this.height;
    canvas.setAttribute('role', 'img');
  }

  draw() {
    const { ctx, width, height, outerRadius, innerRadius, segments } = this;
    const theme = getChartTheme();
    const cx = width / 2, cy = height / 2;
    const total = segments.reduce((sum, s) => sum + s.value, 0);

    ctx.clearRect(0, 0, width, height);

    if (total === 0) {
      // Empty state — draw ring
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerRadius, Math.PI * 2, 0, true);
      ctx.closePath();
      ctx.fillStyle = theme.emptyRing;
      ctx.fill();
    } else {
      let startAngle = -Math.PI / 2;
      for (const seg of segments) {
        if (seg.value === 0) continue;
        const sliceAngle = (seg.value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        startAngle += sliceAngle;
      }
    }

    // Center text
    if (this.centerText) {
      ctx.fillStyle = theme.textPrimary;
      ctx.font = 'bold 28px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.centerText, cx, cy - (this.centerSubtext ? 8 : 0));
    }

    if (this.centerSubtext) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '12px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.centerSubtext, cx, cy + 14);
    }
  }

  static renderLegend(container, segments) {
    container.innerHTML = '';
    for (const seg of segments) {
      container.innerHTML += `
        <div class="chart-legend__item">
          <span class="chart-legend__color" style="background:${seg.color}"></span>
          <span class="chart-legend__label">${seg.label}</span>
          <span class="chart-legend__value">${seg.value}</span>
        </div>
      `;
    }
  }
}

export class BarChart {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = config.width || 500;
    this.height = config.height || 250;
    this.data = config.data || []; // [{label, value, color}]
    this.title = config.title || '';
    this.padding = config.padding || { top: 30, right: 20, bottom: 40, left: 50 };

    canvas.width = this.width;
    canvas.height = this.height;
    canvas.setAttribute('role', 'img');
  }

  draw() {
    const { ctx, width, height, data, padding } = this;
    const theme = getChartTheme();
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.min(chartW / data.length * 0.6, 50);
    const gap = (chartW - barWidth * data.length) / (data.length + 1);

    // Title
    if (this.title) {
      ctx.fillStyle = theme.textPrimary;
      ctx.font = '600 14px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.title, padding.left, 18);
    }

    // Y-axis gridlines
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, padding.left - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = padding.left + gap + (barWidth + gap) * i;
      const barH = (d.value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Bar
      ctx.fillStyle = d.color || '#0078D4';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // X-axis label
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 16);

      // Value on top
      ctx.fillStyle = theme.textPrimary;
      ctx.font = '600 11px Segoe UI, sans-serif';
      ctx.fillText(d.value, x + barWidth / 2, y - 6);
    });
  }
}

export class LineChart {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = config.width || 500;
    this.height = config.height || 200;
    this.data = config.data || []; // [{label, value}]
    this.title = config.title || '';
    this.color = config.color || '#0078D4';
    this.fillBelow = config.fillBelow !== false;
    this.padding = config.padding || { top: 30, right: 20, bottom: 40, left: 50 };

    canvas.width = this.width;
    canvas.height = this.height;
    canvas.setAttribute('role', 'img');
  }

  draw() {
    const { ctx, width, height, data, padding, color } = this;
    const theme = getChartTheme();
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const stepX = chartW / (data.length - 1);

    // Title
    if (this.title) {
      ctx.fillStyle = theme.textPrimary;
      ctx.font = '600 14px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.title, padding.left, 18);
    }

    // Gridlines
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, padding.left - 8, y + 4);
    }

    // Build points
    const points = data.map((d, i) => ({
      x: padding.left + stepX * i,
      y: padding.top + chartH - (d.value / maxVal) * chartH,
    }));

    // Fill area
    if (this.fillBelow) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = color + '20';
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = theme.pointDot;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X-axis labels
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      if (data.length <= 10 || i % Math.ceil(data.length / 8) === 0) {
        ctx.fillText(d.label, padding.left + stepX * i, height - padding.bottom + 16);
      }
    });
  }
}
