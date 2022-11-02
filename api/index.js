const express = require('express');
const routineActivitiesRouter = require('./routineActivities');
const routinesRouter = require('./routines');
const activitiesRouter = require('./activities');
const usersRouter = require('./users');
const {  getUserById } = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();



router.use(async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');

    if (!auth) { // nothing to see hereac
      next();
    } else if (auth.startsWith(prefix)) {
      const token = auth.slice(prefix.length);

      try {
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        if (id) {
          req.user = await getUserById(id);
          next();
        }
      } catch ({ name, message }) {
        next({ name, message });
      }
    } else {
      next({
        name: 'AuthorizationHeaderError',
        message:` Authorization token must start with ${ prefix }`
      });
    }
  });

router.use((req, res, next) => {
    if (req.user) {
      // console.log("User is set:", req.user);
    }

    next();
  });


// GET /api/health
router.get('/health', async (req, res, next) => {
    res.status(200).json({
        uptime: process.uptime(),
        message: 'All is well',
        timestamp: Date.now()
    });
    next()
});

// ROUTER: /api/users
router.use('/users', usersRouter);

// ROUTER: /api/activities
router.use('/activities', activitiesRouter);

// ROUTER: /api/routines
router.use('/routines', routinesRouter);

// ROUTER: /api/routine_activities
router.use('/routine_activities', routineActivitiesRouter);

router.use((error, req, res) => {
    res.send({
      error: error.error,
      name: error.name,
      message: error.message
    });
  });

module.exports = router;