const mongoose = require("mongoose");
require("dotenv").config();
mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URL, {
    usenewurlparser: true,
    useunifiedtopology: true,
  })
  .then(() => {
    console.log("Successfully db connected ");
  })
  .catch((error) => {
    console.log(`can not connect to database, ${error}`);
  });

module.exports = mongoose;
