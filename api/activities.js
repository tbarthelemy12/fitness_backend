const express = require('express');
const { getAllActivities, getActivityById, createActivity, updateActivity, getPublicRoutinesByActivity, getActivityByName } = require('../db');
const { requireUser } = require("./utils");
const activitiesRouter = express.Router();


// GET /api/activities/:activityId/routines
activitiesRouter.get("/:activityId/routines", async (req, res, next) => {
    const { activityId } = req.params

    try {
        const activity = await getActivityById(activityId)
        if(!activity){
        res.send({
            error: "error",
            message: `Activity ${activityId} not found`,
            name: "ActivityNotFoundError"
        }) 
     }    
        const routines = await getPublicRoutinesByActivity(activity)
        
        if (routines && routines.length > 0){
            res.send(routines)
        }
        
    } catch ({name, message, error}) {
        next({name, message, error})
    }
})

// GET /api/activities
activitiesRouter.get('/', async (req, res, next) => {
    try {
        const allActivities = await getAllActivities();

        res.send(
            allActivities
        );
    } catch ({name, message}) {
        next({name, message});
    }
})

// POST /api/activities
activitiesRouter.post('/', requireUser, async (req, res, next) => {
    const { name, description } = req.body;

    const activityData = {};

    try {
        activityData.description = description;
        activityData.name = name;
        const activity = await createActivity(activityData);

        if (activity) {
            res.send(activity)
        } else {
            res.send({
                error: "error",
                name: "error",
                message: `An activity with name ${name} already exists`
            })
        }

    } catch ({name, message}) {
        next({name, message});
    }
})

// PATCH /api/activities/:activityId
activitiesRouter.patch('/:activityId', requireUser, async (req, res, next) => {
    const {activityId} = req.params
    const { name, description } = req.body
    
    const activityData = {}

 try {
    const activity = await getActivityById(activityId)
    if(!activity){
        res.send({
            error: "error",
            message: `Activity ${activityId} not found`,
            name: "ActivityNotFoundError"
        })
    }
    const activityName = await getActivityByName(name)
    if(activityName){
        res.send({
            name: "ActivityExistsError",
            message: `An activity with name ${name} already exists`,
            error: "error",
        })
    }
    activityData.name = name
    activityData.description = description
    activityData.id = req.params.activityId
   
    if (req.user){
            const updatedActivity = await updateActivity(activityData)
            res.send(updatedActivity)
    } 
    else {
        next({
            name:"UnathorizedError",
            message: "You must be logged in to perform this action",
            error: "error"
        })
    }
    } catch ({name, message, error}) {
        next({name, message, error})
    }
})

module.exports = activitiesRouter;