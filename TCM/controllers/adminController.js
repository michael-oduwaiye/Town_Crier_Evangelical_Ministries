const ProgramRegistration = require("../models/ProgramRegistration");
const ContactMessage = require("../models/ContactMessage");
const PrayerRequest = require("../models/PrayerRequest");

exports.getAdminDashboard = async (req, res) => {
  try {
    const [registrationCount, contactCount, prayerCount] = await Promise.all([
      ProgramRegistration.countDocuments(),
      ContactMessage.countDocuments(),
      PrayerRequest.countDocuments(),
    ]);

    res.render("admin/index", {
      registrationCount,
      contactCount,
      prayerCount,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).send("Server error");
  }
};

exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await ProgramRegistration.find()
      .sort({ createdAt: -1 });

    res.render("admin/registrations", { registrations });
  } catch (error) {
    console.error("Get registrations error:", error);
    res.status(500).send("Server error");
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 });

    res.render("admin/contact-messages", { messages });
  } catch (error) {
    console.error("Get contact messages error:", error);
    res.status(500).send("Server error");
  }
};

exports.getPrayerRequests = async (req, res) => {
  try {
    const prayerRequests = await PrayerRequest.find()
      .sort({ createdAt: -1 });

    res.render("admin/prayer-requests", { prayerRequests });
  } catch (error) {
    console.error("Get prayer requests error:", error);
    res.status(500).send("Server error");
  }
};