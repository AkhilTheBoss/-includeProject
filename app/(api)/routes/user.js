const express = require("express");
const User = require("../_models/user");
const router = express.Router();
const jwt = require("jsonwebtoken");
const moment = require("moment");

router.post("/login", (req, res) => {
  // Authentication
  const username = req.body.username;
  const user = { name: username };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  res.json({ accessToken: accessToken });
});

router.get("/", async (req, res) => {
  try {
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
    const topThreeCostlyObjects = await User.find({
      token: req.headers.authorization.split(" ")[1],
      category: "expense",
    })
      .sort({ cost: -1 })
      .limit(4);

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
    const result = await user.save();
    console.log("Saved user:", result);
    res.json(result);
  } catch (error) {
    res.send(`Some error occured => ${error}`);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type, date, cost, category } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, type, date, cost, category },
      { new: true },
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
      {
        $match: {
          token: req.headers.authorization.split(" ")[1],
          category: "income",
        },
      },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]);

    const incomeTotal = totalIncome.length > 0 ? totalIncome[0].total : 0;
    console.log("incomeTotal :", incomeTotal);

    res.status(200).json(incomeTotal);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// outcome
router.get("/total-outcome", async (req, res) => {
  try {
    const totalOutcome = await User.aggregate([
      {
        $match: {
          token: req.headers.authorization.split(" ")[1],
          category: "expense",
        },
      },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]);

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
      {
        $match: {
          token: req.headers.authorization.split(" ")[1],
          category: "income",
        },
      },
      { $group: { _id: null, totalIncome: { $sum: "$cost" } } },
    ]);

    const totalOutcome = await User.aggregate([
      {
        $match: {
          token: req.headers.authorization.split(" ")[1],
          category: "expense",
        },
      },
      { $group: { _id: null, totalOutcome: { $sum: "$cost" } } },
    ]);

    const income = totalIncome.length > 0 ? totalIncome[0].totalIncome : 0;
    const outcome = totalOutcome.length > 0 ? totalOutcome[0].totalOutcome : 0;

    const balance = income - outcome;
    console.log("balance: ", balance);
    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get types of outcomes and their total value
router.get("/outcome-types", async (req, res) => {
  try {
    const outcomeTypes = [
      "food",
      "academics",
      "personal care",
      "housing",
      "travel",
      "misc",
    ];

    const typeTotals = {};
    for (const type of outcomeTypes) {
      const total = await User.aggregate([
        {
          $match: {
            token: req.headers.authorization.split(" ")[1],
            category: "expense",
            type
          },
        },
        { $group: { _id: null, total: { $sum: "$cost" } } },
      ]);
      typeTotals[type] = total.length > 0 ? total[0].total : 0;
    }

    const totalOutcome = await User.aggregate([
      {
        $match: {
          token: req.headers.authorization.split(" ")[1],
          category: "expense",
        },
      },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]);
    const totalOutcomeValue = totalOutcome.length > 0 ? totalOutcome[0].total : 0;

    const percentages = {};
    for (const type of outcomeTypes) {
      if (totalOutcomeValue !== 0) {
        percentages[type] = (
          (typeTotals[type] / totalOutcomeValue) *
          100
        ).toFixed(2);
      } else {
        percentages[type] = "0.00";
      }
    }

    res.status(200).json({ outcomeTypes, typeTotals, percentages });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/expenses-by-week", async (req, res) => {
  try {
    const today = moment();
    const startDate = today.clone().startOf("week");

    const labels = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const data = Array(7).fill(0);

    const allExpenses = await User.find({
      token: req.headers.authorization.split(" ")[1],
      category: "expense"
    });

    for (let i = 0; i < 7; i++) {
      const currentDate = startDate.clone().add(i, "days").format("YYYY-MM-DD");

      const expensesForDay = allExpenses.filter((expense) => {
        return moment(expense.date).format("YYYY-MM-DD") === currentDate;
      });

      const totalExpensesForDay = expensesForDay.reduce((total, expense) => {
        return total + expense.cost;
      }, 0);

      data[i] = totalExpensesForDay;
    }

    res.status(200).json({ labels, data });
  } catch (error) {
    console.error("Error fetching expenses by week:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
