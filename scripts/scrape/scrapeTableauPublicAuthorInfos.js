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

  // Iterate through list of profiles (meta data)
  const result = await client.query({
    rowMode: 'json',
    text: 'SELECT * from profile WHERE avatar != TRUE OR avatar IS NULL ORDER BY id DESC LIMIT 100;'
  })

  const profiles = result.rows;

  for(var i = 0; i < profiles.length; i++) {

    var currPage = await browser.newPage();
    currPage.setViewport({ width: 1300, height: 1000 });

    await currPage.goto('https://public.tableau.com/profile/' + profiles[i].name, { timeout: 80000 });

    // Stop if page does not exist anymore
    await currPage.waitFor(1000);
    const profileUrl = await currPage.evaluate(() => window.location.href)
    
    if(profileUrl.includes("resource-not-found") || profileUrl.includes("resource-404")) { 
      await currPage.close();
      client.query({
        rowMode: 'json',
        text: 'UPDATE profile SET not_found = true WHERE id= $1',
        values: [profiles[i].id]
      });
      continue;
    }


    await currPage.waitFor(6000);

    // Check if profile image exists
    let profileImageExists = true;
    //let profileImageUrl = await currPage.evaluate(() => document.querySelector('[data-test-id="editProfileFromAvatarButton"] img').getAttribute("src"));
    //console.log(profileImageUrl);
    //if(!profileImageUrl.includes("gravatar")) {
    //profileImageExists = true;

    currPage.addStyleTag({
      content: ".author-avatar { border-radius: 0; max-width: 200px!important; width:200px; border:0; }"
    });

    await currPage.waitFor(1000);

    await screenshotDOMElement({
      path: 'images/profile/' + profiles[i].name + '.png',
      selector: '[data-test-id="editProfileFromAvatarButton"] img',
      padding: 0,
      page: currPage
    });

    var nOfVizzes = 0;
    var nOfFollowers = 0;
    var nOfFollowing = 0;
    var authorName = "";
    var location = "";
    var website = "";
    var organization = "";

    try {
      nOfVizzes = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthor-tab--workbooks-upper"] .count').textContent);
    } catch (err) {
      console.log("no workbooks");
    }

    try {
      nOfFollowers = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthor-tab--followers-upper"] .count').textContent);
    } catch (err) {
      console.log("no followers");
    }

    try {
      nOfFollowing = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthor-tab--following-upper"] .count').textContent);
    } catch (err) {
      console.log("no following");
    }

    try {
      authorName = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorName"]').textContent);
    } catch (err) {
      console.log("no author name");
    }

    try {
      location = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorLocation"]').textContent);
    } catch (err) {
      console.log("no location");
    }

    try {
      organization = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorOrganization"]').textContent);
    } catch (err) {
      console.log("no organization");
    }

    try {
      website = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorPersonalSite1"]').getAttribute("href"));
    } catch (err) {
      console.log("no website");
    }

    console.log("vizzes: " + nOfVizzes)
    console.log("followers: " + nOfFollowers)
    client.query('UPDATE profile SET vizzes=($1), followers=($2), following=($3), full_name=($4), location=($5), organization=($6), website=($7), avatar=($8) WHERE id=($9)', 
      [nOfVizzes, nOfFollowers, nOfFollowing, authorName, location, organization, website, profileImageExists, profiles[i].id]);

    await currPage.waitFor(getRandomInt(5000,15000));
    await currPage.close();
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

  await browser.close();
})();