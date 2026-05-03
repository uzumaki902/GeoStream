const RBush = require("rbush");

const tree = new RBush();

const indexItems = [];

// simulate dense city dataset
for (let i = 0; i < 5000; i++) {
  const lat = 12.9 + Math.random() * 0.25;
  const lng = 80.2 + Math.random() * 0.25;

  const restaurant = {
    id: i,
    name: `Restaurant ${i}`,
    lat,
    lng,
  };

  indexItems.push({
    minX: lng, // longitude
    minY: lat, // latitude
    maxX: lng,
    maxY: lat,
    restaurant,
  });
}

// Bulk load (IMPORTANT for performance)
tree.load(indexItems);

module.exports = { tree };
