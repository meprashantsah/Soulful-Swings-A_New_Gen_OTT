const mongoose = require("mongoose");

const Connection = async (username, password) => {
  const URL = "mongodb+srv://testuser:Bangalore123@cluster0.382bm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  try {
    await mongoose.connect(URL, { useNewUrlParser: true });
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error while connecting to the database ", error);
  }
};

module.exports = Connection;
