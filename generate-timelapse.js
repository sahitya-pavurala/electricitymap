const fs = require('fs')
const puppeteer = require('puppeteer')
const moment = require('moment')

const start = moment('2016-10-01T00:00:00Z')
const end = moment('2017-10-01T00:00:00Z')

async function capture(browser, moment) {
  let datetime = moment.format('YYYYMMDDTHHmm')
  let path = `screenshots/em_${datetime}.png`
  if (fs.existsSync(path)) { return; }
  let url = `http://localhost:8000/?wind=true&solar=false&page=map&remote=true&datetime=${moment.toISOString()}`
  let page = await browser.newPage();
  await page.setViewport({ width: 1700, height: 900 })
  await page.setCookie({
    name: 'electricitymap-token',
    value: '8CAC55BA7CEDC',
    url: url,
    session: false,
    expires: moment.utc().add(1, 'hour').valueOf()
  })
  await page.goto(url);
  await page.waitForSelector('#loading', { hidden: true })
  await page.waitFor(1000) // wait for wind to reach stationary state
  await page.screenshot({ path })
  console.log(moment.toISOString(), 'done..')
  await page.close()
}

const BATCH_SIZE = 2;

(async () => {
  console.log('Launching browser..')
  const browser = await puppeteer.launch();
  console.log('Starting iteration..')

  let jobs = []

  for (
    let now = moment(start);
    now.valueOf() <= moment(end).valueOf();
    now.add(1, 'hour'))
  {

    jobs.push(capture(browser, moment(now)))
    if (jobs.length > BATCH_SIZE) {
      await Promise.all(jobs)
      jobs = []
    }

  }

  await Promise.all(jobs)

  await browser.close()
})();
