const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = process.env.PORT || 8080;
const MONGOURL = process.env.MONGOURL;
app.use(express.json());

app.use(
  cors({
    origin:"*",
  })
);

mongoose.connect(MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  passord: String,
});

const User = mongoose.model("User", userSchema);

const taskSchema = new mongoose.Schema({
  text: String,
  status: String,
  priority: String,
  userId: mongoose.Schema.Types.ObjectId,
});

const Task = mongoose.model("Task", taskSchema);

app.post("/register", async (req, res) => {
  const { username, passord } = req.body;
  const hashed = await bcrypt(passord, 10);
  const user = new User({ username, passord: hashed });
  await user.save();
  res.json({ message: "User has been registeres" });
});

app.post("/login", async (req, res) => {
  const { username, passord } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(passord, user.passord))) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }
  const token = jwt.sign({ userId: user._id }, "secret", { expiresIn: "1h" });
  res, json({ token });
});
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Beare", "");
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decode = jwt.verify(token, "secret");
    req.userId = decode.userId;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid Token" });
  }
};
//Get task request
app.get("/task", authMiddleware, async (req, res) => {
  const tasks = await Task.find({ userId });
  res.json(tasks);
});
//Post task request
app.post("/task", authMiddleware, async (req, res) => {
  const task = new Task({ ...req.body, userId: req.userId });
  await task.save();
  res.json(task);
});
//Delete task request
app.delete("/task/:id", authMiddleware, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id.userId });
  res.json({ message: "Task Deleted" });
});
//Update Status if the task
app.patch("/task/:id/status", authMiddleware, async (reqq, res) => {
  const { status } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: reqq.userId },
    { status },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

app.patch("/task/:id/priority", authMiddleware, async (req, res) => {
  const { priority } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: userId },
    { priority },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

app.listen(PORT, () => console.log("Server is running on port:8080"));
