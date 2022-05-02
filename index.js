
//adding Puppeteer library
// I was forced to use puppeteer-extra so I could avoid blocking from the side of the omio.com website
const puppeteerExtra = require('puppeteer-extra')

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteerExtra.use(StealthPlugin())

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteerExtra.use(AdblockerPlugin({ blockTrackers: true }))



const url = 'https://www.omio.com'
HEADLESS = true





function getJSScripstBeforeLCPOccurs(pageUrl) {
    puppeteerExtra.launch({ headless: HEADLESS }).then(async browser => {
        try {

            // ### Setup ###
            // Browser new page
            const page = await browser.newPage();
            const client = await page.target().createCDPSession();

            // Set viewpoint of browser for screenshots
            await page.setViewport({ width: 1500, height: 1500 });

            // Start tracing
            await page.tracing.start({ path: './tmpFiles/trace.json' });

            // Launch URL
            // await page.goto(pageUrl);
            await page.evaluateOnNewDocument(calcLCP);
            await page.goto(pageUrl, { timeout: 60000 });



            // ### Website automation ###
            // Accept GDPR cookies from the banner
            const [GdprButton] = await page.$x("//button[contains(@class, 'button-115Qm8 primary-8QTBqz')]");
            if (GdprButton) {
                await GdprButton.click();
            }

            // Fill in departure city
            const [departureField] = await page.$x("//input[@data-id='departurePosition']");
            if (departureField) {
                await departureField.click(); // The field has to be clicked first or it will eat the first letter typed
                await departureField.type("Prague, Czechia");
                await page.waitForTimeout(1500);
                await page.keyboard.press('Enter');
            }

            // Fill in arrival city
            const [arrivalField] = await page.$x("//input[@data-id='arrivalPosition']");
            if (arrivalField) {
                await arrivalField.click(); // The field has to be clicked first or it will eat the first letter typed
                await arrivalField.type("Rome, Italy");
                await page.waitForTimeout(1500);
                await page.keyboard.press('Enter');
            }

            // Disable accomodation button
            const [accomodationCheckbox] = await page.$x("//div[@class='react-toggle react-toggle--checked']/input[@id='checkbox']/parent::div");
            if (accomodationCheckbox) {
                await accomodationCheckbox.click()
            }

            // Click on the search button in a fancy way
            await page.evaluate(() => {
                let confirmButton = document.querySelector('.styles__button___1wi7t')
                if (confirmButton) {
                    return Promise.resolve(confirmButton.click())
                }
            })

            // Wait for the button to disappear to start listening to the lcp event 
            await page.waitForSelector(".JourneyDirection-mod__journeyDirection___egcj_")

            // Wait for the lcp event
            let lcp = await page.evaluate(() => {
                return window.largestContentfulPaint;
            });

            // Stop tracing once the LCP event is triggered
            await page.tracing.stop();

            // console.log("Lcp: " + lcp)

            //capture screenshot
            await page.screenshot({
                path: 'ps.png'
            });

            // const loadedJsFiles = await getAllJsFilesFromJson("tmpFiles/trace.json", deleteFileAfter = true);
            await getAllJsFilesFromJson("tmpFiles/trace.json", deleteFileAfter = true);

        } catch (error) {
            console.log(error);

        } finally {
            // Deinit
            browser.close()
        }
    });
}


async function getAllJsFilesFromJson(filename, deleteFileAfter = false) {
    const fs = require('fs');
     const javascriptFiles = await fs.readFile(filename, 'utf8', (err, data) => {

        if (err) {
            console.log(`Error reading file from disk: ${err}`);
        } else {

            // console.log(data);
            var javascriptFiles = data.match(/\b(?<![<>][\s]|\w)[\w-]*?\.js/g); // match all files ending with .js
            javascriptFiles = [...new Set(javascriptFiles)] // remove duplicates 

            // Delete the file
            if (deleteFileAfter) {
                fs.unlinkSync(filename);
            }

            console.log(javascriptFiles);


        };
        return javascriptFiles;

    });

}

function calcLCP() {
    window.largestContentfulPaint = 0;

    const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            observer.takeRecords();
            observer.disconnect();
            console.log('LCP:', window.largestContentfulPaint);
        }
    });
}

getJSScripstBeforeLCPOccurs(url);

