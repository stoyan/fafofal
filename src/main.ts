import * as opentype from 'opentype.js';

declare global {
  interface CSSStyleDeclaration {
    ascentOverride?: string;
  }
}

declare global {
  var Module: {decompress: (arg0: ArrayBuffer) => Iterable<number>};
}

interface FontMeta {
  'ascent-override'?: number;
  'descent-override'?: number;
  'line-gap-override'?: number;
}

interface State {
  fontMeta: FontMeta;
  fontSrc: string;
  localSrc: string;
  sizeAdjust: number;
}

const state: State = {
  fontMeta: {},
  fontSrc: '',
  localSrc: '',
  sizeAdjust: 0,
};

function renderResults() {
  const yeygo = state.fontSrc && state.localSrc;
  if (!yeygo) {
    return;
  }

  if ('text' in window) {
    (document.querySelector('.webfont') as HTMLDivElement).innerHTML =
      window.text as string;
    (document.querySelector('.fallback') as HTMLDivElement).innerHTML =
      window.text as string;
  }

  const resarea = document.getElementById('resultsarea') as HTMLDivElement;
  resarea.style.display = 'block';
  setFontFaces();

  // setting @font-face src:url() and measuring immediatelly is too quick for the browser
  // to update and gives a stale width result
  // rAF was no help
  // setTimeout 0 was no help
  setTimeout(async () => {
    state.sizeAdjust = measureSizeAdjust();
    updateCSSResult();
    await adjustFallbackAscent();
    updateCSSResult();

    const el = document.getElementById('ascent-tweak') as HTMLInputElement;
    el.placeholder = el.value =
      formatNumber(state.fontMeta['ascent-override'] ?? 0) ?? '';
  }, 100);
}

function absPercent(v: number): number {
  return 100 * Math.abs(v);
}

function formatNumber(n: number): string {
  return '' + Math.round(n * 100) / 100;
}

async function processFile(file: File) {
  try {
    let fileBuff = await file.arrayBuffer();
    if (file.name.endsWith('woff2')) {
      fileBuff = Uint8Array.from(Module.decompress(fileBuff)).buffer;
    }
    const font = opentype.parse(fileBuff);
    state.fontMeta['ascent-override'] = absPercent(
      font.ascender / font.unitsPerEm,
    );
    state.fontMeta['descent-override'] = absPercent(
      font.descender / font.unitsPerEm,
    );
    state.fontMeta['line-gap-override'] = absPercent(
      font.tables?.hhea.lineGap / font.unitsPerEm,
    );

    state.fontSrc = URL.createObjectURL(file);

    const selected = document.querySelector('#selected');
    if (selected) {
      const metaString: string = JSON.stringify(state.fontMeta, null, 2);
      selected.innerHTML = `Selected: ${file.name}, extracted meta info:<br><code>${metaString}</code>`;
    }

    renderResults();
  } catch (error) {
    console.error('Error processing font:', error);
  }
}

function setFontFaces() {
  const webfontStyle = document.getElementById('webfontff') as HTMLStyleElement;
  const fallbackStyle = document.getElementById(
    'fallbackff',
  ) as HTMLStyleElement;

  webfontStyle.textContent = `
    @font-face {
      font-family: webfont;
      src: url("${state.fontSrc}");
    }
  `;

  fallbackStyle.textContent = `
    @font-face {
      font-family: fallback;
      src: local("${state.localSrc}");
    }
  `;
}

function measureSizeAdjust(): number {
  const ret =
    (100 *
      (
        document.querySelector('.webfont') as HTMLElement
      ).getBoundingClientRect().width) /
    (document.querySelector('.fallback') as HTMLElement).getBoundingClientRect()
      .width;
  return ret;
}

async function adjustFallbackAscent() {
  const webfontDiv = document.querySelector('.webfont') as HTMLDivElement;
  const fallbackDiv = document.querySelector('.fallback') as HTMLDivElement;

  let ascentOverride = state.fontMeta['ascent-override'] ?? 100;
  const step = 0.1;
  let maxIterations = 2000;

  function getHeight(element: HTMLDivElement) {
    return element.getBoundingClientRect().height;
  }

  while (maxIterations-- > 0) {
    const webfontHeight = getHeight(webfontDiv);
    const fallbackHeight = getHeight(fallbackDiv);
    if (webfontHeight === fallbackHeight) {
      console.log(`Matching ascent-override found: ${ascentOverride}%`);
      state.fontMeta['ascent-override'] = ascentOverride;
      break;
    }
    ascentOverride += webfontHeight > fallbackHeight ? step : -step;
    const style = (document.styleSheets[1].cssRules[0] as CSSStyleRule).style;
    if ('ascentOverride' in style) {
      // Chrome
      style.ascentOverride = ascentOverride + '%';
    }
    // todo: figure out Firefox

    if (maxIterations % 300) {
      // a bit of drama aka animation
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  if (maxIterations <= 0) {
    console.error('Failed to match heights within the iteration limit.');
  }
}

interface ResultCSS {
  'font-family': string;
  src?: string;
  'ascent-override'?: string;
  'descent-override'?: string;
  'line-gap-override'?: string;
  'size-adjust'?: string;
  [key: string]: string | number | undefined;
}

function getCSSResult(): ResultCSS {
  const res: ResultCSS = {
    'font-family': 'fallback',
    /*
    'src': 'local("Arial")',
    'ascent-override': '84%',
    'descent-override': '19.4%',
    'line-gap-override': '0%',
    'size-adjust': '107.957%',
    */
  };
  res.src = `local("${state.localSrc}")`;
  Object.entries(state.fontMeta).forEach(([key, value]) => {
    res[key] = formatNumber(value) + '%';
  });
  res['size-adjust'] = formatNumber(state.sizeAdjust) + '%';
  return res;
}

function updateCSSResult() {
  const css = getCSSResult();
  let cssString = '@font-face {\n';
  Object.entries(css).forEach(([key, value]) => {
    cssString += `  ${key}: ${value};\n`;
  });
  cssString += '}';
  (document.getElementById('result-css') as HTMLPreElement).textContent =
    cssString;

  const styleEl = document.querySelector('#fallbackff') as HTMLStyleElement;
  styleEl.textContent = cssString;
}

const fileInput = document.getElementById('upload') as HTMLInputElement;
fileInput.addEventListener('change', async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    processFile(file);
  }
});

