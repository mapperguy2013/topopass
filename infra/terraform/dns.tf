data "aws_route53_zone" "selected" {
  count = local.route53_records_enabled && var.route53_zone_id == "" ? 1 : 0

  name         = local.route53_zone_name
  private_zone = false
}

resource "aws_route53_record" "app" {
  count = local.route53_records_enabled ? 1 : 0

  zone_id = local.route53_zone_id
  name    = local.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

resource "aws_route53_record" "www" {
  count = local.route53_records_enabled ? 1 : 0

  zone_id = local.route53_zone_id
  name    = "www.${local.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

resource "aws_route53_record" "supabase" {
  count = local.route53_records_enabled ? 1 : 0

  zone_id = local.route53_zone_id
  name    = local.supabase_domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
