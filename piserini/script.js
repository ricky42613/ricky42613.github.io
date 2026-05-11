const root = document.documentElement;
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#nav-links');
const themeToggle = document.querySelector('.theme-toggle');
const toast = document.querySelector('.toast');

const savedTheme = localStorage.getItem('pi-serini-theme');
if (savedTheme) {
  root.dataset.theme = savedTheme;
}

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

themeToggle?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('pi-serini-theme', next);
  drawCostAccuracyChart();
});

const heroSlideshow = document.querySelector('[data-hero-slideshow]');
if (heroSlideshow) {
  const slides = [...heroSlideshow.querySelectorAll('[data-hero-slide]')];
  const dots = [...heroSlideshow.querySelectorAll('[data-hero-slide-target]')];
  let heroSlideIndex = 0;

  function showHeroSlide(index) {
    heroSlideIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === heroSlideIndex;
      slide.classList.toggle('active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    dots.forEach((dot) => {
      const isActive = Number(dot.dataset.heroSlideTarget) === heroSlideIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-pressed', String(isActive));
    });
  }

  heroSlideshow.querySelectorAll('[data-hero-slide-step]').forEach((button) => {
    button.addEventListener('click', () => {
      showHeroSlide(heroSlideIndex + Number(button.dataset.heroSlideStep));
    });
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showHeroSlide(Number(dot.dataset.heroSlideTarget));
    });
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 1800);
}

document.querySelectorAll('[data-coming-soon]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Coming soon');
  });
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.querySelector(button.dataset.copy);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      showToast('BibTeX copied');
    } catch {
      showToast('Copy failed');
    }
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const tabs = document.querySelectorAll('.table-toolbar .tab');
const tableRows = document.querySelectorAll('#results-table tr');
const resultsTable = document.querySelector('#results-table');
const sortableHeaders = document.querySelectorAll('th[data-sort-index]');
let currentSort = { index: null, direction: 'asc' };

function parseSortValue(value) {
  const text = value.trim();
  if (text === '-' || text === '') return { missing: true, value: null };

  function parseNumberToken(token) {
    const match = token.trim().replace(/\$/g, '').replace(/,/g, '').replace(/%/g, '').match(/^(-?\d+(?:\.\d+)?)([kK])?$/);
    if (!match) return null;
    return Number(match[1]) * (match[2] ? 1000 : 1);
  }

  const rangeParts = text.split(/\s*-\s*/);
  if (rangeParts.length === 2) {
    const values = rangeParts.map(parseNumberToken);
    if (values.every((item) => item !== null)) {
      return { missing: false, value: (values[0] + values[1]) / 2 };
    }
  }

  const numberValue = parseNumberToken(text);
  if (numberValue !== null) {
    return { missing: false, value: numberValue };
  }

  return { missing: false, value: text.toLowerCase() };
}

function sortResultsTable(index, direction) {
  if (!resultsTable) return;
  const rows = [...resultsTable.querySelectorAll('tr')];
  const directionFactor = direction === 'asc' ? 1 : -1;

  rows.sort((a, b) => {
    const aParsed = parseSortValue(a.children[index]?.textContent ?? '');
    const bParsed = parseSortValue(b.children[index]?.textContent ?? '');
    if (aParsed.missing && bParsed.missing) return 0;
    if (aParsed.missing) return 1;
    if (bParsed.missing) return -1;
    if (typeof aParsed.value === 'number' && typeof bParsed.value === 'number') {
      return (aParsed.value - bParsed.value) * directionFactor;
    }
    return String(aParsed.value).localeCompare(String(bParsed.value), undefined, { numeric: true }) * directionFactor;
  });

  resultsTable.append(...rows);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const filter = tab.dataset.filter;
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    tableRows.forEach((row) => {
      row.classList.toggle('hidden', filter !== 'all' && row.dataset.kind !== filter);
    });
  });
});

