const express = require("express");
const app = express();
const rank = require("./models/rankings");
app.use(express.json());

app.get("/rank", rank);

app.listen(process.env.PORT || 3000, "0.0.0.0", () =>
  console.log(`Server started on port: ${process.env.PORT || 3000}`)
);
