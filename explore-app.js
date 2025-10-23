const puppeteer = require('puppeteer');

async function exploreDebaterApp() {
  console.log('🚀 Starting Puppeteer exploration of Debater App...\n');

  const browser = await puppeteer.launch({
    headless: false, // Set to true to run without GUI
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Track console messages from the app
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Error:', msg.text());
    }
  });

  // Track failed requests
  page.on('requestfailed', request => {
    console.log('🔴 Failed Request:', request.url());
  });

  try {
    console.log('📱 Navigating to http://localhost:3000...\n');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Take screenshot of home page
    await page.screenshot({ path: 'screenshots/01-home.png', fullPage: true });
    console.log('📸 Screenshot: Home page saved\n');

    // Get page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}\n`);

    // Analyze page structure
    console.log('🔍 Analyzing page structure...\n');

    // Find all routes/navigation links
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map(link => ({
        text: link.innerText.trim(),
        href: link.getAttribute('href')
      })).filter(link => link.text);
    });

    console.log('🔗 Navigation Links Found:');
    navLinks.forEach(link => {
      console.log(`   - ${link.text} → ${link.href}`);
    });
    console.log('');

    // Find all buttons
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(btn => btn.innerText.trim()).filter(text => text);
    });

    console.log('🔘 Buttons Found:');
    buttons.forEach(btn => {
      console.log(`   - ${btn}`);
    });
    console.log('');

    // Check for Firebase connection messages
    const hasFirebaseMessages = await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('*')).map(el => el.textContent);
      return messages.some(msg => msg.includes('Firebase') || msg.includes('Emulator'));
    });

    if (hasFirebaseMessages) {
      console.log('✅ Firebase connection detected\n');
    }

    // Try to navigate to Browse page
    console.log('📍 Attempting to navigate to /browse...\n');
    const browseLink = navLinks.find(link => link.href.includes('/browse') || link.text.toLowerCase().includes('browse'));

    if (browseLink) {
      await page.click(`a[href="${browseLink.href}"]`);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/02-browse.png', fullPage: true });
      console.log('📸 Screenshot: Browse page saved\n');

      // Check for debates list
      const debatesFound = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.toLowerCase().includes('debate') || text.toLowerCase().includes('waiting');
      });

      if (debatesFound) {
        console.log('✅ Browse page loaded successfully\n');
      } else {
        console.log('⚠️  Browse page loaded but no debates visible\n');
      }
    }

    // Go back to home
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Try to navigate to Create page
    console.log('📍 Attempting to navigate to /create...\n');
    const createLink = navLinks.find(link => link.href.includes('/create') || link.text.toLowerCase().includes('create'));

    if (createLink) {
      await page.click(`a[href="${createLink.href}"]`);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/03-create.png', fullPage: true });
      console.log('📸 Screenshot: Create page saved\n');

      // Check for form elements
      const hasForm = await page.evaluate(() => {
        return document.querySelectorAll('input, textarea, select').length > 0;
      });

      if (hasForm) {
        console.log('✅ Create page with form elements found\n');
      }
    }

    // Check network activity
    console.log('🌐 Checking for active network requests...\n');
    await page.goto('http://localhost:3000');

    const requests = [];
    page.on('request', request => requests.push(request.url()));

    await page.waitForTimeout(3000);

    console.log('📊 Network Requests Made:');
    const uniqueRequests = [...new Set(requests)];
    uniqueRequests.slice(0, 10).forEach(url => {
      console.log(`   - ${url}`);
    });
    if (uniqueRequests.length > 10) {
      console.log(`   ... and ${uniqueRequests.length - 10} more`);
    }
    console.log('');

    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 EXPLORATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ App is running on http://localhost:3000`);
    console.log(`✅ Found ${navLinks.length} navigation links`);
    console.log(`✅ Found ${buttons.length} interactive buttons`);
    console.log(`✅ Screenshots saved in /screenshots/`);
    console.log(`✅ Network activity detected: ${uniqueRequests.length} unique requests`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏸️  Browser will stay open for 10 seconds for manual inspection...\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error during exploration:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
    console.log('📸 Error screenshot saved\n');
  } finally {
    await browser.close();
    console.log('👋 Puppeteer exploration complete!\n');
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the exploration
exploreDebaterApp().catch(console.error);