sortableHeaders.forEach((header) => {
  header.addEventListener('click', () => {
    const index = Number(header.dataset.sortIndex);
    const direction = currentSort.index === index && currentSort.direction === 'asc' ? 'desc' : 'asc';
    currentSort = { index, direction };
    sortableHeaders.forEach((item) => item.setAttribute('aria-sort', item === header ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'));
    sortResultsTable(index, direction);
  });
});

const chartData = [
  { label: 'ds-flash', system: 'PI-SERINI DeepSeek Flash', group: 'PI-SERINI (DeepSeek)', cost: 28.92, accuracy: 68.07, shape: 'square', note: 'BM25' },
  { label: 'ds-pro', system: 'PI-SERINI DeepSeek Pro', group: 'PI-SERINI (DeepSeek)', cost: 55.08, accuracy: 71.43, shape: 'square', note: 'BM25' },
  { label: 'gpt-5', system: 'PI-SERINI GPT-5', group: 'PI-SERINI (OpenAI)', cost: 94.92, accuracy: 74.58, shape: 'square', note: 'BM25', dx: -8, dy: -18 },
  { label: 'gpt-5.2', system: 'PI-SERINI GPT-5.2', group: 'PI-SERINI (OpenAI)', cost: 122.22, accuracy: 70.48, shape: 'square', note: 'BM25' },
  { label: 'gpt-5.4', system: 'PI-SERINI GPT-5.4', group: 'PI-SERINI (OpenAI)', cost: 175.46, accuracy: 73.25, shape: 'square', note: 'BM25' },
  { label: 'gpt-5.5', system: 'PI-SERINI GPT-5.5', group: 'PI-SERINI (OpenAI)', cost: 291.55, accuracy: 83.13, shape: 'square', note: 'BM25' },
  { label: 'haiku-4.5', system: 'PI-SERINI Claude Haiku 4.5', group: 'PI-SERINI (Anthropic)', cost: 193.50, accuracy: 54.82, shape: 'square', note: 'BM25' },
  { label: 'opus-4.7', system: 'PI-SERINI Claude Opus 4.7', group: 'PI-SERINI (Anthropic)', cost: 246.57, accuracy: 69.76, shape: 'square', note: 'BM25', dx: -36, dy: 24 },
  { label: 'Chen et al. o3 + BM25', system: 'Chen et al. o3 + BM25', group: 'Prior work', cost: 836.35, accuracy: 50.84, shape: 'circle', note: 'prior retriever-tool system' },
  { label: 'Chen et al. o3 + Qwen3', system: 'Chen et al. o3 + Qwen3', group: 'Prior work', cost: 740.79, accuracy: 66.27, shape: 'circle', note: 'prior neural retriever comparison' },
  { label: 'Chen et al. GPT-5 + BM25', system: 'Chen et al. GPT-5 + BM25', group: 'Prior work', cost: 400.36, accuracy: 58.31, shape: 'circle', note: 'prior retriever-tool system' },
  { label: 'Chen et al. GPT-5 + Qwen3', system: 'Chen et al. GPT-5 + Qwen3', group: 'Prior work', cost: 360.71, accuracy: 73.01, shape: 'circle', note: 'prior neural retriever comparison' },
  { label: 'Chen et al. Gemini Pro + BM25', system: 'Chen et al. Gemini Pro + BM25', group: 'Prior work', cost: 138.64, accuracy: 19.04, shape: 'circle', note: 'prior retriever-tool system' },
  { label: 'Chen et al. Gemini Pro + Qwen3', system: 'Chen et al. Gemini Pro + Qwen3', group: 'Prior work', cost: 99.92, accuracy: 28.67, shape: 'circle', note: 'prior neural retriever comparison' },
  { label: 'Meng et al. GPT-5.2 + Qwen3', system: 'Meng et al. GPT-5.2 + Qwen3', group: 'Prior work', cost: 1000, accuracy: 45.10, shape: 'circle', note: 'assumed $1000 cost' },
  { label: 'DCI-lite Li et al.', system: 'DCI-lite Li et al.', group: 'Coding agent reference', cost: 93, accuracy: 62.90, shape: 'diamond', note: 'coding-agent reference point', dx: 6, dy: 16 },
  { label: 'Cao et al. Codex + BM25', system: 'Cao et al. Codex + BM25', group: 'Coding agent reference', cost: 687.24, accuracy: 78.50, shape: 'diamond', note: 'sampled file-system coding-agent eval' },
  { label: 'Cao et al. Codex CLI', system: 'Cao et al. Codex CLI', group: 'Coding agent reference', cost: 583.49, accuracy: 88.50, shape: 'diamond', note: 'sampled file-system coding-agent eval' },
  { label: 'DCI-CC Li et al.', system: 'DCI-CC Li et al.', group: 'Coding agent reference', cost: 1016, accuracy: 80.00, shape: 'diamond', note: 'coding-agent reference point', dx: 0, dy: -10 },
];

const colors = {
  'PI-SERINI (DeepSeek)': '#2563eb',
  'PI-SERINI (OpenAI)': '#10a37f',
  'PI-SERINI (Anthropic)': '#d97706',
  'Prior work': '#71717a',
  'Coding agent reference': '#a1a1aa',
};

let chartFilter = 'all';
let chartShowLabels = true;
let selectedChartLabel = 'gpt-5.5';
const frontierLabels = ['ds-flash', 'ds-pro', 'gpt-5', 'gpt-5.5'];

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawLegend() {
  const legend = document.querySelector('#scatter-legend');
  if (!legend) return;
  legend.innerHTML = Object.keys(colors).map((key) => `
    <button class="legend-item" type="button" data-chart-filter="${key}" aria-pressed="${chartFilter === 'all' || chartFilter === key}">
      <span class="legend-dot" style="--dot-color:${colors[key]}"></span>${key}
    </button>
  `).join('');

  legend.querySelectorAll('[data-chart-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      setChartFilter(button.dataset.chartFilter);
    });
  });
}

