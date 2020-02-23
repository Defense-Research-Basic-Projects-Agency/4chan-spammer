const request = require('request')
const fs = require('fs')
var mime = require('mime-types')
var path = require('path')
var Jimp = require('jimp');
var dateFormat = require('dateformat');
const notifier = require('node-notifier');
var fetch = require('node-fetch')
var random_useragent = require('random-useragent');
const qs = require('query-string');
const FormData = require('form-data')

function getAllThreads(board)
{
  return new Promise((resolve, reject) => {

    fetch(`https://a.4cdn.org/${board}/threads.json`).then(res => {
      if (res.status != 200)
        reject(res.status)
      else
        return res.json()
    })
    .then(pages => {
      var threads = []
        for (p in pages)
        {
          for (t in pages[p].threads)
          {
            var thread = pages[p].threads[t]
            thread.page = p
              threads.push(thread)
          }

        }
      resolve(threads)
    })
    .catch(e => {
      reject(e)
    })

  })
}

function submitRequest(params)
{
  /*
  submitRequest({
    token: google_response_2capctha,
    comment: "hello world",
    [file: "file.png",]
    [thread: 'thread number']
    [captchaTick]: onRequestCaptchaSolution()
  })
  */
  return new Promise((resolve, reject) => {

    var form = new FormData();
    form.append('g-recaptcha-response', params.token)
    form.append('mode', 'regist')
    form.append('com', params.comment)
    if (params.thread)
      form.append('resto', params.thread)

    if (params.file)
    {
      const fileStream = fs.createReadStream(params.file);
      form.append('upfile', fileStream, {
        "filename": path.basename(params.file), // ... or:
        //filepath: params.file,
        "Content-Type": mime.contentType(path.extname(params.file)),
        //knownLength: fileSizeInBytes
      })
    }
    fetch(
      `https://sys.4chan.org/${params.board}/post`,{
        method: 'post',
       headers: {
           Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
       //    "Content-Type": "multipart/form-data; boundary=---------------------------274092578425312",
           Origin: 'https://boards.4chan.org',
           Referer: 'https://boards.4chan.org/',
           Host: 'sys.4chan.org',
           'User-Agent': random_useragent.getRandom()
       },
       body: form
     }).then(r => {
       return r.text();
     }).then(body => {
       if (body.includes('><title>Post successful!</title>'))
       {
         resolve({
           success: true,
           code: 0,
           value: `https://boards.4chan.org/${params.board}/thread/${params.thread}`
         })
       } else if (body.includes(`<span id="errmsg" style="color: red;">Error: Duplicate file exists. `)){
         reject({
           success: false,
           code: 1,
           value: 'Duplicate  file'
         })
       } else if (body.includes(';">Our server thinks you look like a robot. Please solve the CAPTCHA below to access the site.</p>')) {
         reject({
           success: false,
           code: 2,
           value: 'Verification required.'
         })
       } else if (body.includes(';">Error: You seem to have mistyped the CAPTCHA. Please try again.<br>')) {
         reject({
           success: false,
           code: 3,
           value: 'Bad captcha.'
         })
       } else if (body.includes('">banned</a>')) {
         reject({
           success: false,
           code: 4,
           value: 'Banned.'
         })
       } else if (body.includes('><title>502 Bad Gateway</title>')) {
         reject({
           success: false,
           code: 5,
           value: 'Bad gateway.'
         })
       } else if (body.includes('">Error: You cannot reply to this thread anymore.</span>')) {
         reject({
           success: false,
           code: 6,
           value: 'Thread locked.'
         })
       } else if (body.includes('</a>]<br>4chan Pass users can bypass this block. [<a'))
       {
         reject({
           success: false,
           code: 7,
           value: 'Range ban.'
         })
       } else if (body.includes(` image reply.<br>`))
       {
         reject({
           success: false,
           code: 9,
           value: 'Image reply timeout.'
         })
       } if (body.includes(`a duplicate image.<br>`))
       {
         reject({
           success: false,
           code: 10,
           value: 'Duplicate image.'
         })
       } else if (body.includes(' red;">Error: Our system thinks your post is spam.</span>')) {
         reject({
           success: false,
           code: 11,
           value: 'Detected as spam'
         })
       } else if (body.includes('d;">Error: No file selected.</span><br><br')) {
         reject({
           success: false,
           code: 12,
           value: 'Requires file'
         })
       } else if (body.includes('seconds before posting a duplicate reply.</sp')) {
         reject({
           success: false,
           code: 13,
           value: 'Duplicate reply'
         })
       } else {
         reject({
           success: false,
           code: -1,
           value: body
         })
       }
     })
     .catch(e => {
       reject(e)
     })
  })

}

function solveCaptcha(options)
{
  /*
  solveCaptcha({
    token: google_response_2capctha,
    comment: "hello world",
    [file: "file.png",]
    [thread: 'thread number']
  })
  */
  var pageURL = `https://boards.4chan.org/${options.board}/thread/${options.thread}`;

  return new Promise((resolve, reject) => {
    fetch(
      'https://2captcha.com/in.php?' + qs.stringify({
        key: options.token,
        googlekey: '6Ldp2bsSAAAAAAJ5uyx_lx34lJeEpTLVkP5k04qc',
        pageurl: pageURL,
        method: 'userrecaptcha',
        json: 1
      }))
    .then((response) => {
        return response.text();
    })
    .then(text => {
        if (text == 'ERROR_WRONG_USER_KEY')
          throw text
        else
          return JSON.parse(text)
    }).then(json => {
      if (json.status == 0)
        throw json.request
      else
        return json.request
    })
    .then(code => {
      return new Promise((resolve, reject) => {
        var checkCaptcha = setInterval(() => {
          fetch(
            'https://2captcha.com/res.php?' + qs.stringify({
              key: options.token,
              action: 'get',
              id: code,
              json: 1
            })).then(res => {
              return res.json()
            })
            .then(json => {
              if (json.status == 1)
              {
                clearInterval(checkCaptcha)
                resolve(json.request)
              } else if (json.request == 'CAPCHA_NOT_READY') {
                if (options.captchaTick)
                  options.captchaTick()
              } else {
                reject(json)
              }
            })
            .catch(e => {
              reject(e)
            })

        }, 3000)
      })

    })
    .then(solveCode => {
      resolve(solveCode)
    })
    .then(result => {
      resolve(result)
    }).catch(e => {
      reject(e)
    })
  })
}

function post(params)
{
  /*
  {
    board: 'b',
    thread: '821267558',
    token: token,
    comment: 'The lucky number is ' + new Date().getTime(),
    captchaTick: () => {
      console.log('CAPCHA_NOT_READY')
    }
   // file: 'tomo.jpg'
  }
  */
  return new Promise((resolve, reject) => {
    return solveCaptcha(params).
    then(code => {
      return submitRequest({
        token: code,
        comment: params.comment,
        file: params.file,
        thread: params.thread,
        board: params.board
      })
    .then(result => {
      resolve(result)
    }).catch(e => {
        reject(e)
      })
    })
  })
}
module.exports = {
  getThreads: getAllThreads,
  post: post
}
