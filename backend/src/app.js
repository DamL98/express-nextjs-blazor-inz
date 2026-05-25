const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// app use
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
// end app use



// routes start
app.use("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    }
  })
})




app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "brak wskazanego route",
      message: `endpoint ${req.method} ${req.originalUrl} nie istnieje`,
    },
  });
});
// routes end


module.exports = {
  app
};