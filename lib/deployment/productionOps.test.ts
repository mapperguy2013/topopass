import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("health endpoint returns a minimal safe app status", () => {
  const source = read("app/api/health/route.ts");

  assert.match(source, /ok:\s*true/);
  assert.match(source, /service:\s*"topopass"/);
  assert.match(source, /timestamp:/);
  assert.doesNotMatch(source, /process\.env|SUPABASE|DATABASE|PASSWORD|SECRET/i);
});

test("production compose checks health and exposes only HTTP in temporary IP mode", () => {
  const compose = read("deploy/docker-compose.prod.yml");
  const caddyfile = read("deploy/Caddyfile");
  const proxyEnvExample = read("deploy/env/proxy.env.example");
  const securityGroup = read("infra/terraform/security.tf");
  const ec2 = read("infra/terraform/ec2.tf");

  assert.match(compose, /\/api\/health/);
  assert.match(compose, /caddy:2\.8-alpine/);
  assert.match(compose, /"80:80"/);
  assert.doesNotMatch(compose, /^\s*-\s*"443:443"/m);
  assert.doesNotMatch(compose, /^\s*-\s*"443:443\/udp"/m);
  assert.match(compose, /expose:\s*\n\s*-\s*"3000"/);
  assert.doesNotMatch(compose, /"3000:3000"|"5432:5432"|"8000:8000"|"54321:54321"|"54322:54322"/);
  assert.match(caddyfile, /\{\$APP_DOMAIN::80\}/);
  assert.match(caddyfile, /reverse_proxy app:3000/);
  assert.doesNotMatch(caddyfile, /redir https|reverse_proxy kong:8000/);
  assert.match(proxyEnvExample, /APP_DOMAIN=:80/);
  assert.doesNotMatch(proxyEnvExample, /^WWW_DOMAIN=|^SUPABASE_DOMAIN=/m);
  assert.match(securityGroup, /from_port\s+=\s+80/);
  assert.doesNotMatch(securityGroup, /from_port\s+=\s+443/);
  assert.match(ec2, /ignore_changes\s+=\s+\[ami\]/);
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

test("runtime env fetch requires Supabase auth config without printing values", () => {
  const fetchRuntimeEnv = read("infra/deploy/fetch-runtime-env.sh");
  const deploymentDocs = read("docs/aws-ec2-devops-deployment.md");
  const terraformDocs = read("infra/terraform/README.md");
  const ecrWorkflow = read(".github/workflows/docker-publish-ecr.yml");

  assert.match(fetchRuntimeEnv, /validate_required_runtime_keys/);
  assert.match(fetchRuntimeEnv, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(fetchRuntimeEnv, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(fetchRuntimeEnv, /Required runtime env key .* is missing or blank/);
  assert.doesNotMatch(fetchRuntimeEnv, /cat "\$APP_ENV_FILE"|echo .*\$NEXT_PUBLIC_SUPABASE/);

  assert.match(deploymentDocs, /Supabase authentication requires/);
  assert.match(deploymentDocs, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(deploymentDocs, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(deploymentDocs, /missing-or-blank/);
  assert.match(terraformDocs, /Supabase authentication requires/);
  assert.match(ecrWorkflow, /Validate public build config/);
  assert.match(ecrWorkflow, /NEXT_PUBLIC_SUPABASE_URL GitHub repository variable is required/);
  assert.match(ecrWorkflow, /NEXT_PUBLIC_SUPABASE_ANON_KEY GitHub repository secret is required/);
});

test("Mapbox public token is wired into production builds without runtime browser env gates", () => {
  const dockerfile = read("Dockerfile");
  const ecrWorkflow = read(".github/workflows/docker-publish-ecr.yml");
  const deploymentDocs = read("docs/aws-ec2-devops-deployment.md");
  const mapboxConfig = read("lib/mapbox/config.ts");
  const mapClickQuestion = read("src/components/questions/MapClickQuestion.tsx");
  const mapReview = read("src/components/progress/MapClickAnswerReview.tsx");
  const mapView = read("components/map/MapView.tsx");
  const adminPicker = read("src/components/admin/AdminCoordinatePicker.tsx");

  assert.match(ecrWorkflow, /NEXT_PUBLIC_MAPBOX_TOKEN GitHub repository variable is required/);
  assert.match(ecrWorkflow, /--build-arg NEXT_PUBLIC_MAPBOX_TOKEN=/);
  assert.match(dockerfile, /ARG NEXT_PUBLIC_MAPBOX_TOKEN=""/);
  assert.match(dockerfile, /ENV NEXT_PUBLIC_MAPBOX_TOKEN=\$NEXT_PUBLIC_MAPBOX_TOKEN/);
  assert.match(deploymentDocs, /NEXT_PUBLIC_MAPBOX_TOKEN/);
  assert.match(deploymentDocs, /runtime env alone will not change already-built client chunks/);

  assert.match(mapboxConfig, /publicMapboxConfig/);
  assert.match(mapboxConfig, /process\.env\.NEXT_PUBLIC_MAPBOX_TOKEN/);
  assert.match(mapboxConfig, /getMapboxPublicConfig/);
  assert.match(mapboxConfig, /hasMapboxPublicConfig/);

  for (const source of [mapClickQuestion, mapReview, mapView, adminPicker]) {
    assert.match(source, /getMapboxPublicConfig/);
    assert.doesNotMatch(source, /process\.env\.NEXT_PUBLIC_MAPBOX_TOKEN/);
  }
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
