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
        if (err) return res.status(400).json(err);
        return res.json(isMatch ? user : isMatch);
      });
    })
    .catch((err) => res.status(400).json(`Error: User Not Found`));
});

// POST new user
router.route("/").post((req, res) => {
  const { _id, password, email, type, questionaire } = req.body;
  const newUser = new userSchema({
    _id,
    password,
    email,
    type,
    classesEnrolled: [],
    classesTeaching: [],
    questionaire,
    socialInitiative: {
      registeredNumber: "",
      businessNumber: "",
      location: "",
      hours: "",
      phone: "",
      email: "",
    },
  });
  newUser
    .save()
    .then(() => res.json(newUser))
    .catch((err) => res.status(400).json(err));
});

// PUT questionaire response
router.route("/addQuestionaire").put((req, res) => {
  const { _id, questionaire } = req.body;
  userSchema.findById(_id).then((user) => {
    user.questionaire = questionaire;
    user
      .save()
      .then(() => res.json(user))
      .catch((err) => res.status(404).json(err));
  });
});

// POST enroll course (Impact Learner only)
router.route("/enroll").put((req, res) => {
  const { userId, course } = req.body;
  userSchema.findById(userId).then((user) => {
    user.classesEnrolled = user.classesEnrolled.concat(course);
    user
      .save()
      .then(() => res.json(user))
      .catch((err) => res.status(404).json(err));
  });
});

// PUT update password
router.route("/password").put((req, res) => {
  const { _id, password } = req.body;
  userSchema
    .findById(_id)
    .then((user) => {
      user.password = password;
      user
        .save()
        .then(() => res.json(user))
        .catch((err) => res.json(err));
    })
    .catch((err) => res.status(400).json(err));
});

// PUT update classesTeaching (Impact Consultant only)
router.route("/updateClassesTeaching").put((req, res) => {
  const { _id, course } = req.body;
  userSchema
    .findById(_id)
    .then((user) => {
      user.classesTeaching = user.classesTeaching.concat({
        _id: course._id,
        name: course.name,
        img: "#",
      });
      user
        .save()
        .then(() => res.json(user))
        .catch((err) => res.json(err));
    })
    .catch((err) => res.status(400).json(err));
});

// DELETE drop a course (Impact Learner only)
router.delete("/dropCourse/:courseId/:userId", (req, res) => {
  const { userId, courseId } = req.params;
  userSchema.findById(userId).then((user) => {
    user.classesEnrolled = user.classesEnrolled.filter(
      (enrolled) => courseId !== enrolled._id
    );
    user
      .save()
      .then(() => res.json(user))
      .catch((err) => res.status(400).json(err));
  });
});

// PUT social initiative
router.route("/addSocialInitiativeProfile").put((req, res) => {
  const {
    registeredNumber,
    businessNumber,
    location,
    hours,
    phone,
    email,
    _id,
  } = req.body;
  userSchema.findById(_id).then((user) => {
    user.socialInitiative = {
      registeredNumber,
      businessNumber,
      location,
      hours,
      phone,
      email,
    };
    user
      .save()
      .then(() => res.json(user))
      .catch((err) => res.status(400).json(err));
  });
});

// GET user by id (username)
router.route("/:id").get((req, res) => {
  userSchema
    .findById(req.params.id)
    .then((user) => {
      if(user === null) return res.status(404).json("no user found");
      return res.json(user);
    })
    .catch((err) => res.status(404).json("no user found" + err));
});

// DELETE any user
router.delete("/deleteUser/:userId", (req, res) => {
  const { userId } = req.params;
  userSchema
    .findById(userId)
    .then((user) => {
      // ask about this (can a student ever be a teacher of a course, can a instructor ever be a student of a course)
      // if user == IL
        // loop over classesEnrolled, and call another route that removes them from that course array
      // if user == IC
        // loop over classesTeaching, and call another route that removes them from that course array
      // then delete the user from the database
      console.log("ello")
    })
    .catch((err) => res.status(400).json("User couldn't be deleted" + err));
});

module.exports = router;
