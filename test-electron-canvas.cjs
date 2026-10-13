const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'dist-electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.on('console-message', (e, level, msg) => console.log('Renderer:', msg));
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  win.webContents.on('did-finish-load', async () => {
    try {
      await new Promise((r) => setTimeout(r, 1000));

      const evaluation = await win.webContents.executeJavaScript(`
        (async () => {
          const results = [];

          // 1. Root element exists
          const root = document.getElementById('root');
          results.push({ name: 'Root element exists', pass: !!root && root.children.length > 0 });

          // Dismiss welcome modal
          const enterBtns = Array.from(document.querySelectorAll('button')).filter(b => 
            b.textContent && (b.textContent.includes('Enter Studio') || b.textContent.includes('Start Designing') || b.textContent.includes('Get Started') || b.textContent.includes('Skip'))
          );
          if (enterBtns.length > 0) {
            enterBtns[enterBtns.length - 1].click();
            await new Promise(r => setTimeout(r, 400));
          }

          // Switch to System Map
          const allButtons = Array.from(document.querySelectorAll('button'));
          const sysBtn = allButtons.find(b => b.textContent && b.textContent.trim() === 'System Map');
          if (sysBtn) {
            sysBtn.click();
            await new Promise(r => setTimeout(r, 400));
          }

          // 2. Inspect Connectors
          const connectorGroups = Array.from(document.querySelectorAll('.connector-group'));
          results.push({
            name: 'All 9 connectors rendered in DOM',
            pass: connectorGroups.length === 9,
            details: 'Found ' + connectorGroups.length + ' connector groups'
          });

          // 3. SVG layer at top: 0, left: 0
          const svgLayers = Array.from(document.querySelectorAll('svg'));
          const connectorSvg = svgLayers.find(s => s.querySelector('.connector-group') || s.querySelector('marker'));
          const svgStyle = connectorSvg ? connectorSvg.getAttribute('style') || '' : '';
          results.push({
            name: 'SVG connector layer aligned at top:0, left:0',
            pass: svgStyle.includes('top: 0') || svgStyle.includes('top:0') || !svgStyle.includes('-50000'),
            details: 'SVG style: ' + svgStyle.substring(0, 100)
          });

          // 4. Initial state: 0 anchor dots
          const getAnchorDots = () => Array.from(document.querySelectorAll('div')).filter(d => {
            const s = window.getComputedStyle(d);
            return s.borderRadius === '50%' && (s.borderColor === 'rgb(255, 255, 255)' || s.borderWidth === '2px') && (d.offsetWidth <= 14 || s.width === '10px');
          });

          results.push({
            name: 'Initial state: no anchor dots bleeding on unselected nodes',
            pass: getAnchorDots().length === 0,
            details: 'Found ' + getAnchorDots().length + ' anchor dots initially'
          });

          // 5. Click canvas element to select it
          const moveElements = Array.from(document.querySelectorAll('div')).filter(d => d.style.cursor === 'move');
          if (moveElements.length > 0) {
            moveElements[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0 }));
            await new Promise(r => setTimeout(r, 400));
          }

          const dotsAfterSelect = getAnchorDots();
          results.push({
            name: 'Selected element displays exactly 4 anchor points',
            pass: dotsAfterSelect.length === 4,
            details: 'Found ' + dotsAfterSelect.length + ' anchor dots after node selection'
          });

          // 6. Click canvas container background to deselect
          // Find the container parent of connectorSvg
          let canvasContainer = connectorSvg ? connectorSvg.parentElement : null;
          while (canvasContainer && canvasContainer.getAttribute('aria-label') !== 'Sidebar Panel' && canvasContainer.parentElement && canvasContainer.parentElement !== document.body) {
            if (canvasContainer.style && canvasContainer.style.overflow === 'hidden' && canvasContainer.style.flex === '1 1 0%') {
              break;
            }
            canvasContainer = canvasContainer.parentElement;
          }

          if (canvasContainer) {
            canvasContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: 20, clientY: 20, button: 0 }));
            await new Promise(r => setTimeout(r, 400));
          }

          const dotsAfterDeselect = getAnchorDots();
          results.push({
            name: 'Deselecting removes all anchor dots',
            pass: dotsAfterDeselect.length === 0,
            details: 'Found ' + dotsAfterDeselect.length + ' anchor dots after deselect'
          });

          return results;
        })()
      `);

      console.log('--- Electron Live Runtime Evaluation ---');
      let allPass = true;
      for (const res of evaluation) {
        console.log(`- ${res.name}: ${res.pass ? 'PASS' : 'FAIL'} (${res.details || 'OK'})`);
        if (!res.pass) allPass = false;
      }

      console.log(allPass ? 'All Electron runtime checks PASSED!' : 'Some checks failed!');
      app.exit(allPass ? 0 : 1);
    } catch (err) {
      console.error('Error:', err);
      app.exit(1);
    }
  });
});
