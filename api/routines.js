const express = require('express');
const { getAllPublicRoutines, createRoutine, getRoutineById, updateRoutine, destroyRoutine, addActivityToRoutine } = require('../db');
const routinesRouter = express.Router();
const { requireUser } = require("./utils");


// GET /api/routines
routinesRouter.get('/', async (req, res, next) => {
    try {
        const allRoutines = await getAllPublicRoutines();

        res.send(
            allRoutines
        );
    } catch ({name, message}) {
        next({name, message});
    }
});

// POST /api/routines
routinesRouter.post('/', requireUser, async (req, res, next) => {
    const { isPublic, name, goal } = req.body;

    const routineData = {};

    try {
        routineData.creatorId = req.user.id;
        routineData.name = name;
        routineData.isPublic = isPublic;
        routineData.goal = goal;
        const routine = await createRoutine(routineData);

        res.send(routine)
    } catch ({name, message}) {
        next({name, message});
    }
});

// PATCH /api/routines/:routineId
routinesRouter.patch('/:routineId', requireUser, async (req, res, next) => {
    const { routineId } = req.params;
    const { isPublic, name, goal } = req.body;

    const updateFields = {};

    if (isPublic !== undefined) {
        updateFields.isPublic = isPublic;
    }
    if (name) {
        updateFields.name = name;
    }
    if (goal) {
        updateFields.goal = goal;
    }

    try {
        const originalRoutine = await getRoutineById(routineId);
        if (originalRoutine.creatorId === req.user.id) {
            const updatedRoutine = await updateRoutine({id:routineId, ...updateFields});
            res.send(updatedRoutine)
        } else if (originalRoutine.creatorId !== req.user.id) {
            res.status(403)
            res.send({
                error: "error",
                name: "UnauthorizedUpdateError",
                message: `User ${req.user.username} is not allowed to update ${originalRoutine.name}`
            });
        }
    } catch ({name, message}) {
        next({name, message});
    }
})

// DELETE /api/routines/:routineId
routinesRouter.delete('/:routineId', requireUser, async (req, res) => {
    const routine = await getRoutineById(req.params.routineId);
    const originalRoutine = await getRoutineById(routine.routineId);

    if (originalRoutine.creatorId === req.user.id) {
        const updatedRoutine = await destroyRoutine(routine.id, { active: false });

        res.send(updatedRoutine);
    } else {
        res.status(403)
        res.send({
            error: "error",
            name: "UnauthorizedDeleteError",
            message: `User ${req.user.username} is not allowed to delete ${originalRoutine.name}`
        });
    }
})

// POST /api/routines/:routineId/activities
routinesRouter.post("/:routineId/activities", requireUser, async (req, res, next) => {
    const {routineId} = req.params
    const { activityId, count, duration } = req.body;
  
    const routineData = {};
  
    try {
        routineData.routineId = routineId
        routineData.activityId = activityId;
        routineData.count = count;
        routineData.duration = duration
  
      const newRoutine = await addActivityToRoutine(routineData);
  
      if(newRoutine) 
        {res.send(newRoutine);
      }else if (routineId === activityId) {
      next({
        name: "DuplicateRoutineActivityError",
        message: `Activity ID ${activityId} already exists in Routine ID ${routineId}`,
        error: "error",
      });}
    } catch (error) {
      next(error);
    }
  });

module.exports = routinesRouter;