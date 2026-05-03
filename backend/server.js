const express = require("express");
const cors = require("cors");
const { tree } = require("./data");

const app = express();
app.use(cors());

app.get("/restaurants", (req, res) => {
  try {
    let { minLat, maxLat, minLng, maxLng } = req.query;

    // 1. Check missing params
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

    // 3. Validate numbers
    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
      return res.status(400).json({ error: "Invalid bounds" });
    }

    // 4. Geo-range validation (NEW)
    if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
      return res.status(400).json({
        error: "Coordinates out of valid range",
      });
    }

    // 5. Spatial query using RBush
    const results = tree.search({
      minX: minLng, // longitude
      minY: minLat, // latitude
      maxX: maxLng,
      maxY: maxLat,
    });

    // 6. Limit results
    const MAX_RESULTS = 500;

    const data = results.map((item) => item.restaurant).slice(0, MAX_RESULTS);

    // 7. Send response
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

// 8. Start server
app.listen(5000, () => {
  console.log("GeoStream backend running on port 5000");
});
