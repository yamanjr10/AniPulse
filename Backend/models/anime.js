const mongoose = require("mongoose");

const AnimeSchema = new mongoose.Schema({
  userId: String,
  title: String,
  status: String,
});

module.exports = mongoose.model("Anime", AnimeSchema);
