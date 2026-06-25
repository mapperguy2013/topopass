import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("health endpoint returns a minimal safe app status", () => {
  const source = read("app/api/health/route.ts");

  assert.match(source, /status:\s*"ok"/);
  assert.match(source, /service:\s*"topopass"/);
  assert.match(source, /timestamp:/);
  assert.doesNotMatch(source, /process\.env|SUPABASE|DATABASE|PASSWORD|SECRET/i);
});

test("production compose checks health and exposes only HTTP in temporary IP mode", () => {
  const compose = read("deploy/docker-compose.prod.yml");

  assert.match(compose, /\/api\/health/);
  assert.match(compose, /caddy:2\.8-alpine/);
  assert.match(compose, /"80:80"/);
  assert.doesNotMatch(compose, /^\s*-\s*"443:443"/m);
  assert.doesNotMatch(compose, /^\s*-\s*"443:443\/udp"/m);
  assert.match(compose, /expose:\s*\n\s*-\s*"3000"/);
  assert.doesNotMatch(compose, /"3000:3000"|"5432:5432"|"8000:8000"|"54321:54321"|"54322:54322"/);
});

test("backup scripts use S3 and do not print database passwords", () => {
  const postgres = read("infra/backups/backup-postgres.sh");
  const verify = read("infra/backups/verify-latest-backup.sh");

  assert.match(postgres, /pg_dump -Fc/);
  assert.match(postgres, /aws s3 cp/);
  assert.match(postgres, /BACKUP_S3_BUCKET/);
  assert.match(verify, /aws s3api head-object/);
  assert.doesNotMatch(postgres, /echo .*POSTGRES_PASSWORD|printf .*POSTGRES_PASSWORD/);
});

test("terraform provisions private encrypted backup storage and alerting", () => {
  const backups = read("infra/terraform/backups.tf");
  const monitoring = read("infra/terraform/monitoring.tf");
  const iam = read("infra/terraform/iam.tf");
  const budget = read("infra/terraform/budget.tf");
  const lambda = read("infra/terraform/lambda/budget_kill_switch.py");

  assert.match(backups, /aws_s3_bucket" "backups/);
  assert.match(backups, /aws_s3_bucket_public_access_block/);
  assert.match(backups, /aws_s3_bucket_server_side_encryption_configuration/);
  assert.match(backups, /aws_s3_bucket_lifecycle_configuration/);
  assert.match(backups, /s3:PutObject/);
  assert.match(monitoring, /aws_cloudwatch_log_group/);
  assert.match(monitoring, /aws_cloudwatch_metric_alarm/);
  assert.match(monitoring, /aws_sns_topic/);
  assert.match(iam, /CloudWatchAgentServerPolicy/);
  assert.match(budget, /aws_budgets_budget" "monthly_cost/);
  assert.match(budget, /threshold\s+=\s+50/);
  assert.match(budget, /notification_type\s+=\s+"FORECASTED"/);
  assert.match(budget, /threshold\s+=\s+100/);
  assert.match(budget, /ec2:StopInstances/);
  assert.match(budget, /ec2:ResourceTag\/Project/);
  assert.match(budget, /ec2:ResourceTag\/Environment/);
  assert.doesNotMatch(budget, /TerminateInstances|DeleteVolume|DeleteSnapshot|DeleteHostedZone|DeleteRepository|DeleteSecret/);
  assert.match(lambda, /stop_instances/);
  assert.match(lambda, /tag:Project/);
  assert.match(lambda, /tag:Environment/);
});

test("monitoring and backup files avoid Supabase service keys and legacy tables", () => {
  const combined = [
    read("infra/backups/backup-postgres.sh"),
    read("infra/backups/backup-storage.sh"),
    read("infra/backups/verify-latest-backup.sh"),
    read("infra/monitoring/cloudwatch-agent.json"),
    read("infra/terraform/backups.tf"),
    read("infra/terraform/monitoring.tf"),
    read("infra/terraform/budget.tf"),
    read("infra/terraform/lambda/budget_kill_switch.py"),
  ].join("\n");

  const forbidden = new RegExp(
    [
      "SUPABASE_" + "SERVICE",
      "SERVICE_" + "ROLE_KEY",
      "supabase.*service[_-]?role",
      "mock_test_attempts",
      "mock_test_answers",
      "\\bquestions\\s*=",
    ].join("|"),
    "i",
  );

  assert.doesNotMatch(combined, forbidden);
});
