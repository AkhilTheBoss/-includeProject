const express = require("express");
const User = require("../models/user");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/login", (req, res) => {
  // Authentication
  const username = req.body.username;
  const user = { name: username };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  res.json({ accessToken: accessToken });
});

router.get("/", async (req, res) => {
  try {
    // console.log("REQ:", req.headers.authorization);
    const users = await User.find({
      token: req.headers.authorization.split(" ")[1],
      category: "expense",
    });
    res.status(200).json(users);
  } catch (error) {
    res.send(`Some error occurred => ${error}`);
  }
});

router.get("/income", async (req, res) => {
  try {
    const users = await User.find({
      token: req.headers.authorization.split(" ")[1],
      category: "income",
    });
    res.status(200).json(users);
  } catch (error) {
    res.send(`Some error occurred => ${error}`);
  }
});

router.get("/top-four-costly-expense", async (req, res) => {
  try {
    // Find the top three most costly objects
    const topThreeCostlyObjects = await User.find({
      token: req.headers.authorization.split(" ")[1],
      category: "expense",
    })
      .sort({ cost: -1 }) // Sort in descending order based on 'cost'
      .limit(4); // Limit to the top three results

    res.json(topThreeCostlyObjects);
  } catch (error) {
    console.error("Error retrieving top three costly objects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  // console.log(:hi)
  console.log("req.body1:", req.body);
  const user = new User({
    token: req.body.token,
    name: req.body.name,
    type: req.body.type,
    date: req.body.date,
    cost: req.body.cost,
    category: req.body.category,
  });

  try {
    // console.log("Hi");
    const result = await user.save();
    console.log("Saved user:", result); // Log the saved user
    res.json(result);
  } catch (error) {
    // console.log("bye");
    res.send(`Some error occured => ${error}`);
  }
});

router.put("/:id", async (req, res) => {
  // console.log("ID");
  const { id } = req.params;
  const { name, type, date, cost, category } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, type, date, cost, category },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// income
router.get("/total-income", async (req, res) => {
  try {
    const totalIncome = await User.aggregate([
      { $match: { category: "income" } },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]);

    // Check if totalIncome array is empty
    const incomeTotal = totalIncome.length > 0 ? totalIncome[0].total : 0;

    res.status(200).json(incomeTotal);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// outcome
router.get("/total-outcome", async (req, res) => {
  try {
    const totalOutcome = await User.aggregate([
      { $match: { category: "expense" } },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]);

    // Check if totalOutcome array is empty
    const outcomeTotal = totalOutcome.length > 0 ? totalOutcome[0].total : 0;

    res.status(200).json(outcomeTotal);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// bal
router.get("/total-balance", async (req, res) => {
  try {
    const totalIncome = await User.aggregate([
      { $match: { category: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$cost" } } },
    ]);

    const totalOutcome = await User.aggregate([
      { $match: { category: "expense" } },
      { $group: { _id: null, totalOutcome: { $sum: "$cost" } } },
    ]);

    // Check if totalIncome or totalOutcome arrays are empty
    const income = totalIncome.length > 0 ? totalIncome[0].totalIncome : 0;
    const outcome = totalOutcome.length > 0 ? totalOutcome[0].totalOutcome : 0;

    // Calculate balance
    const balance = income - outcome;
    console.log("balance: ", balance);
    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
