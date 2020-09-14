const express = require("express");
const app = express();
const rank = require("./models/rankings");

app.use("/rank", rank);

app.use((req, res) => {
  res.send({ status: 404, message: "Not found" });
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () =>
  console.log(`Server started on port: ${process.env.PORT || 3000}`)
);
