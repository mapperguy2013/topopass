export const roadAccessClasses = {
  driveBothWays: "drive_both_ways",
  driveOneWayForward: "drive_one_way_forward",
  driveOneWayReverse: "drive_one_way_reverse",
  noMotorVehicle: "no_motor_vehicle",
  pedestrianOnly: "pedestrian_only",
  serviceOrPrivate: "service_or_private",
  unknown: "unknown"
};

const pedestrianHighways = new Set([
  "footway",
  "path",
  "cycleway",
  "steps",
  "corridor",
  "platform"
]);
const recognisedDrivableHighways = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "unclassified",
  "living_street",
  "service",
  "track"
]);
function hasValue(properties, values) {
  return [
    properties.access,
    properties.vehicle,
    properties.motor_vehicle,
    properties.motorcar
  ].some((value) => values.has(String(value).toLowerCase()));
}

function hasExplicitMotorAllowed(properties) {
  return ["yes", "designated", "permissive"].some(
    (value) =>
      String(properties.motor_vehicle ?? "").toLowerCase() === value ||
      String(properties.motorcar ?? "").toLowerCase() === value
  );
}

export function classifyRoadAccess(properties = {}) {
  const highway = String(properties.highway ?? "").toLowerCase();

  if (pedestrianHighways.has(highway)) {
    return roadAccessClasses.pedestrianOnly;
  }
  if (highway === "pedestrian" && !hasExplicitMotorAllowed(properties)) {
    return roadAccessClasses.pedestrianOnly;
  }
  if (hasValue(properties, new Set(["no"]))) {
    return roadAccessClasses.noMotorVehicle;
  }
  if (hasValue(properties, new Set(["private"]))) {
    return roadAccessClasses.serviceOrPrivate;
  }
  if (
    highway === "service" &&
    ["driveway", "parking_aisle", "alley"].includes(properties.service)
  ) {
    return roadAccessClasses.serviceOrPrivate;
  }
  if (!recognisedDrivableHighways.has(highway) && highway !== "pedestrian") {
    return roadAccessClasses.unknown;
  }

  const oneWay = String(properties.oneway ?? "").toLowerCase();
  if (oneWay === "-1" || oneWay === "reverse") {
    return roadAccessClasses.driveOneWayReverse;
  }
  if (
    oneWay === "yes" ||
    oneWay === "1" ||
    oneWay === "true" ||
    properties.junction === "roundabout"
  ) {
    return roadAccessClasses.driveOneWayForward;
  }
  return roadAccessClasses.driveBothWays;
}

export function isPubliclyDrivable(accessClass) {
  return [
    roadAccessClasses.driveBothWays,
    roadAccessClasses.driveOneWayForward,
    roadAccessClasses.driveOneWayReverse
  ].includes(accessClass);
}
