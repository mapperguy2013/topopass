locals {
  name_prefix = "${var.project_name}-${var.environment}"

  create_network = var.vpc_id == null || var.public_subnet_id == null

  route53_records_enabled = var.enable_route53_records || var.create_route53_record
  domain_name             = trimsuffix(var.domain_name, ".")
  route53_zone_name       = trimsuffix(var.route53_zone_name != "" ? var.route53_zone_name : var.domain_name, ".")
  supabase_domain_name    = local.domain_name == "" ? "" : "${var.supabase_subdomain}.${local.domain_name}"
  route53_zone_id         = var.route53_zone_id != "" ? var.route53_zone_id : try(data.aws_route53_zone.selected[0].zone_id, null)

  tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.common_tags
  )
}
