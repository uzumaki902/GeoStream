const RBush = require("rbush");

const tree = new RBush();

const cities = [
  { name: "Chennai",   lat: 12.97, lng: 80.25 },
  { name: "Mumbai",    lat: 19.07, lng: 72.87 },
  { name: "Kolkata",   lat: 22.57, lng: 88.36 },
  { name: "Bangalore", lat: 12.97, lng: 77.59 },
  { name: "Hyderabad", lat: 17.38, lng: 78.48 },
  { name: "Delhi",     lat: 28.61, lng: 77.20 },
  { name: "Pune",      lat: 18.52, lng: 73.85 },
  { name: "Ahmedabad", lat: 23.02, lng: 72.57 },
];

const indexItems = [];

for (let i = 0; i < 8000; i++) {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const lat  = city.lat + (Math.random() - 0.5) * 0.3;
  const lng  = city.lng + (Math.random() - 0.5) * 0.3;

  const restaurant = {
    id:   i,
    name: `${city.name} Restaurant ${i}`,
    lat,
    lng,
  };

  indexItems.push({
    minX: lng,
    minY: lat,
    maxX: lng,
    maxY: lat,
    restaurant,
  });
}

tree.load(indexItems);

console.log(`RBush index built: ${indexItems.length} restaurants loaded.`);

module.exports = { tree };
