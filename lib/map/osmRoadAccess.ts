export const roadAccessClasses = {
  driveBothWays: "drive_both_ways",
  driveOneWayForward: "drive_one_way_forward",
  driveOneWayReverse: "drive_one_way_reverse",
  noMotorVehicle: "no_motor_vehicle",
  pedestrianOnly: "pedestrian_only",
  serviceOrPrivate: "service_or_private",
  unknown: "unknown"
} as const;

export type RoadAccessClass =
  (typeof roadAccessClasses)[keyof typeof roadAccessClasses];

export type OsmRoadProperties = Record<string, unknown> & {
  highway?: unknown;
  name?: unknown;
  oneway?: unknown;
  access?: unknown;
  vehicle?: unknown;
  motor_vehicle?: unknown;
  motorcar?: unknown;
  service?: unknown;
  junction?: unknown;
  barrier?: unknown;
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

function stringValue(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function hasAnyAccessValue(
  properties: OsmRoadProperties,
  values: Set<string>
) {
  return [
    properties.access,
    properties.vehicle,
    properties.motor_vehicle,
    properties.motorcar
  ].some((value) => values.has(stringValue(value)));
}

function hasExplicitMotorAllowed(properties: OsmRoadProperties) {
  return ["yes", "designated", "permissive"].some(
    (value) =>
      stringValue(properties.motor_vehicle) === value ||
      stringValue(properties.motorcar) === value
  );
}

export function classifyRoadAccess(
  properties: OsmRoadProperties = {}
): RoadAccessClass {
  const highway = stringValue(properties.highway);

  if (pedestrianHighways.has(highway)) {
    return roadAccessClasses.pedestrianOnly;
  }

  if (highway === "pedestrian" && !hasExplicitMotorAllowed(properties)) {
    return roadAccessClasses.pedestrianOnly;
  }

  if (hasAnyAccessValue(properties, new Set(["no"]))) {
    return roadAccessClasses.noMotorVehicle;
  }

  if (hasAnyAccessValue(properties, new Set(["private"]))) {
    return roadAccessClasses.serviceOrPrivate;
  }

  if (
    highway === "service" &&
    ["driveway", "parking_aisle", "alley"].includes(
      stringValue(properties.service)
    )
  ) {
    return roadAccessClasses.serviceOrPrivate;
  }

  if (!recognisedDrivableHighways.has(highway) && highway !== "pedestrian") {
    return roadAccessClasses.unknown;
  }

  const oneWay = stringValue(properties.oneway);
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

export function isPubliclyDrivable(accessClass: RoadAccessClass) {
  const drivableClasses: RoadAccessClass[] = [
    roadAccessClasses.driveBothWays,
    roadAccessClasses.driveOneWayForward,
    roadAccessClasses.driveOneWayReverse
  ];

  return drivableClasses.includes(accessClass);
}
