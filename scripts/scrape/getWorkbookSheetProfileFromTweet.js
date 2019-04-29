'use strict';

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

  // Iterate through list of tweets (meta data)
  const result = await client.query({
    rowMode: 'json',
    //text: 'SELECT * from tweet WHERE id = 8646'
    text: 'SELECT * from tweet WHERE valid_tableau_url = True AND no_profile IS NULL AND sheet IS NULL AND (urls LIKE $1 OR urls LIKE $2) AND id > 12849',
    values: ['%public.tableau.com/views/%', '%public.tableau.com/sxhared/%']
  })

  const tweets = result.rows;

  for(var i = 0; i < tweets.length; i++) {
    let tweetUrlList = tweets[i].urls.length > 0 ? tweets[i].urls.split(";") : []
    console.log(tweets[i].id);

    for(var j = 0; j < tweetUrlList.length; j++) {
      if(tweetUrlList[j].includes("public.tableau.com")) {
        var currPage = await browser.newPage();
        await currPage.goto(tweetUrlList[j], { timeout: 80000 });

        await currPage.waitFor(1000);

        const workbookUrl = await currPage.evaluate(() => window.location.href)
        
        if(workbookUrl.includes("resource-not-found")) continue;

        if(workbookUrl.includes("public.tableau.com/profile/")) {
          let urlComponentsString = workbookUrl.split("public.tableau.com/profile/")[1];
          let urlComponents = urlComponentsString.split("/");

          let profileId = urlComponents[0];
          profileId = profileId.substring(0, profileId.length - 2);
          let workbookId = urlComponents[2];
          let sheetId = urlComponents[3];

          client.query('UPDATE tweet SET profile = $1, workbook = $2, sheet = $3 WHERE id=($4)', [profileId, workbookId, sheetId, tweets[i].id]);
        } else {

          await currPage.on('response', response => responseSuccess(response, tweets[i].id));

          await currPage.waitFor(25000);

          if(!workbookUrl.includes("/gallery/")) {

            if(workbookUrl.includes("/views/") && workbookUrl.includes("?:embed=")) {
              let tempWorkbookUrl = workbookUrl.split("?:embed=")[0].split("/");
              const sheetId = tempWorkbookUrl[tempWorkbookUrl.length - 1]; 
              console.log("extract sheet from url: " + sheetId);
              client.query('UPDATE tweet SET sheet = $1 WHERE id=($2)', [sheetId, tweets[i].id]);
            }

            await currPage.click('.tabToolbarButton.logo');
            await currPage.waitFor(2000);

            try {
              const redirectToUserProfileUrl = await currPage.$eval('.tab-toolbarAuthorByText', el => el.href);
              const workbookId = redirectToUserProfileUrl.split("workbook=")[1];
              const profileUrlResponse = await currPage.goto(redirectToUserProfileUrl);
              const profileUrl = await currPage.evaluate(() => window.location.href)
              var profileId = profileUrl.split("/profile/")[1];
              profileId = profileId.split("#")[0];

              client.query('UPDATE tweet SET profile = $1, workbook = $2 WHERE id=($3)', [profileId, workbookId, tweets[i].id]);
            } catch (err) {
              console.log("no profile");
              client.query('UPDATE tweet SET no_profile = True WHERE id=($1)', [tweets[i].id]);
            }
          }
        }
        
        await currPage.waitFor(getRandomInt(5000,8000));
        await currPage.close();
      }
    }
  }   
  
  console.log("done");


  async function responseSuccess(res, tweetId) {
    // Filter response to get only the vizql container
    if(res.url().indexOf("bootstrapSession") >= 0) {    
      const vizqlBootstrapUrl = res.url();
      console.log(vizqlBootstrapUrl);
      const vizqlBootstrapUrlPartsString = vizqlBootstrapUrl.split("/bootstrapSession")[0];
      const vizqlBootstrapUrlPartsArr = vizqlBootstrapUrlPartsString.split("/");
      const sheetId = vizqlBootstrapUrlPartsArr[vizqlBootstrapUrlPartsArr.length - 1];

      const workbookUrl = await currPage.evaluate(() => window.location.href);
      console.log(workbookUrl);

      if(workbookUrl.includes("/gallery/")) {
        const workbookId = vizqlBootstrapUrlPartsArr[vizqlBootstrapUrlPartsArr.length - 3];
        let profileUrl = await currPage.$eval('.field--author-link a', el => el.href);
        let profileUrlComponents = profileUrl.split("/profile/");
        const profileId = profileUrlComponents[1].split("#")[0];
        console.log(profileId);
        client.query('UPDATE tweet SET profile = $1, workbook = $2, sheet = $3 WHERE id=($4)', [profileId, workbookId, sheetId, tweets[i].id]);
      } else {
        client.query('UPDATE tweet SET sheet = $1 WHERE id=($2)', [sheetId, tweets[i].id]);
      }
    }
  }

  await browser.close();
})();