function setChartFilter(filter) {
  chartFilter = chartFilter === filter ? 'all' : filter;
  if (chartFilter === 'all') {
    selectedChartLabel = 'gpt-5.5';
  }
  document.querySelectorAll('[data-chart-filter]').forEach((button) => {
    button.classList.toggle('active', button.dataset.chartFilter === chartFilter || (chartFilter === 'all' && button.dataset.chartFilter === 'all'));
    button.setAttribute('aria-pressed', String(chartFilter === 'all' || button.dataset.chartFilter === chartFilter));
  });
  drawLegend();
  drawCostAccuracyChart();
}

function formatDollars(value) {
  return `$${value.toFixed(2)}`;
}

function getVisibleChartData() {
  return chartFilter === 'all' ? chartData : chartData.filter((d) => d.group === chartFilter);
}

function getFrontier(data) {
  let bestAccuracy = -Infinity;
  return [...data]
    .sort((a, b) => a.cost - b.cost)
    .filter((d) => {
      if (d.accuracy <= bestAccuracy) return false;
      bestAccuracy = d.accuracy;
      return true;
    });
}

function updateChartReadout(d) {
  const readout = document.querySelector('#chart-readout');
  if (!readout || !d) return;
  const bestAccuracy = d.accuracy === Math.max(...chartData.map((item) => item.accuracy));
  const costRank = [...chartData].sort((a, b) => a.cost - b.cost).findIndex((item) => item.label === d.label) + 1;
  readout.innerHTML = `
    <strong>${d.system}</strong>
    <span>${d.accuracy.toFixed(2)}% accuracy at ${formatDollars(d.cost)}. ${d.note}. ${bestAccuracy ? 'Highest accuracy point in this comparison.' : `Cost rank ${costRank} of ${chartData.length}.`}</span>
  `;
}

function positionTooltip(svg, tooltip, d, x, y, width, height) {
  const svgBox = svg.getBoundingClientRect();
  const left = (x(d.cost) / width) * svgBox.width;
  const top = (y(d.accuracy) / height) * svgBox.height;
  tooltip.style.left = `${Math.max(116, Math.min(svgBox.width - 116, left))}px`;
  tooltip.style.top = `${Math.max(72, top)}px`;
}

function showChartTooltip(svg, d, x, y, width, height) {
  const tooltip = document.querySelector('#chart-tooltip');
  if (!tooltip) return;
  tooltip.innerHTML = `
    <strong>${d.system}</strong>
    <span>${d.accuracy.toFixed(2)}% accuracy · ${formatDollars(d.cost)} · ${d.group}</span>
  `;
  positionTooltip(svg, tooltip, d, x, y, width, height);
  tooltip.classList.add('visible');
}

function hideChartTooltip() {
  document.querySelector('#chart-tooltip')?.classList.remove('visible');
}

