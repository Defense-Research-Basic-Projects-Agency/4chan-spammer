# 4chan-spammer

4shill.js contains a function that makes a post on 4chan in a specified thread on a specified board given a 2captcha solve token.

It's as basic as this:

```javascript
var shill = require('./4shill.js')

shill.post({
    board: 'b',
    thread: '821267558',
    token: 2-captcha-token,
    comment: 'original comment',
    captchaTick: () => {
      console.log('CAPCHA_NOT_READY')
    }
  }).then(r => {
          console.log(r); // Returns posted thread
      }).catch(e => {
        console.log(e)
      })
```
