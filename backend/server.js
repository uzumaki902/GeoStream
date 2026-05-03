const express = require("express");
const cors    = require("cors");
const { tree } = require("./data");

const app = express();
app.use(cors());

const cache          = new Map();
const CACHE_TTL_MS   = 30_000;
const MAX_CACHE_SIZE = 200;
const MAX_RESULTS    = 500;

function cacheKey(minLat, maxLat, minLng, maxLng) {
  return `${minLat.toFixed(3)}|${maxLat.toFixed(3)}|${minLng.toFixed(3)}|${maxLng.toFixed(3)}`;
}

app.get("/restaurants", (req, res) => {
  const reqStart = performance.now();

  try {
    let { minLat, maxLat, minLng, maxLng } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ error: "Bounds are required" });
    }

    minLat = parseFloat(minLat);
    maxLat = parseFloat(maxLat);
    minLng = parseFloat(minLng);
    maxLng = parseFloat(maxLng);

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
      return res.status(400).json({ error: "Invalid bounds" });
    }

    const key    = cacheKey(minLat, maxLat, minLng, maxLng);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      const elapsed = (performance.now() - reqStart).toFixed(2);
      console.log(`[CACHE HIT]  ${key}  | ${cached.payload.count} results | ${elapsed}ms`);
      return res.json(cached.payload);
    }

    const queryStart = performance.now();

    const results = tree.search({
      minX: minLng,
      minY: minLat,
      maxX: maxLng,
      maxY: maxLat,
    });

    const queryMs = (performance.now() - queryStart).toFixed(2);

    const data = results
      .slice(0, MAX_RESULTS)
      .map(({ restaurant: r }) => ({
        id:   r.id,
        name: r.name,
        lat:  r.lat,
        lng:  r.lng,
      }));

    const payload = {
      count:     data.length,
      truncated: results.length > MAX_RESULTS,
      data,
    };

    cache.set(key, { ts: Date.now(), payload });

    if (cache.size > MAX_CACHE_SIZE) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }

    const totalMs = (performance.now() - reqStart).toFixed(2);
    console.log(
      `[CACHE MISS] ${key}  | rbush: ${queryMs}ms | total: ${totalMs}ms | ${data.length}/${results.length} results`
    );

    res.json(payload);
  } catch (err) {
    console.error("[ERROR]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
