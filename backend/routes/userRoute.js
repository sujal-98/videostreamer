const express=require('express')
const isAuthenticated=require('../middleware/checkAuth')
const User=require('../modal/user')
const router=express.Router()

router.get('/userinfo', isAuthenticated, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          profilePhoto: user.profilePhoto
        });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  module.exports = router;
