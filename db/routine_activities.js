const client = require('./client')

async function getRoutineActivityById(id){
  try {
    const { rows: [routine_activity] } = await client.query(`
      SELECT *
      FROM routine_activities
      WHERE id=$1;
    `, [id]);

    if (!routine_activity) {
      throw {
        name: "RoutineActivityNotFoundError",
        message: "Could not find a routine activity with that ID"
      };
    }

    return routine_activity
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function addActivityToRoutine({
  routineId,
  activityId,
  count,
  duration,
}) {
  try {
    const { rows: [routine_activity] } = await client.query(`
      INSERT INTO routine_activities("routineId", "activityId", count, duration)
      VALUES($1, $2, $3, $4)
      ON CONFLICT ("routineId", "activityId") DO NOTHING
      RETURNING *;
    `, [routineId, activityId, count, duration]);

    return routine_activity
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function getRoutineActivitiesByRoutine({id}) {
  try {
    const { rows: routine_activity } = await client.query(`
      SELECT *
      FROM routine_activities
      WHERE "routineId"=$1;
    `, [id]);

    if (!routine_activity) {
      throw {
        name: "RoutineActivityNotFoundError",
        message: "Could not find a routine activity with that ID"
      };
    }

    return routine_activity
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function updateRoutineActivity ({id, ...fields}) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE routine_activities
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));
    }

    return await getRoutineActivityById(id);
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function destroyRoutineActivity(id) {
  try {
    const { rows: [routine_activity] } = await client.query(`
      DELETE FROM routine_activities
      WHERE id=$1
      RETURNING *;
      `, [id]);

      return routine_activity
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function canEditRoutineActivity(routineActivityId, userId) {
  try {
    const { rows: [routineActivity] } = await client.query(`
    SELECT *
    FROM routine_activities
    WHERE id = $1;
    `, [routineActivityId])

    const { rows: [routine] } = await client.query(`
    SELECT *
    FROM routines
    WHERE id = $1;
    `, [routineActivity.routineId])

    if (userId === routine.creatorId) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  getRoutineActivityById,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
  updateRoutineActivity,
  destroyRoutineActivity,
  canEditRoutineActivity,
};
