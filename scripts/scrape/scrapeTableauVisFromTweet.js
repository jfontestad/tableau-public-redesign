'use strict';

const d3 = require("d3");
const puppeteer = require('puppeteer');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {

  // Start puppeteer session
  const browser = await puppeteer.launch({ headless: false });

  // Initialize postgres connection
  const { Client } = require('pg')
  const client = new Client({
    host: 'localhost',
    database: 'tableau_public',
    user: 'tableau',
    password: 'tp',
  })
  client.connect();

  // Iterate through list of vizzes (meta data)
  const result = await client.query({
    rowMode: 'json',
    text: 'SELECT id, profile, workbook, sheet from tweet WHERE sheet IS NOT NULL AND profile IS NOT NULL AND not_found IS NULL ORDER BY id DESC;'
  })

  const vizzes = result.rows;

  for(var i = 0; i < vizzes.length; i++) {
    const resultExists = await client.query({
      rowMode: 'json',
      text: 'select count(*) from visualization where workbook = $1',
      values: [vizzes[i].workbook]
    });

    if(resultExists.rows[0].count > 0) {
      console.log("Exist: " + resultExists.rows[0].count);
      continue;
    }

    var currPage = await browser.newPage();
    currPage.setViewport({ width: 1300, height: 1000 });

    client.query('INSERT INTO profile (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [vizzes[i].profile]);

    await currPage.goto('https://public.tableau.com/profile/' + vizzes[i].profile + '#!/vizhome/' + vizzes[i].workbook + '/' + vizzes[i].sheet, { timeout: 80000 });
    await currPage.on('response', response => responseSuccess(response, vizzes[i]));

    // Stop if page does not exist anymore
    await currPage.waitFor(2000);
    const workbookUrl = await currPage.evaluate(() => window.location.href)
    console.log(workbookUrl);
    if(workbookUrl.includes("resource-not-found") || workbookUrl.includes("resource-404")) { 
      await currPage.close();
      client.query({
        text: 'UPDATE tweet SET not_found = True WHERE id= $1',
        values: [vizzes[i].id]
      });
      continue;
    }

    let title = "";
    let description = "";
    let views = 0;
    let sheetsJsonString = "";
    let originallyPublished = "";
    let lastSaved = null;

    await currPage.waitFor(8000);


    // Title
    try {
      title = await currPage.evaluate(() => document.querySelector('[data-test-id="vizhome-workbookTitle-header"]').textContent);
    } catch (err) {
      console.log("no title");
    }
    
    // Description
    try {
      description = await currPage.evaluate(() => document.querySelector('[data-test-id="vizhome-workbookDescription"]').textContent);
    } catch (err) {
      console.log("no description");
    }
    
    // Number of views
    let viewsLabel = await currPage.evaluate(() => document.querySelector('[ng-bind="workbookDetailsModel.viewCount | translateNumber"]').textContent);
    views = parseInt(viewsLabel.replace(/,/g, ""));

    // Sheets
    try {
      const sheetsData = await currPage.evaluate(() => {
        const sheets = Array.from(document.querySelectorAll('[data-test-id="vizhome-metadata-sheetTitles"] a'))
        return sheets.map(sheet => ({ "url": sheet.getAttribute("ng-href").split("/").pop(), "title": sheet.textContent }))
      });
      sheetsJsonString = JSON.stringify(sheetsData);
    } catch (err) {
      console.log("no sheets");
    }

    // Originally published (permalink)
    try {
      originallyPublished = await currPage.evaluate(() => document.querySelector('[data-test-id="vizhome-permalink-link"]').getAttribute("href"));
    } catch (err) {
      console.log("no permalink");
    }

    // Last saved date
    try {
      let lastSavedString = await currPage.evaluate(() => document.querySelector('[ng-bind="workbook.lastPublishDate | translateDate"]').textContent);
      const parseDate = d3.timeParse("%b %d, %Y");
      lastSaved = parseDate(lastSavedString);
    } catch (err) {
      console.log("no date");
    }

    client.query('INSERT INTO visualization (workbook, sheet, profile, title, description, views, sheets, originally_published, last_saved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id', 
      [vizzes[i].workbook, vizzes[i].sheet, vizzes[i].profile, title, description, views, sheetsJsonString, originallyPublished, lastSaved], 
      function(err, result){
        if (err) {
          console.log(err);
        } else {
          takeScreenshot(result.rows[0].id);
        }
      });

    await currPage.waitFor(getRandomInt(8000,12000));
    await currPage.close();
  }

  async function takeScreenshot(visId) {
    await currPage.waitFor(10000);

     await screenshotDOMElement({
      path: 'vis-images/' + visId + '.png',
      selector: '#viz_embedded_frame',
      padding: 0,
      page: currPage
    });
  }

  async function responseSuccess(res, vis) {
    // Filter response to get only the vizql container
    if(res.url().indexOf("bootstrapSession") >= 0) {    
      let data = await res.text();

      // Replace long image codes with placeholders
      data = data.replace(/\"image\"\: \"[^"]+\"/g, '"image": "genericImagePlaceholder"');

      // Replace long datastore code with placeholder
      data = data.replace(/\"runtimeFinalDatastore\"\: \"[^"]+\"/g, '"runtimeFinalDatastore": "runtimeFinalDatastorePlaceholder"');
      
      // Replace image directory (huge nested image map object) with placeholder
      data = data.replace(/\"imageDictionary\"\:\{\"imageMap\"\:\{\"[^]+\"\}\}\,\"colorDictionary\"/, '"imageDictionary": "genericImageDictionaryPlaceholder", "colorDictionary"');

      // Repair json object by removing some ID and semicolon at the beginning and another ID + semicolon in the middle
      data = data.substring(data.indexOf(";") + 1);

      // After removing the ID in the middle we have two separate JSON objects, therefore we add a separator element and split them into an array
      const separator = "@$!sep!$@"
      data = data.replace(/\}[0-9]+;{/, '}' + separator + '{');
      data = data.split(separator);

      // Create final vizql object
      const vizql = {
        data: JSON.parse(data[0]),
        secondaryInfo: JSON.parse(data[1])
      }

      // Update database
      const vizqlString = JSON.stringify(vizql);
      const workbookId = vis["workbook"];
      const sheetId = vis["sheet"];
      client.query('INSERT INTO visualization_detail (workbook, sheet, vizql) VALUES ($1, $2, $3)', 
        [workbookId, sheetId, vizqlString]);
      
      console.log('ID:\n', vis["workbook"]);
      console.log('\n');
    }
  }


  /**
   * Takes a screenshot of a DOM element on the page, with optional padding.
   *
   * @param {!{path:string, selector:string, padding:(number|undefined)}=} opts
   * @return {!Promise<!Buffer>}
   */

  async function screenshotDOMElement(opts = {}) {
    const padding = 'padding' in opts ? opts.padding : 0;
    const path = 'path' in opts ? opts.path : null;
    const selector = opts.selector;

    if (!selector)
      throw Error('Please provide a selector.');

    const rect = await opts.page.evaluate(selector => {
      const element = document.querySelector(selector);
      if (!element)
          return null;
      const {x, y, width, height} = element.getBoundingClientRect();
      return {left: x, top: y, width, height, id: element.id};
    }, selector);

    if (!rect)
        throw Error(`Could not find element that matches selector: ${selector}.`);

    return await opts.page.screenshot({
      path,
      clip: {
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2 - 27
      }
    });
  }

  await browser.close();
})();