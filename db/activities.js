const client = require("./client");

// database functions
async function getAllActivities() {
  try {
    const { rows } = await client.query(`
      SELECt *
      FROM activities;
      `);

    return rows
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function getActivityById(id) {
  try {
    const { rows: [activity] } = await client.query(`
      SELECT *
      FROM activities
      WHERE id=$1;
    `, [id]);

    if (!activity) {
      throw {
        name: "ActivityNotFoundError",
        message: "Could not find an activity with that ID"
      };
    }

    return activity
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function getActivityByName(name) {
  try {
    const { rows: [activityIds] } = await client.query(`
      SELECT activities.id
      FROM activities
      WHERE name=$1;
    `, [name]);

    return activityIds;
  } catch (error) {
    console.log(error)
    throw error;
  }
}

// select and return an array of all activities
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

// return the new activity
async function createActivity({ name, description }) {
  try {
    const { rows: [activity] } = await client.query(`
      INSERT INTO activities(name, description)
      VALUES($1, $2)
      RETURNING *;
    `, [name, description]);

    return activity
  } catch (error) {
    console.log(error)
    throw error;
  }
}

// don't try to update the id
// do update the name and description
// return the updated activity
async function updateActivity({ id, ...fields }) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${key}"=$${index + 1}`
  ).join(', ');

  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE activities
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));
    }

    return await getActivityById(id);
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
}