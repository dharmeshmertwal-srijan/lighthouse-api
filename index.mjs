import express from 'express';
import lighthouse from 'lighthouse';
import http from  'https';
import chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer';
import expressVhost from 'express-vhost';

var app = express()
http.createServer(app)

app.listen(3000, function() {
  console.log('listening on port *:3000');
});

app.route('*')
   .all(function(req, res, next) {
     res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Headers', 'X-API-TOKEN, Content-Type, Authorization, Content-Length, X-Requested-With');
   next();
})

app.get("/lighthouse-static",function(req,response){
  var data = req.query;
  var urlRequested = data.urlRequested;
    (async () => {
        const requestedUrl = urlRequested;
        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        const options = {logLevel: 'info', output: 'json', onlyCategories: ['performance'], port: chrome.port};
        const runnerResult = await lighthouse(requestedUrl, options);
        await chrome.kill();
        response.send(JSON.stringify(runnerResult.lhr.categories, null, 2));
    })();
})

app.get("/lighthouse-dynamic",function(req,response){
  console.log("yes");
  var data = req.query;
  var urlLogin = data.urlLogin;
  var urlRequested = data.urlRequested;
  var username = data.username;
  var password = data.password;
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      slowMo: 50,
    });
    const page = await browser.newPage();
    await login(page, urlLogin,username,password);

    const runnerResult = await lighthouse(urlRequested, {disableStorageReset: true}, undefined, page);
    await browser.close();
    response.send(JSON.stringify(runnerResult.lhr, null, 2));
  })();
})

async function login(page,origin,username,password){
  await page.goto(origin);
  await page.waitForSelector('input', {visible: true});
  // Fill in and submit login form.
  var emailInput = await page.$('input[type="email"]');
 
  if (!emailInput) {
    emailInput = await page.$('input[type="text"]');
  }
  await emailInput.type(username);
  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.type(password);
  await Promise.all([
      page.$eval('form', form => form.submit()),
      page.waitForNavigation(),
  ]);
}
