data "aws_route53_zone" "selected" {
  count = var.create_route53_record ? 1 : 0

  name         = var.route53_zone_name
  private_zone = false
}

resource "aws_route53_record" "app" {
  count = var.create_route53_record ? 1 : 0

  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
