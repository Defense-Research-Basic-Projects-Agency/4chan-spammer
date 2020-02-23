
var dateFormat = require('dateformat');
var shill = require('./4shill.js')
var fs = require('fs')


var token = 'xxx';

function postLoop(params)
{
  params.post.board = params.post.boards[Math.floor(Math.random() * (params.post.boards.length - 1))]
  shill.getThreads(params.post.board)
  .then(threads => {
    var thread = threads[Math.floor(Math.random()*(threads.length-1))]
    params.post.thread = thread.no

    var file = fs.readFileSync('comments.txt').toString()
    .split('<==>')
    var line = file[Math.floor(Math.random() * (file.length - 1))].trim()

    .replace(/{inv}/g, '/q3XQyZc/')
    .replace(/{link}/g, ``)
    .replace(/{code}/g, `referral code (post this): ${Math.floor(Math.random() * 8999) + 1000}`)

    var pics = fs.readdirSync('smug')
    params.post.file = `smug/` + pics[Math.floor(Math.random() * pics.length)]
    params.post.comment = line
      var files = fs.readdirSync('smug')
      console.log('Replying to ' + thread.no )
      shill.post(params.post).then(r => {
        if (params.loop.success) params.loop.success(r)
          setTimeout(postLoop, params.loop.timeout, params)
      }).catch(e => {
        console.log(e)
      })
  })
  .catch(e => {
    console.log(e)
  })

}





postLoop({
  loop: {
    timeout: 10 * 60 * 1000,
    success: (r) => {
        console.log(r)
      },
    fail: (e) => {
        console.log(e)
      },
  },
  post: {
    boards: ['b','r9k','soc'],
    token: token
   }
 })
