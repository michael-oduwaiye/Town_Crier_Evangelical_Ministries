require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const adminCourseRoutes = require("./routes/adminCourseRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");

const User = require("./models/user");
const Course = require("./models/Course");

const app = express();

// App config
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false, // change to true in production with HTTPS
    },
  })
);

// Make values available in all EJS views
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.isLoggedIn = !!req.session.userId;
  res.locals.userId = req.session.userId || null;
  res.locals.currentUser = null;
  res.locals.isAdmin = false;

  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId).select("-password");

      if (user) {
        res.locals.currentUser = user;
        res.locals.isAdmin = user.role === "admin";
      }
    }
  } catch (error) {
    console.error("Error loading current user:", error.message);
  }

  next();
});

// Helper to match existing frontend structure
function formatCourseForView(course) {
  return {
    ...course.toObject(),
    image: course.featuredImage || "/images/event1.jpg",
    students: String(course.studentsCount ?? 0),
    rating: String(course.averageRating ?? 0),
  };
}

// Website pages
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/events", (req, res) => {
  res.render("events");
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    submitted: req.query.submitted || "",
  });
});

app.get("/ministries/dbw", (req, res) => {
  res.render("ministries/dbw");
});

app.get("/ministries/bootcamp", (req, res) => {
  res.render("ministries/bootcamp");
});

app.get("/ministries/arrows", (req, res) => {
  res.render("ministries/arrows");
});

// DBW HUB
app.get("/hub", (req, res) => {
  res.render("hub/index");
});

app.get("/hub/courses", async (req, res) => {
  try {
    const dbCourses = await Course.find({ isPublished: true }).sort({ createdAt: -1 });
    const allCourses = dbCourses.map(formatCourseForView);

    res.render("hub/courses", { allCourses });
  } catch (error) {
    console.error("Error loading hub courses:", error.message);
    res.status(500).send("Server error");
  }
});

app.get("/hub/documents", async (req, res) => {
  try {
    const dbCourses = await Course.find({ isPublished: true }).sort({ createdAt: -1 });
    const courses = dbCourses.map(formatCourseForView);

    res.render("hub/documents", { courses });
  } catch (error) {
    console.error("Error loading hub documents:", error.message);
    res.status(500).send("Server error");
  }
});

app.get("/hub/courses/:slug", async (req, res) => {
  try {
    const dbCourse = await Course.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

    if (!dbCourse) {
      return res.status(404).render("404", { message: "Course not found" });
    }

    const course = formatCourseForView(dbCourse);
    res.render("hub/course-details", { course });
  } catch (error) {
    console.error("Error loading course details:", error.message);
    res.status(500).send("Server error");
  }
});

// Backend routes
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/contact", contactRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/courses", adminCourseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start server only after MongoDB connects
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
  });