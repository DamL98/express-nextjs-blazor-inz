require("dotenv").config();

const {app} = require("./app");
const PORT = process.env.PORT || 4000;

const server = app.listen(
  PORT, () => {
    console.log(`Backend na porcie: http://localhost:${PORT}`)
  }
);