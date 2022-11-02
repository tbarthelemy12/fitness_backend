const express = require('express');
const { getRoutineActivityById, updateRoutineActivity, destroyRoutineActivity, getRoutineById } = require('../db');
const { requireUser } = require("./utils");
const routineActivitiesRouter = express.Router();


// PATCH /api/routine_activities/:routineActivityId
routineActivitiesRouter.patch('/:routineActivityId', requireUser, async (req, res, next) => {
    const { routineActivityId } = req.params;
    const { count, duration } = req.body;

    const updateFields = {};

    if (count) {
        updateFields.count = count;
    }
    if (duration) {
        updateFields.duration = duration;
    }

    try {
        const originalRoutineActivity = await getRoutineActivityById(routineActivityId);
        const originalRoutine = await getRoutineById(originalRoutineActivity.routineId);

        if (originalRoutine.creatorId === req.user.id) {
            updateFields.id = routineActivityId
            const updatedRoutineActivity = await updateRoutineActivity(updateFields);
            res.send(updatedRoutineActivity)
        } else {
            res.send({
                error: "error",
                name: "error",
                message: `User ${req.user.username} is not allowed to update ${originalRoutine.name}`
            })
        }
    } catch ({ error, name, message }) {
        next({ error, name, message })
    }
})

// DELETE /api/routine_activities/:routineActivityId
routineActivitiesRouter.delete('/:routineActivityId', requireUser, async (req, res) => {
    const routineActivity = await getRoutineActivityById(req.params.routineActivityId);
    const originalRoutine = await getRoutineById(routineActivity.routineId);

    if (originalRoutine.creatorId === req.user.id) {
        const updatedRoutineActivity = await destroyRoutineActivity(routineActivity.id, { active: false });
console.log(updatedRoutineActivity)
        res.send(updatedRoutineActivity);
    } else {
        res.status(403)
        res.send({
            error: "error",
            name: "UnauthorizedDeleteError",
            message: `User ${req.user.username} is not allowed to delete ${originalRoutine.name}`
        });
    }
})


module.exports = routineActivitiesRouter;