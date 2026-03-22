import express from "express";
var app = express();
const PORT = process.env.PORT ?? 3000;

app.get("/", (req, res) => {
  res.send(
    "backend is running...If you see this without manual deploying, the CI/CD is working",
  );
});

app.listen(PORT, function () {
  console.log(`app listening on port ${PORT}!`);
  console.log(`test the backend locally using: http://localhost:${PORT}`);
});
