'use strict';

const d3 = require("d3");
const puppeteer = require('puppeteer');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {

  // Start puppeteer session
  const browser = await puppeteer.launch({ headless: true });

  // Initialize postgres connection
  const { Client } = require('pg')
  const client = new Client({
    host: 'localhost',
    database: 'tableau_public',
    user: 'tableau',
    password: 'tp',
  })
  client.connect();

  // Iterate through list of vizzes (given dataset)
  const result = await client.query({
    rowMode: 'json',
    text: 'SELECT id, profile_name, url, vizql, description, caption FROM viz WHERE vizql IS NOT NULL AND transformed IS NULL ORDER BY random() LIMIT 50;'
    //text: 'SELECT id, profile_name, url, vizql, description, caption FROM viz WHERE id = 4865;'
  })

  const vizzes = result.rows;  
  console.log('items: ' + vizzes.length);

  for(var i = 0; i < vizzes.length; i++) {

    var currPage = await browser.newPage();
    currPage.setViewport({ width: 1300, height: 1000 });

    await currPage.goto('https://' + vizzes[i].url.replace(/\s/g, ''), { timeout: 80000 });

    // Stop if page does not exist anymore
    await currPage.waitFor(2000);
    const workbookUrl = await currPage.evaluate(() => window.location.href)
    
    if(workbookUrl.includes("resource-not-found") || workbookUrl.includes("resource-404")) { 
      await currPage.close();
      client.query({
        rowMode: 'json',
        text: 'UPDATE viz SET not_found = true WHERE id= $1',
        values: [vizzes[i].id]
      });
      continue;
    }

    if(!workbookUrl.includes("/profile/") || !workbookUrl.includes("/vizhome/")) {
      await currPage.close();
      continue;
    }

    // Get workbook and sheet ID
    let workbookUrlArr = workbookUrl.split("/");
    let workbookId = workbookUrlArr[workbookUrlArr.length - 2];
    let sheetId = workbookUrlArr[workbookUrlArr.length - 1];

    console.log(workbookId);

    const resultExists = await client.query({
      rowMode: 'json',
      text: 'select count(*) from visualization where workbook = $1',
      values: [workbookId]
    });

    if(resultExists.rows[0].count > 0) {
      console.log("Exist: " + resultExists.rows[0].count);
      continue;
    }


    client.query('INSERT INTO profile (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [vizzes[i].profile_name]);

    let title = "";
    let description = vizzes[i].description;
    let caption = vizzes[i].caption;
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

    client.query('INSERT INTO visualization (workbook, sheet, profile, title, description, views, sheets, originally_published, last_saved, caption, vizql) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id', 
      [workbookId, sheetId, vizzes[i].profile_name, title, description, views, sheetsJsonString, originallyPublished, lastSaved, caption, vizzes[i].vizql], 
      function(err, result){
        if (err) {
          console.log(err);
        } else {
          takeScreenshot(result.rows[0].id);
          client.query({
            rowMode: 'json',
            text: 'UPDATE viz SET transformed = true WHERE id= $1',
            values: [vizzes[i].id]
          });
        }
      });

    await currPage.waitFor(getRandomInt(8000,16000));
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