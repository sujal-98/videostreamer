const express = require('express');
const passport = require('../resource/passport');
const router = express.Router();
const user=require('../modal/user')

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
req.session.token = req.user
    
console.log("Success",req.session.token,req.user)
    res.redirect('http://localhost:3000');
  }
);

router.get('/logout', (req, res) => {
  console.log("loggouting")
  req.logout((err) => {
    console.log("logged out")
    if (err) return next(err);
    req.session.destroy()
    res.redirect('/');
  });
});

router.get('/current_user', async (req, res) => {
  try {
    console.log("checking")
    console.log(req.session , req.session.token)
    if (req.session && req.session.token) {
      const token = req.session.token;
      console.log("token: ",token)
      if(token){
        const data=await user.findOne({"googleId":token.googleId})
        res.status(200).json(data)
      }
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