document.body.addEventListener('dragover', (event) => {
  event.preventDefault();
  document.body.classList.add('dragover');
});

document.body.addEventListener('dragleave', () => {
  document.body.classList.remove('dragover');
});

document.body.addEventListener('drop', async (event) => {
  event.preventDefault();
  document.body.classList.remove('dragover');
  const dataTransfer = event.dataTransfer as DataTransfer;
  const files = dataTransfer.files;
  if (files.length) {
    processFile(files[0]);
  }
});

addEventListener('DOMContentLoaded', () => {
  // populate font names
  const loco = `
    Charter, 'Bitstream Charter', 'Sitka Text', Cambria, 
    'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052,
    Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans',
    Avenir, Montserrat, Corbel, 'URW Gothic',
    Optima, Candara, 'Noto Sans',
    Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial,
    'Nimbus Mono PS', 'Courier New',
    'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono',
    Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow',
    'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, Manjari, 'Arial Rounded MT', 'Arial Rounded MT Bold', Calibri,
    Rockwell, 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small',
    Superclarendon, 'Bookman Old Style', 'URW Bookman', 'URW Bookman L', 'Georgia Pro', Georgia,
    Didot, 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', P052, Sylfaen,
    'Segoe Print', 'Bradley Hand', Chilanka, TSCu_Comic
    `
    .replace(/'/g, '')
    .split(',')
    .map((e) => e.trim());
  const html = Array.from(new Set(loco))
    .sort()
    .map((e) => `<option value="${e}"></option>`)
    .join('');
  (document.getElementById('fairly-locals') as HTMLElement).innerHTML = html;

  // copy the test text
  (document.getElementById('test-fallback') as HTMLElement).innerHTML = (
    document.getElementById('test-webfont') as HTMLElement
  ).innerHTML;
});

document.getElementById('allright')?.addEventListener('click', () => {
  window.scrollTo({
    left: document.body.scrollWidth,
    behavior: 'smooth',
  });
});
document.getElementById('allleft')?.addEventListener('click', () => {
  window.scrollTo({
    left: 0,
    behavior: 'smooth',
  });
});

document.getElementById('bold')?.addEventListener('click', ({target}) => {
  handleArea51Style(target as HTMLElement, 'bold');
});
document.getElementById('italic')?.addEventListener('click', ({target}) => {
  handleArea51Style(target as HTMLElement, 'italic');
});

function handleArea51Style(button: HTMLElement, what: 'bold' | 'italic') {
  button.classList.toggle('active');
  const prop = what === 'bold' ? 'fontWeight' : 'fontStyle';
  (document.getElementById('area51') as HTMLElement).style[prop] =
    button.classList.contains('active') ? what : 'normal';
}

document.getElementById('src')?.addEventListener('change', (e: Event) => {
  const inp = e.target as HTMLInputElement;
  if (!inp.value) {
    return;
  }
  state.localSrc = inp.value;
  renderResults();
});

document
  .getElementById('ascent-tweak')
  ?.addEventListener('input', ({target}) => {
    if (
      typeof state.fontMeta['ascent-override'] === 'number' &&
      typeof state.fontMeta['descent-override'] === 'number'
    ) {
      const newValue = Number((target as HTMLInputElement).value);
      const delta = state.fontMeta['ascent-override'] - newValue;
      state.fontMeta['ascent-override'] = newValue;
      state.fontMeta['descent-override'] =
        state.fontMeta['descent-override'] + delta;
      updateCSSResult();
    }
  });

document.getElementById('overlap')?.addEventListener('click', () => {
  const ele = document.querySelector('#test-fallback div') as HTMLDivElement;
  if (ele.style.color === 'red') {
    ele.style.cssText = 'visibility: visible';
    return;
  }
  const rect = (
    document.querySelector('#test-webfont div') as HTMLDivElement
  ).getBoundingClientRect();
  ele.style.position = 'absolute';
  ele.style.width = rect.width + 'px';
  ele.style.left = rect.x + 'px';
  ele.style.color = 'red';
});

document.getElementById('layoutshift')?.addEventListener('click', () => {
  const real = (document.querySelector('#test-webfont div') as HTMLDivElement)
    .style;
  const fallback = (
    document.querySelector('#test-fallback div') as HTMLDivElement
  ).style;

  if (fallback.color !== 'red') {
    document.getElementById('overlap')?.click();
  }

  if (fallback.visibility === 'visible' && real.visibility === 'visible') {
    real.visibility = 'hidden';
    fallback.visibility = 'hidden';
    return;
  }

  if (fallback.visibility === 'hidden' && real.visibility === 'hidden') {
    fallback.visibility = 'visible';
    return;
  }

  if (fallback.visibility === 'visible') {
    real.visibility = 'visible';
    fallback.visibility = 'hidden';
    return;
  }

  if (real.visibility === 'visible') {
    real.visibility = 'hidden';
    fallback.visibility = 'hidden';
    return;
  }
});
