const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'dist-electron/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const rendererErrors = [];
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 3 || message.includes('Error') || message.includes('error')) {
      if (!message.includes('Autofill') && !message.includes('DevTools')) {
        rendererErrors.push({ level, message, line, sourceId });
      }
    }
    console.log(`[RENDERER ${level}] ${message}`);
  });

  await win.loadFile(path.join(__dirname, 'dist/index.html'));
  await new Promise((r) => setTimeout(r, 1200));

  const testResults = await win.webContents.executeJavaScript(`
    (async () => {
      const results = {
        steps: [],
        errors: [],
      };

      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      const getRootStatus = () => {
        const root = document.getElementById('root');
        return {
          hasRoot: !!root,
          children: root ? root.children.length : 0,
          isBlackScreen: !root || root.children.length === 0,
          previewText: root ? root.textContent.slice(0, 100) : '',
        };
      };

      // Step 1: Verify Initial Render
      const initStatus = getRootStatus();
      results.steps.push({ name: 'Initial Render', status: !initStatus.isBlackScreen ? 'PASS' : 'FAIL', details: initStatus });

      // Step 2: Open Examples Tab in Navigation Rail
      const railButtons = Array.from(document.querySelectorAll('button'));
      const exampleTab = railButtons.find((b) => b.title?.toLowerCase().includes('example'));
      exampleTab?.click();
      await delay(600);

      // Step 3: Load Logic Flowchart (KYC Verification) from Examples Gallery
      const cards = Array.from(document.querySelectorAll('h4')).filter((h) => h.textContent.includes('KYC'));
      if (cards.length > 0) {
        const card = cards[0].closest('div[style*="border"]');
        const openBtn = Array.from(card.querySelectorAll('button')).find((b) => b.textContent.includes('Open & Edit'));
        openBtn?.click();
      }
      await delay(1200);

      const kycStatus = getRootStatus();
      results.steps.push({
        name: 'Load KYC Flowchart Example',
        status: !kycStatus.isBlackScreen ? 'PASS' : 'FAIL',
        details: kycStatus,
      });

      // Step 4: Switch to Website Wireframe via Board Dropdown
      const boardMenuTrigger = document.querySelector('button[data-testid="board-switcher-trigger"]');
      boardMenuTrigger?.click();
      await delay(400);

      const webDropdownBtn = document.querySelector('button[data-board-id*="web"]');
      webDropdownBtn?.click();
      await delay(800);

      const webStatus = getRootStatus();
      results.steps.push({
        name: 'Switch to Website Wireframe via Dropdown',
        status: !webStatus.isBlackScreen ? 'PASS' : 'FAIL',
        details: webStatus,
      });

      // Step 5: Switch back to Logic Flowchart via Top Board Dropdown
      const boardMenuTrigger2 = document.querySelector('button[data-testid="board-switcher-trigger"]');
      boardMenuTrigger2?.click();
      await delay(400);

      const flowchartDropdownBtn = document.querySelector('button[data-board-id*="flow"]');
      flowchartDropdownBtn?.click();
      await delay(800);

      const flowchartStatus = getRootStatus();
      results.steps.push({
        name: 'Switch to Logic Flowchart via Dropdown',
        status: !flowchartStatus.isBlackScreen ? 'PASS' : 'FAIL',
        details: flowchartStatus,
      });

      // Step 6: Switch via Sidebar Project Boards list
      const boardsTab = railButtons.find((b) => b.title?.toLowerCase().includes('board') || b.textContent?.includes('Board'));
      boardsTab?.click();
      await delay(500);

      // Click Website board in sidebar
      const sidebarWebCard = document.querySelector('div[data-board-id*="web"]');
      sidebarWebCard?.click();
      await delay(700);

      // Click Flowchart board in sidebar
      const sidebarFlowCard = document.querySelector('div[data-board-id*="flow"]');
      sidebarFlowCard?.click();
      await delay(800);

      const sidebarSwitchStatus = getRootStatus();
      results.steps.push({
        name: 'Switch to Logic Flowchart via Sidebar Boards List',
        status: !sidebarSwitchStatus.isBlackScreen ? 'PASS' : 'FAIL',
        details: sidebarSwitchStatus,
      });

      // Step 6b: Verify Flowchart Node Text Sizing & No Text Overflow
      const findBoxByText = (text) => {
        const allSpans = Array.from(document.querySelectorAll('span, div'));
        const span = allSpans.find((el) => el.textContent === text && !el.closest('aside') && !el.closest('header'));
        return span?.closest('div[style*="border"]') || span?.closest('div[style*="position: relative"]');
      };

      const retryBox = findBoxByText('Request Supplementary Proof');
      const retryNoOverflow = retryBox ? retryBox.scrollHeight <= retryBox.clientHeight : false;
      const diamondBox = findBoxByText('ID Valid?');
      const diamondNoOverflow = diamondBox ? diamondBox.scrollHeight <= diamondBox.clientHeight : false;
      const ovalBox = findBoxByText('Awaiting Resubmission');
      const ovalNoOverflow = ovalBox ? ovalBox.scrollHeight <= ovalBox.clientHeight : false;

      results.steps.push({
        name: 'Flowchart Node Text Sizing & No Overflow',
        status: retryNoOverflow && diamondNoOverflow && ovalNoOverflow ? 'PASS' : 'FAIL',
        details: {
          retryFitted: retryNoOverflow,
          diamondFitted: diamondNoOverflow,
          ovalFitted: ovalNoOverflow,
        },
      });

      // Step 7: Enter Simulation mode on Flowchart via toolbar button
      const simulateBtn = document.querySelector('button[data-testid="toolbar-simulate-btn"]');
      simulateBtn?.click();
      await delay(800);

      const simStatus = getRootStatus();
      const simController = document.querySelector('[data-testid="simulation-controller-bar"]') || document.querySelector('[data-testid="simulation-empty-state-bar"]');
      results.steps.push({
        name: 'Launch Simulation on Flowchart',
        status: !simStatus.isBlackScreen && !!simController ? 'PASS' : 'FAIL',
        details: { ...simStatus, hasSimController: !!simController },
      });

      // Step 8: Exit Simulation mode
      const exitSimBtn = document.querySelector('button[data-testid="toolbar-simulate-btn"]');
      exitSimBtn?.click();
      await delay(500);

      // Step 9: Switch to Mobile App via sidebar and launch Prototype Preview
      const boardsTab2 = document.querySelector('button[data-testid="rail-tab-boards"]');
      boardsTab2?.click();
      await delay(400);

      const sidebarMobCard = document.querySelector('div[data-testid*="board-item-board-mobile"]') || document.querySelector('div[data-board-id*="mob"]');
      console.log('Step 9: sidebarMobCard found:', !!sidebarMobCard);
      sidebarMobCard?.click();
      await delay(800);

      const previewBtn = document.querySelector('button[data-testid="toolbar-preview-btn"]');
      console.log('Step 9: previewBtn found:', !!previewBtn);
      previewBtn?.click();
      await delay(1000);

      const protoStatus = getRootStatus();
      const protoPreviewChassis = document.querySelector('[aria-label="Interactive Prototype Simulation Preview"]') || document.querySelector('[role="region"]');
      results.steps.push({
        name: 'Mobile App Prototype Preview',
        status: !protoStatus.isBlackScreen && !!protoPreviewChassis ? 'PASS' : 'FAIL',
        details: { ...protoStatus, hasProtoChassis: !!protoPreviewChassis },
      });

      // Exit Prototype Preview
      const closeProtoBtn = document.querySelector('button[data-testid="toolbar-preview-btn"]');
      closeProtoBtn?.click();
      await delay(500);

      return results;
    })()
  `);

  console.log('\n=== Automated Test Results ===');
  testResults.steps.forEach((s) => {
    console.log(`[${s.status}] ${s.name}:`, JSON.stringify(s.details));
  });

  const allPassed = testResults.steps.every((s) => s.status === 'PASS');
  console.log(`\nOverall Test Status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log(`Renderer Errors Count: ${rendererErrors.length}`);

  if (rendererErrors.length > 0) {
    console.error('Renderer Errors:', rendererErrors);
  }

  await new Promise((r) => setTimeout(r, 800));
  app.quit();
  process.exit(allPassed && rendererErrors.length === 0 ? 0 : 1);
});
