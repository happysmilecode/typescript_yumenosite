const router = require("express").Router();
let userSchema = require("../models/user.model");

// POST login user
router.route("/:email").post((req, res) => {
  const { password } = req.body;
  userSchema
    .findOne({
      email: req.params.email,
    })
    .then((user) => {
      user.comparePassword(password, function (err, isMatch) {
        if (err) return res.status(400).json(`${err}`);
        return res.json(isMatch ? user : isMatch);
      });
    })
    .catch((err) => res.status(400).json(`Error: User Not Found`));
});

// POST new user
router.route("/").post((req, res) => {
  const { username, password, email, type, questionaire } = req.body;
  const newUser = new userSchema({
    username,
    password,
    email,
    type,
    classesEnrolled: [],
    classesTeaching: [],
    questionaire,
  });
  newUser
    .save()
    .then(() => res.json(newUser))
    .catch((err) => res.status(400).json(err));
});

// POST enroll course, id refers to course id, title refers to course title, userId refers to user id
router.route("/enroll/:id/:title/:uid").post((req, res) => {
  userSchema.findById(req.params.uid).then((user) => {
    user.classesEnrolled = user.classesEnrolled.concat({
      _id: req.params.id,
      name: req.params.title,
    });
    user
      .save()
      .then(() => res.json("Course added Successfully!"))
      .catch((err) => res.json.status(404).json(err));
  });
});

// POST update password
router.route("/password/:id").post((req, res) => {
  userSchema
    .findById(req.params.id)
    .then((user) => {
      user.password = req.body.password;
      user
        .save()
        .then(() => res.json(`Password Updated`))
        .catch((err) => res.json(err));
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

// POST update email
router.route("/email/:id").post((req, res) => {
  userSchema
    .findById(req.params.id)
    .then((user) => {
      user.email = req.body.email;
      user
        .save()
        .then(() => res.json(`Email Updated`))
        .catch((err) => res.json(err));
    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

// DELETE user
router.route("/:id").delete((req, res) => {
  userSchema
    .findById(req.params.id)
    .then(() => res.json(`User Deleted`))
    .catch((err) => res.json(err));
});

module.exports = router;
