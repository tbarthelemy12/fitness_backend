const express = require("express");
const usersRouter = express.Router();
const {
  getUserByUsername,
  createUser,
  getPublicRoutinesByUser,
} = require("../db");
const { JWT_SECRET } = process.env;
const { requireUser } = require("./utils");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /api/users/login
usersRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password",
    });
  }

  async function comparePassword(plaintextPassword, hash) {
    const result = await bcrypt.compare(plaintextPassword, hash);
    return result;
  }

  try {
    const user = await getUserByUsername(username);
    if (user && comparePassword(password, "10")) {
      const id = user.id;
      // create token & return to user
      const token = jwt.sign(
        { id: id, username: username },
        process.env.JWT_SECRET,
        { expiresIn: "1w" }
      );

      res.send({ message: "you're logged in!", token, user });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "Username or password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
// POST /api/users/register
usersRouter.post("/register", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      res.send({
        error: "Error",
        message: `User ${username} is already taken.`,
        name: "UserExistsError",
      });
    } else {
      console.log("new user");
    }

    if (password.length < 8) {
      res.send({
        error: "Password must be atleast 8 characters",
        message: "Password Too Short!",
        name: "Error",
      });
    }

    const user = await createUser({
      username,
      password,
    });

    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      JWT_SECRET,
      {
        expiresIn: "1w",
      }
    );

    res.send({
      message: "thank you for signing up",
      token,
      user,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get("/me", requireUser, async (req, res, next) => {
  const user = req.user;
  res.send(user);
  next;
});

usersRouter.get(`/:username/routines`, async (req, res, next) => {
  const { username } = req.params;

  try {
    const routines = await getPublicRoutinesByUser({ username });
    res.send(routines);
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = usersRouter;