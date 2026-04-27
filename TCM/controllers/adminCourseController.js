const Course = require("../models/Course");

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

function parseList(value) {
  if (!value) return [];
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseModules(value) {
  if (!value) return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [titlePart, lessonsPart] = line.split("|").map((item) => item.trim());
      return {
        title: titlePart || "Untitled Module",
        lessons: Number(lessonsPart || 0),
      };
    });
}

function mapUploadedFiles(filesArray = []) {
  return filesArray.map((file) => ({
    originalName: file.originalname,
    fileUrl: file.path.replace(/^public/, "").replace(/\\/g, "/"),
  }));
}

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.render("admin/courses/index", { courses });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).send("Server error");
  }
};

exports.getNewCourseForm = (req, res) => {
  res.render("admin/courses/new");
};

exports.createCourse = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();

    if (!title || !description) {
      return res.status(400).send("Title and description are required.");
    }

    let slug = req.body.slug?.trim() || slugify(title);
    const existingSlug = await Course.findOne({ slug });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const featuredImageFile = req.files?.featuredImage?.[0];
    const assignmentFile = req.files?.assignmentDocument?.[0];
    const documentFiles = req.files?.courseDocuments || [];
    const audioFiles = req.files?.courseAudios || [];

    const course = new Course({
      title,
      slug,
      featuredImage: featuredImageFile
        ? featuredImageFile.path.replace(/^public/, "").replace(/\\/g, "/")
        : "",
      description,
      overview: req.body.overview?.trim() || "",
      duration: req.body.duration?.trim() || "",
      lessons: req.body.lessons?.trim() || "",
      instructor: req.body.instructor?.trim() || "",
      price: req.body.price?.trim() || "",
      buttonText: req.body.buttonText?.trim() || "View Course",
      buttonClass: req.body.buttonClass?.trim() || "bg-[#4F46E5] hover:bg-indigo-700",
      courseDocuments: mapUploadedFiles(documentFiles),
      courseAudios: mapUploadedFiles(audioFiles),
      assignmentDocument: assignmentFile
        ? {
            originalName: assignmentFile.originalname,
            fileUrl: assignmentFile.path.replace(/^public/, "").replace(/\\/g, "/"),
          }
        : {
            originalName: "",
            fileUrl: "",
          },
      whatYouWillLearn: parseList(req.body.whatYouWillLearn),
      modules: parseModules(req.body.modules),
      requirements: parseList(req.body.requirements),
      audience: parseList(req.body.audience),
      isPublished: req.body.isPublished === "on",
    });

    await course.save();
    res.redirect("/admin/courses");
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).send("Server error");
  }
};

exports.getEditCourseForm = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    res.render("admin/courses/edit", { course });
  } catch (error) {
    console.error("Get edit course error:", error);
    res.status(500).send("Server error");
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    const title = req.body.title?.trim();
    const description = req.body.description?.trim();

    if (!title || !description) {
      return res.status(400).send("Title and description are required.");
    }

    let slug = req.body.slug?.trim() || slugify(title);
    const existingSlug = await Course.findOne({
      slug,
      _id: { $ne: course._id },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const featuredImageFile = req.files?.featuredImage?.[0];
    const assignmentFile = req.files?.assignmentDocument?.[0];
    const documentFiles = req.files?.courseDocuments || [];
    const audioFiles = req.files?.courseAudios || [];

    course.title = title;
    course.slug = slug;
    course.description = description;
    course.overview = req.body.overview?.trim() || "";
    course.duration = req.body.duration?.trim() || "";
    course.lessons = req.body.lessons?.trim() || "";
    course.instructor = req.body.instructor?.trim() || "";
    course.price = req.body.price?.trim() || "";
    course.buttonText = req.body.buttonText?.trim() || "View Course";
    course.buttonClass = req.body.buttonClass?.trim() || "bg-[#4F46E5] hover:bg-indigo-700";
    course.whatYouWillLearn = parseList(req.body.whatYouWillLearn);
    course.modules = parseModules(req.body.modules);
    course.requirements = parseList(req.body.requirements);
    course.audience = parseList(req.body.audience);
    course.isPublished = req.body.isPublished === "on";

    if (featuredImageFile) {
      course.featuredImage = featuredImageFile.path.replace(/^public/, "").replace(/\\/g, "/");
    }

    if (documentFiles.length) {
      course.courseDocuments = [
        ...course.courseDocuments,
        ...mapUploadedFiles(documentFiles),
      ];
    }

    if (audioFiles.length) {
      course.courseAudios = [
        ...course.courseAudios,
        ...mapUploadedFiles(audioFiles),
      ];
    }

    if (assignmentFile) {
      course.assignmentDocument = {
        originalName: assignmentFile.originalname,
        fileUrl: assignmentFile.path.replace(/^public/, "").replace(/\\/g, "/"),
      };
    }

    await course.save();
    res.redirect("/admin/courses");
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).send("Server error");
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.redirect("/admin/courses");
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).send("Server error");
  }
};

exports.togglePublishCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).send("Course not found");
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.redirect("/admin/courses");
  } catch (error) {
    console.error("Toggle publish error:", error);
    res.status(500).send("Server error");
  }
};