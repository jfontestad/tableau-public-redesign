'use strict';

const puppeteer = require('puppeteer');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {

  // Start puppeteer session
  const browser = await puppeteer.launch({ headless: false });
  //const browser = await puppeteer.launch({ headless: false });

  // Initialize postgres connection
  const { Client } = require('pg')
  const client = new Client({
    host: 'localhost',
    database: 'tableau_public',
    user: 'tableau',
    password: 'tp',
  })
  client.connect();

  // Iterate through list of tweets (meta data)
  const result = await client.query({
    rowMode: 'json',
    text: 'SELECT * from tweet WHERE valid_tableau_url = True AND image_download IS NULL LIMIT 100;'
  })

  const tweets = result.rows;

  for(var i = 0; i < tweets.length; i++) {
    let tweetUrlList = tweets[i].urls.length > 0 ? tweets[i].urls.split(";") : []
    console.log(tweets[i].id)

    for(var j = 0; j < tweetUrlList.length; j++) {
      var elementExists = false
      if(tweetUrlList[j].includes("public.tableau.com")) {
      
        var currPage = await browser.newPage();
        await currPage.goto(tweetUrlList[j], { timeout: 80000 });

        await currPage.waitFor(18000);

        if (await currPage.$('#viz_embedded_frame') !== null) {
          await screenshotDOMElement({
            path: 'twitter-screenshots/' + tweets[i].id + '.png',
            selector: '#viz_embedded_frame',
            padding: 0,
            page: currPage
          });
          elementExists = true
        }
        else if (await currPage.$('#dashboard-spacer') !== null) {
          await screenshotDOMElement({
            path: 'twitter-screenshots/' + tweets[i].id + '.png',
            selector: '#dashboard-spacer',
            padding: 0,
            page: currPage
          });
          elementExists = true
        } else if (await currPage.$('.tableauPlaceholder') !== null) {
          await currPage.waitFor(15000);

          await screenshotDOMElement({
            path: 'twitter-screenshots/' + tweets[i].id + '.png',
            selector: '.tableauPlaceholder',
            padding: 0,
            page: currPage
          });
          elementExists = true
        }

        if(elementExists) {
          client.query('UPDATE tweet SET image_download = True WHERE id=($1)', [tweets[i].id]);
        }
        
        await currPage.waitFor(getRandomInt(5000,14000));
        await currPage.close();
      }
    }
  }    
  
  console.log("done");


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

  //await page.goto('https://public.tableau.com/en-us/s/gallery/simpsons-family-tree', { timeout: 80000 });
  //await page.goto('https://public.tableau.com/en-us/s/gallery/gender-pay-gap-us-public-sector?gallery=votd', { timeout: 80000 });
  //await page.close();
  //await browser.close();
})();