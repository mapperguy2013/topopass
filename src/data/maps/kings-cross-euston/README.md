# King's Cross / Euston map data

The source of truth is the real OpenStreetMap export at
`public/maps/kings-cross-euston/osm-raw.geojson`. The map renderer and route
graph generator both consume that same file. Do not hand-edit or invent road
geometry in generated outputs.

Regenerate the SVG and hidden graph with:

```powershell
npm.cmd run map:build:kings-cross-euston
```

The renderer deliberately ignores bus stops, amenities, shops, tourism POIs,
footways, steps, cycleways, and paths. OpenStreetMap attribution must remain on
the generated SVG and in the route demo.
