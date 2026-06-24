import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyRoadAccess,
  roadAccessClasses
} from "./osmRoadAccess.ts";

test("classifyRoadAccess identifies normal two-way drivable roads", () => {
  assert.equal(
    classifyRoadAccess({ highway: "residential", name: "Judd Street" }),
    roadAccessClasses.driveBothWays
  );
});

test("classifyRoadAccess identifies one-way forward roads", () => {
  assert.equal(
    classifyRoadAccess({ highway: "primary", oneway: "yes" }),
    roadAccessClasses.driveOneWayForward
  );
  assert.equal(
    classifyRoadAccess({ highway: "secondary", junction: "roundabout" }),
    roadAccessClasses.driveOneWayForward
  );
});

test("classifyRoadAccess identifies reverse one-way roads", () => {
  assert.equal(
    classifyRoadAccess({ highway: "tertiary", oneway: "-1" }),
    roadAccessClasses.driveOneWayReverse
  );
});

test("classifyRoadAccess identifies pedestrian-only ways", () => {
  assert.equal(
    classifyRoadAccess({ highway: "footway" }),
    roadAccessClasses.pedestrianOnly
  );
  assert.equal(
    classifyRoadAccess({ highway: "pedestrian", access: "yes" }),
    roadAccessClasses.pedestrianOnly
  );
});

test("classifyRoadAccess allows pedestrian highway only when motor access is explicit", () => {
  assert.equal(
    classifyRoadAccess({ highway: "pedestrian", motor_vehicle: "yes" }),
    roadAccessClasses.driveBothWays
  );
});

test("classifyRoadAccess identifies no motor vehicle restrictions", () => {
  assert.equal(
    classifyRoadAccess({ highway: "residential", motor_vehicle: "no" }),
    roadAccessClasses.noMotorVehicle
  );
});

test("classifyRoadAccess identifies private and service roads", () => {
  assert.equal(
    classifyRoadAccess({ highway: "service", service: "parking_aisle" }),
    roadAccessClasses.serviceOrPrivate
  );
  assert.equal(
    classifyRoadAccess({ highway: "service", access: "private" }),
    roadAccessClasses.serviceOrPrivate
  );
});

test("classifyRoadAccess treats unknown highways as neutral unknown, not restricted", () => {
  assert.equal(
    classifyRoadAccess({ highway: "construction" }),
    roadAccessClasses.unknown
  );
});
