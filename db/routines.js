const client = require('./client');
async function attachActivitiesToRoutines(routines) {

  await Promise.all(routines.map(async (routine) => {
    const { rows: activities } = await client.query(`
    SELECT DISTINCT activities.*, ra.duration, ra.count, ra."routineId", ra.id AS "routineActivityId"
    FROM activities
    JOIN routine_activities as ra
    ON ra."activityId"=activities.id
    WHERE ra."routineId"=$1;
    `,[routine.id])
    routine.activities = activities 
  }))

  return routines;

}

async function getRoutineById(id) {
  try {
    const { rows: [routine] } = await client.query(`
      SELECT *
      FROM routines
      WHERE id=$1;
    `, [id]);

    if (!routine) {
      throw {
        name: "RoutineNotFoundError",
        message: "Could not find a routine with that ID"
      };
    }

    return routine
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function getRoutinesWithoutActivities() {
  try {
    const { rows } = await client.query(`
      SELECT *
      FROM routines;
    `);

    return rows;
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function getAllRoutines() {
  try {
    const { rows: routines } = await client.query(`
      SELECT routines.*, users.username AS "creatorName"
      FROM routines
      JOIN users ON routines."creatorId"=users.id;
    `);

    return await attachActivitiesToRoutines(routines);
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function getAllRoutinesByUser({ username }) {
  const { rows: routines } = await client.query(`
      SELECT DISTINCT routines.*, u.username AS "creatorName"
      FROM routines 
      JOIN
      users AS u
      ON routines."creatorId" = u.id
      WHERE u.username=$1
    `,[username]);

  
  const attachedRoutines = await attachActivitiesToRoutines(routines)
  return attachedRoutines;

}

async function getPublicRoutinesByUser({ username }) {
  const { rows: routines } = await client.query(`
      SELECT DISTINCT routines.*, u.username AS "creatorName"
      FROM routines 
      JOIN
      users AS u
      ON routines."creatorId" = u.id
      WHERE u.username=$1 AND "isPublic" = true
    `,[username]);

  
  const attachedRoutines = await attachActivitiesToRoutines(routines)
  return attachedRoutines;
}

async function getAllPublicRoutines() {
  try {
    const { rows: routines } = await client.query(`
      SELECT DISTINCT routines.*, u.username AS "creatorName"
      FROM routines
      JOIN 
      users AS u
      ON routines."creatorId" = u.id
      WHERE "isPublic"=true;
    `,);
    const attachRoutines = await attachActivitiesToRoutines(routines);
    return attachRoutines
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function getPublicRoutinesByActivity({ id }) {
    const { rows: routines } = await client.query(`
      SELECT DISTINCT routines.*, u.username AS "creatorName"
      FROM routines
      JOIN routine_activities AS ra
      ON routines.id = ra."routineId"
      JOIN users AS u
      ON routines."creatorId" = u.id
      WHERE ra."activityId" = $1
      AND "isPublic"=true;
    `, [id]);
    const attachRoutines = await attachActivitiesToRoutines(routines);
    return attachRoutines

}

async function createRoutine({ creatorId, isPublic, name, goal }) {
  try {
    const { rows: [routine] } = await client.query(`
      INSERT INTO routines("creatorId", "isPublic", name, goal)
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `, [creatorId, isPublic, name, goal])

    return routine;
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function updateRoutine({ id, ...fields }) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${key}"=$${index + 1}`
  ).join(', ');

  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE routines
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));
    }

    return await getRoutineById(id);
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function destroyRoutine(id) {
  try {
    await client.query(`
    DELETE FROM routine_activities
    WHERE "routineId"=$1;
    `, [id]);

    const { rows: [deletedRoutine] } = await client.query(`
      DELETE FROM routines
      WHERE id=$1
      RETURNING *
      `, [id]);
      return deletedRoutine
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getRoutineById,
  getRoutinesWithoutActivities,
  getAllRoutines,
  getAllPublicRoutines,
  getAllRoutinesByUser,
  getPublicRoutinesByUser,
  getPublicRoutinesByActivity,
  createRoutine,
  updateRoutine,
  destroyRoutine,
}