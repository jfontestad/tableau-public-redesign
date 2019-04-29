'use strict';

(async () => {

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
    text: 'SELECT * from tweet WHERE valid_tableau_url = True AND profile IS NULL AND urls LIKE $1',
    values: ['%public.tableau.com/profile/%']
  })

  const tweets = result.rows;

  for(var i = 0; i < tweets.length; i++) {
    let tweetUrlList = tweets[i].urls.length > 0 ? tweets[i].urls.split(";") : []

    for(var j = 0; j < tweetUrlList.length; j++) {
      if(tweetUrlList[j].includes("public.tableau.com/profile/")) {
        let urlComponentsString = tweetUrlList[j].split("public.tableau.com/profile/")[1];
        let urlComponents = urlComponentsString.split("/");

        let profileId = urlComponents[0];
        profileId = profileId.substring(0, profileId.length - 2);
        let workbookId = urlComponents[2];
        let sheetId = urlComponents[3];

        client.query('UPDATE tweet SET profile = $1, workbook = $2, sheet = $3 WHERE id=($4)', [profileId, workbookId, sheetId, tweets[i].id]);
      }
    }
  }  

})();