function drawCostAccuracyChart() {
  const svg = document.querySelector('#cost-accuracy-chart');
  if (!svg) return;

  const width = svg.clientWidth || 960;
  const height = 480;
  const margin = { top: 34, right: 28, bottom: 60, left: 62 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const minCost = 20;
  const maxCost = 1600;
  const minAcc = 0;
  const maxAcc = 100;

  const logMin = Math.log10(minCost);
  const logMax = Math.log10(maxCost);
  const x = (cost) => margin.left + ((Math.log10(cost) - logMin) / (logMax - logMin)) * innerW;
  const y = (acc) => margin.top + (1 - (acc - minAcc) / (maxAcc - minAcc)) * innerH;
  const gridCosts = [25, 50, 100, 200, 400, 800, 1600];
  const minorGridCosts = [75, 133.33, 166.67, 250, 300, 350, 466.67, 533.33, 600, 666.67, 733.33, 850, 900, 950, 1080, 1160, 1240, 1320, 1400, 1480, 1560];
  const gridAccs = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const visibleData = getVisibleChartData();
  if (!visibleData.some((d) => d.label === selectedChartLabel) && visibleData[0]) {
    selectedChartLabel = visibleData[0].label;
  }

  const lines = [];
  minorGridCosts.forEach((c) => {
    const xx = x(c);
    lines.push(`<line class="chart-grid minor" x1="${xx}" y1="${margin.top}" x2="${xx}" y2="${height - margin.bottom}" />`);
  });
  gridCosts.forEach((c) => {
    const xx = x(c);
    lines.push(`<line class="chart-grid" x1="${xx}" y1="${margin.top}" x2="${xx}" y2="${height - margin.bottom}" />`);
    lines.push(`<text class="chart-text" x="${xx}" y="${height - margin.bottom + 24}" text-anchor="middle">$${c}</text>`);
  });
  gridAccs.forEach((a) => {
    const yy = y(a);
    lines.push(`<line class="chart-grid" x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}" />`);
    lines.push(`<text class="chart-text" x="${margin.left - 14}" y="${yy + 4}" text-anchor="end">${a}%</text>`);
  });

  const frontier = frontierLabels
    .map((label) => chartData.find((d) => d.label === label))
    .filter((d) => d && (chartFilter === 'all' || d.group === chartFilter));
  const frontierPath = frontier.length > 1
    ? `<path class="chart-frontier" d="${frontier.map((d, index) => `${index === 0 ? 'M' : 'L'} ${x(d.cost)} ${y(d.accuracy)}`).join(' ')}" />`
    : '';
  const frontierRings = frontier.map((d) => `<circle class="chart-frontier-ring" cx="${x(d.cost)}" cy="${y(d.accuracy)}" r="12" />`).join('');
  const frontierLabel = frontier.length > 1
    ? `<text class="chart-frontier-label" x="${x(frontier[frontier.length - 1].cost) - 92}" y="${y(frontier[frontier.length - 1].accuracy) - 16}">Pareto frontier</text>`
    : '';

  const points = chartData.map((d) => {
    const xx = x(d.cost);
    const yy = y(d.accuracy);
    const color = colors[d.group];
    const size = d.shape === 'diamond' ? 14 : 12;
    const marker = d.shape === 'circle'
      ? `<circle class="chart-marker" cx="${xx}" cy="${yy}" r="6" fill="${color}" opacity="0.94" />`
      : d.shape === 'diamond'
        ? `<rect class="chart-marker" x="${xx - size / 2}" y="${yy - size / 2}" width="${size}" height="${size}" fill="${color}" opacity="0.94" transform="rotate(45 ${xx} ${yy})" />`
        : `<rect class="chart-marker" x="${xx - size / 2}" y="${yy - size / 2}" width="${size}" height="${size}" fill="${color}" opacity="0.94" />`;
    const dx = d.dx ?? 10;
    const dy = d.dy ?? (d.group === 'Prior work' ? -10 : 18);
    const labelClass = d.group === 'Prior work' || d.group === 'Coding agent reference' ? 'chart-label secondary' : 'chart-label';
    const isVisible = chartFilter === 'all' || d.group === chartFilter;
    const isActive = d.label === selectedChartLabel;
    return `
      <g class="chart-point${isVisible ? '' : ' dimmed'}${isActive ? ' active' : ''}" tabindex="0" data-label="${d.label}" aria-label="${d.label}: ${d.accuracy}% accuracy, ${d.cost} dollars cost">
        ${marker}
        ${chartShowLabels && isVisible ? `<text class="${labelClass}" x="${xx + dx}" y="${yy + dy}">${d.label}</text>` : ''}
      </g>
    `;
  }).join('');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="transparent" />
    ${lines.join('')}
    <line class="chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" />
    <line class="chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" />
    ${frontierPath}
    ${frontierRings}
    ${frontierLabel}
    ${points}
    <text class="chart-text" x="${width / 2}" y="${height - 14}" text-anchor="middle">Cost in USD</text>
    <text class="chart-text" transform="translate(18 ${height / 2}) rotate(-90)" text-anchor="middle">Answer accuracy</text>
  `;

  svg.querySelectorAll('.chart-point').forEach((point) => {
    const d = chartData.find((item) => item.label === point.dataset.label);
    if (!d) return;
    point.addEventListener('pointerenter', () => showChartTooltip(svg, d, x, y, width, height));
    point.addEventListener('pointerleave', hideChartTooltip);
    point.addEventListener('focus', () => showChartTooltip(svg, d, x, y, width, height));
    point.addEventListener('blur', hideChartTooltip);
    point.addEventListener('click', () => {
      selectedChartLabel = d.label;
      updateChartReadout(d);
      drawCostAccuracyChart();
    });
  });

  updateChartReadout(chartData.find((d) => d.label === selectedChartLabel) || visibleData[0]);
}

window.addEventListener('resize', drawCostAccuracyChart);
document.querySelectorAll('[data-chart-filter]').forEach((button) => {
  button.addEventListener('click', () => setChartFilter(button.dataset.chartFilter));
});
drawLegend();
drawCostAccuracyChart();
