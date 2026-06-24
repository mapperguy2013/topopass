import json
import os
import re

import boto3

ec2 = boto3.client("ec2")


def should_stop_from_message(message: str) -> bool:
    try:
        parsed = json.loads(message)
    except json.JSONDecodeError:
        parsed = None

    if isinstance(parsed, dict):
        notification_type = str(
            parsed.get("notificationType")
            or parsed.get("NotificationType")
            or parsed.get("notification_type")
            or ""
        ).upper()
        threshold = parsed.get("threshold") or parsed.get("Threshold") or 0
        try:
            threshold_value = float(threshold)
        except (TypeError, ValueError):
            threshold_value = 0
        return notification_type == "ACTUAL" and threshold_value >= 100

    lower_message = message.lower()
    if "actual" not in lower_message:
        return False

    threshold_match = re.search(r"threshold[^0-9]*(\d+(?:\.\d+)?)", lower_message)
    if threshold_match:
        return float(threshold_match.group(1)) >= 100

    return bool(re.search(r"\b100(?:\.0+)?\s*%", lower_message))


def running_topopass_instances(project: str, environment: str) -> list[str]:
    response = ec2.describe_instances(
        Filters=[
            {"Name": "tag:Project", "Values": [project]},
            {"Name": "tag:Environment", "Values": [environment]},
            {"Name": "instance-state-name", "Values": ["running"]},
        ]
    )

    instance_ids: list[str] = []
    for reservation in response.get("Reservations", []):
        for instance in reservation.get("Instances", []):
            instance_id = instance.get("InstanceId")
            if instance_id:
                instance_ids.append(instance_id)
    return instance_ids


def handler(event, _context):
    project = os.environ.get("PROJECT_TAG", "topopass")
    environment = os.environ.get("ENVIRONMENT_TAG", "production")
    enabled = os.environ.get("ENABLE_KILL_SWITCH", "false").lower() == "true"

    stop_requested = False
    for record in event.get("Records", []):
        message = record.get("Sns", {}).get("Message", "")
        if should_stop_from_message(message):
            stop_requested = True

    if not stop_requested:
        print("Budget message received; no stop action required.")
        return {"stopped": [], "reason": "threshold_not_matched"}

    if not enabled:
        print("Budget kill switch is disabled; no stop action taken.")
        return {"stopped": [], "reason": "disabled"}

    instance_ids = running_topopass_instances(project, environment)
    if not instance_ids:
        print("No running tagged EC2 instances found.")
        return {"stopped": [], "reason": "no_matching_instances"}

    ec2.stop_instances(InstanceIds=instance_ids)
    print(f"Stopped {len(instance_ids)} tagged EC2 instance(s).")
    return {"stopped": instance_ids, "reason": "budget_threshold"}
