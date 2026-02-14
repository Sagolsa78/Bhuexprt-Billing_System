const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

beforeAll(async () => {
  let uri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;

  if (process.env.NODE_ENV === "test") {
    // If using the main URI but in test mode, switch to a test DB
    if (uri.includes("?")) {
      uri = uri.replace(/\/[^/?]+(\?|$)/, "/billing_test$1");
    } else {
      uri = uri.replace(/\/[^/]+$/, "/billing_test");
    }
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// clean up database between tests if needed, or just specific collections
