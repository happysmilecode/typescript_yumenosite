let Course = require("../models/course.model");
let assessmentSchema = require("../models/assessment.model");

const router = require("express").Router();
const multer = require("multer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const GridFsStorage = require("multer-gridfs-storage");

var Grid = require("gridfs-stream");
const Assessment = require("../models/assessment.model");
Grid.mongo = mongoose.mongo;

// .env
require("dotenv").config();
const uri = process.env.ATLAS_URI;

const conn = mongoose.createConnection(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

let gfs;
conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "course_uploads",
  });
});

const storage = new GridFsStorage({
  url: uri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: "course_uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage: storage });

/**
 * POST new course
 * @param req { name, students, teachers, description, files, tags, level }
 * @return course
 */
router.route("/").post((req, res) => {
  // add user id to course route
  const {
    name,
    students,
    teachers,
    description,
    files,
    tags,
    level,
  } = req.body;

  // populate with finalized schema
  const newCourse = new Course({
    name,
    students,
    teachers,
    description,
    files,
    tags,
    level,
    assessments: [],
    img: "",
  });

  newCourse
    .save()
    .then((course) => res.json(course))
    .catch((err) => res.status(400).json("Error: " + err));
});

/**
 * GET course by id
 * @param id: course id
 * @return course
 */
router.get("/:id", (req, res) => {
  Course.findById(req.params.id)
    .then((course) => {
      if (!course) return res.status(404).json("Course Not Found");
      res.json(course);
    })
    .catch((err) => res.status(404).json(err));
});

/**
 * POST enroll student
 * @param req {userId, courseId}
 * @param userId user id
 * @param courseId course id
 */
router.put("/enroll", (req, res) => {
  const { userId, courseId } = req.body;
  Course.findById(courseId).then((course) => {
    course.students = course.students.concat(userId);
    course
      .save()
      .then(() => res.json("Student added Successfully!"))
      .catch((err) => res.status(400).json(err));
  });
});

/**
 * DELETE drop student from course
 * @param req {userId, courseId}
 * @param userId user id
 * @param courseId course id
 * @return course
 */
router.delete("/dropCourse/:courseId/:userId", (req, res) => {
  const { userId, courseId } = req.params;
  Course.findById(courseId).then((course) => {
    course.students = course.students.filter((id) => id !== userId);
    course
      .save()
      .then(() => res.json(course))
      .catch((err) => res.status(400).json(err));
  });
});

/**
 * GET all courses
 * @return all courses
 */
router.route("/").get((req, res) => {
  Course.find()
    .then((courses) => res.json(courses))
    .catch((err) => res.status(400).json(`Error: ${err}`));
});

/**
 * GET courses by search query
 * @param query the search query
 * @return array of courses that satisfy the query
 *
 */
router.route("/search/:query").get((req, res) => {
  const { query } = req.params;
  Course.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { teachers: { $regex: query, $options: "i" } },
      { level: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ],
  })
    .then((courses) => {
      res.json(courses);
    })
    .catch((err) => res.status(404).json(err));
});

// PUT updates course content given the course id
router.put("/update", (req, res) => {
  const { _id, name, description, tags, level } = req.body.course;

  Course.findById(_id)
    .then((course) => {
      course = { ...course, name, description, tags, level };
      course
        .save()
        .then(() => res.json(course))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(404).json(err));
});

/**
 * POST uploading document to a course
 * @param id course id
 */
router.post("/:id/upload", upload.array("documents", 10), (req, res) => {
  Course.findById(req.params.id)
    .then((course) => {
      course
        .save()
        .then(() => res.json("Document Added!"))
        .catch((err) => res.json(err));
    })
    .catch((err) => res.status(400).json(`Error finding Course: ${err}`));
});

/**
 * POST uploading courseImage to a course
 * @param id course id
 */
router.post(
  "/:id/uploadCourseImage",
  upload.array("document", 1),
  (req, res) => {
    Course.findById(req.params.id)
      .then((course) => {
        course.img = req.files[0].id;
        course
          .save()
          .then(() => res.json(course))
          .catch((err) => res.json(err));
      })
      .catch((err) => res.status(400).json(`Error finding Course: ${err}`));
  }
);

/**
 * GET course image id
 * @param id course id
 * @return course image
 */
router.get("/:id/getCourseImage", (req, res) => {
  Course.findById(req.params.id)
    .then((course) => {
      res.json(course.img);
    })
    .catch((err) => res.status(404).json(err));
});

/**
 * GET document by id
 * @param id document id
 * @return document
 */
router.get("/documents/:id", (req, res) => {
  gfs
    .find({
      _id: mongoose.Types.ObjectId(req.params.id),
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist",
        });
      }
      gfs.openDownloadStream(mongoose.Types.ObjectId(req.params.id)).pipe(res);
    });
});

/**
 * POST delete files
 * @param id document id
 */
router.post("/documents/del/:id", (req, res) => {
  gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
    if (err) return res.status(404).json({ err: err.message });
    res.json("document deleted");
  });
});

/**
 * GET all the document filenames of a course
 * @param id course
 */
router.get("/getAllFiles/:id", (req, res, next) => {
  Course.findById(req.params.id)
    .select("files")
    .exec()
    .then((doc) => {
      res.json({
        documents: doc.files,
      });
    })
    .catch((err) => res.json(err));
});

/**
 * PUT review on a course
 *  @param _id the course id
 *  @return course the course
 */
