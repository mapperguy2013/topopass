export function createMapProjection(config) {
  const { width, height, padding, bounds } = config;
  const middleLatitude = (bounds.south + bounds.north) / 2;
  const longitudeScale = Math.cos((middleLatitude * Math.PI) / 180);
  const sourceWidth = (bounds.east - bounds.west) * longitudeScale;
  const sourceHeight = bounds.north - bounds.south;
  const scale = Math.min(
    (width - padding * 2) / sourceWidth,
    (height - padding * 2) / sourceHeight
  );
  const mapContentWidth = sourceWidth * scale;
  const mapContentHeight = sourceHeight * scale;
  const offsetX = (width - mapContentWidth) / 2;
  const offsetY = (height - mapContentHeight) / 2;

  return function project([longitude, latitude]) {
    return [
      offsetX + (longitude - bounds.west) * longitudeScale * scale,
      offsetY + (bounds.north - latitude) * scale
    ];
  };
}
