locals {
  name_prefix = "${var.project_name}-${var.environment}"

  create_network = var.vpc_id == null || var.public_subnet_id == null

  route53_records_enabled = var.enable_route53_records || var.create_route53_record
  domain_name             = trimsuffix(var.domain_name, ".")
  route53_zone_name       = trimsuffix(var.route53_zone_name != "" ? var.route53_zone_name : var.domain_name, ".")
  supabase_domain_name    = local.domain_name == "" ? "" : "${var.supabase_subdomain}.${local.domain_name}"
  route53_zone_id         = var.route53_zone_id != "" ? var.route53_zone_id : try(data.aws_route53_zone.selected[0].zone_id, null)
  backup_bucket_name      = var.backup_bucket_name != "" ? var.backup_bucket_name : "${local.name_prefix}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-backups"
  backup_s3_prefix        = trim(var.backup_s3_prefix, "/")
  alert_actions           = [aws_sns_topic.alerts.arn]
  cloudwatch_log_group_names = toset([
    "/topopass/${var.environment}/user-data",
    "/topopass/${var.environment}/syslog",
    "/topopass/${var.environment}/backups",
    "/topopass/${var.environment}/caddy",
    "/topopass/${var.environment}/deploy"
  ])

  tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.common_tags
  )
}