router.put("/addReview/", (req, res) => {
  const { _id, courseReview, score, courseId, anon } = req.body;

  Course.findById(courseId).then((course) => {
    course.reviews = course.reviews.concat({
      _id,
      courseReview,
      score,
      anon,
    });
    course
      .save()
      .then(() => res.json(course))
      .catch((err) => res.status(400).json(err));
  });
});

/**
 * POST new assessment
 * @param req {courseId, studentId, files}
 */
router.route("/assessment").post((req, res) => {
  const { name, files, visibility } = req.body;

  const newAssessment = new Assessment({
    name,
    files,
    visibility,
    studentSubmissions: [],
  });
  newAssessment
    .save()
    .then((assessment) => res.json(assessment))
    .catch((err) => res.status(400).json("Error: " + err));
});

//
router.route("/assessment/addAssessment").put((req, res) => {
  const { courseId, assessmentId } = req.body;
  Course.findById(courseId).then((newCourse) => {
    newCourse.assessments = newCourse.assessments.concat(assessmentId);
    newCourse
      .save()
      .then(() => res.json(newCourse))
      .catch((err) => res.json(err));
  });
});

/**
 * DELETE remove assessment from course
 * @param req {courseId, assessmentId}
 * @param courseId course id
 * @param assessmentId assessment id
 * @return assessment
 */
router.delete(
  "/assessment/deleteAssessment/:courseId/:assessmentId",
  (req, res) => {
    const { courseId, assessmentId } = req.params;

    Course.findById(courseId).then((newCourse) => {
      newCourse.assessments = newCourse.assessments.filter(
        (id) => id !== assessmentId
      );

      newCourse
        .save()
        .then(() => res.json(newCourse))
        .catch((err) => res.status(400).json(err));
    });

    assessmentSchema.findByIdAndRemove(assessmentId, function (err) {
      if (!err) {
        return res.status(200).json(null);
      }
      return res.status(400).send();
    });
  }
);

// Upload student submission to assessment
/**   [ [studentId, fileId[]] ]
 * PUT student submission to assessment
 * @param req {courseId, assessmentId, studentId, files}
 */
router.post(
  "/assessment/addStudentSubmission",
  upload.array("documents", 10),

  (req, res) => {
    const { courseId, assessmentId, studentId } = req.body;

    Course.findById(courseId).then((newCourse) => {
      const ass = newCourse.assessments.filter((id) => id === assessmentId);
      Assessment.findById(ass).then((assessment) => {
        if (!assessment.studentSubmissions) {
          assessment.studentSubmissions = [
            {
              studentId,
              files: [req.files[0].id],
            },
          ];
        }

        const submissions = assessment.studentSubmissions.filter(
          (sub) => sub.studentId === studentId
        );
        if (submissions.length) {
          const sub =
            assessment.studentSubmissions[
              assessment.studentSubmissions.indexOf(submissions[0])
            ];

          sub.files = sub.files.concat(req.files[0].id);
        } else {
          assessment.studentSubmissions = assessment.studentSubmissions.concat({
            studentId,
            files: [req.files[0].id],
          });
        }

        assessment.markModified("studentSubmissions");
        assessment
          .save()
          .then((assessment) => res.json(assessment))
          .catch((err) => res.status(400).json(err));
      });
    });
  }
);

/**
 * GET an assessment by id
 * @param assessmentId: assessment id
 * @return assessment
 */

router.get("/assessment/getAssessment/:assessmentId", (req, res) => {

  Assessment.findById(req.body.assessmentId)
    .then((assessment) => {
      console.log(assessment);
      if (!assessment) return res.status(404).json("Assessment Not Found");
      return res.json(assessment);
    })
    .catch((err) => res.status(404).json(err));
});

/**
 * GET all assessments from a course
 * @param req {courseId, assessmentId, studentId, file}
 * @return all assessments in a course
 */
router.get("/assessment/getAllAssessments/:courseId", (req, res) => {
  Course.findById(req.body.courseId)
    .then((course) => {
      var assessmentArray = [];


      course.assessments.forEach(assessment => {
        console.log(assessment);
        Assessment.findById(assessment)
          .then((assess) => {
            console.log(assess);
            console.log(assessmentArray);
            assessmentArray = assessmentArray.concat(assess);
            console.log(assessmentArray);
            if (assessmentArray.length == course.assessments.length) {
              res.json(assessmentArray);
            }
          })
          .catch((err) => res.status(400)
          .json(`Error: ${err}`));
      });

      

    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
  });
  

/**
 * GET student submission by studentId
 */
router.get("/assessment/getstudentSubmission/:assessmentId/:studentId", (req, res) => {
  Assessment.findById(req.body.assessmentId)
    .then((assessment) => {
      const submission = assessment.studentSubmissions.filter(
        (submission) => submission.studentId === req.params.studentId
      );
      if (submission.length) {
        res.json(submission[0]);
      } else {
        res.status(404).json(`Error: Submission not found`);
      }
    })
    .catch((err) => res.status(400)
    .json(`Error: ${err}`));
});

/**
 * GET all student submissions for an assessment
 */
router.get("/assessment/getAllStudentSubmissions/:assessmentId", (req, res) => {
  Assessment.findById(req.body.assessmentId)
    .then((assessment) => {
      if (assessment.studentSubmissions.length) {
        res.json(assessment.studentSubmissions);
      } else {
        res.status(404).json(`Error: Assessment Not Found`);
      }

    })
    .catch((err) => res.status(400).json(`Error: ${err}`));
});



module.exports = router;
