'use strict';

const puppeteer = require('puppeteer');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {

  // Start puppeteer session
  const browser = await puppeteer.launch({ headless: true });
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
    //text: 'SELECT * from profile WHERE id = 130;'
    text: 'SELECT * from profile WHERE bio IS NULL ORDER BY id DESC LIMIT 300;'
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

    await currPage.waitFor(4000);

    var bio = "";
    var twitter = "";
    var facebook = "";
    var linkedin = "";

    try {
      bio = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorBio"]').innerHTML);
    } catch (err) {
      console.log("no bio");
    }

    try {
      twitter = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorSocialsocial-twitter"]').getAttribute("href"));
    } catch (err) {
      console.log("no twitter");
    }

    try {
      facebook = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorSocialsocial-facebook"]').getAttribute("href"));
    } catch (err) {
      console.log("no facebook");
    }

    try {
      linkedin = await currPage.evaluate(() => document.querySelector('[data-test-id="viewProfileAuthorSocialsocial-linkedin-negative"]').getAttribute("href"));
    } catch (err) {
      console.log("no linkedin");
    }

    console.log("ID: " + profiles[i].id)

    client.query('UPDATE profile SET bio=($1), twitter=($2), facebook=($3), linkedin=($4) WHERE id=($5)', 
      [bio, twitter, facebook, linkedin, profiles[i].id]);

    await currPage.waitFor(getRandomInt(5000,10000));
    await currPage.close();
  }

  console.log("done");

  await browser.close();
})();