const express = require("express");
const cors = require("cors");
const { tree } = require("./data");

const app = express();
app.use(cors());

app.get("/restaurants", (req, res) => {
  try {
    let { minLat, maxLat, minLng, maxLng } = req.query;

    // 1. Validate input
    if (
      minLat === undefined ||
      maxLat === undefined ||
      minLng === undefined ||
      maxLng === undefined
    ) {
      return res.status(400).json({ error: "Bounds are required" });
    }

    // 2. Convert to numbers
    minLat = parseFloat(minLat);
    maxLat = parseFloat(maxLat);
    minLng = parseFloat(minLng);
    maxLng = parseFloat(maxLng);

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
      return res.status(400).json({ error: "Invalid bounds" });
    }

    // 3. Spatial query (FAST)
    const results = tree.search({
      minX: minLng,
      minY: minLat,
      maxX: maxLng,
      maxY: maxLat,
    });

    // 4. Limit results (protect frontend)
    const MAX_RESULTS = 500;

    const data = results.map((item) => item.restaurant).slice(0, MAX_RESULTS);

    res.json({
      count: data.length,
      truncated: results.length > MAX_RESULTS,
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(5000, () => {
  console.log("GeoStream backend running on port 5000");
});
