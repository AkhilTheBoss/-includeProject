const express = require("express");
const { default: mongoose } = require("mongoose");
const userRouter = require("./(api)/routes/user");
const PORT = 3001;
const cors = require("cors");
const connectionString =
  "mongodb+srv://khphan:password1029@balance.rpjud8f.mongodb.net/TestAPiDb";

const app = express();

app.use(cors());
async function connect() {
  try {
    await mongoose.connect(connectionString);
    console.log("Connection with Mongo DB");
  } catch (error) {
    console.log(`Error -> ${error}`);
  }
}

connect();

app.use(express.json());
app.use("/users", userRouter);

app.get("/test", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));
