resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "TopoPass single-host web access"
  vpc_id      = local.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
  }

  dynamic "ingress" {
    for_each = length(var.allowed_http_ipv6_cidr_blocks) > 0 ? [1] : []

    content {
      description      = "HTTP IPv6"
      from_port        = 80
      to_port          = 80
      protocol         = "tcp"
      ipv6_cidr_blocks = var.allowed_http_ipv6_cidr_blocks
    }
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
  }

  dynamic "ingress" {
    for_each = length(var.allowed_http_ipv6_cidr_blocks) > 0 ? [1] : []

    content {
      description      = "HTTPS IPv6"
      from_port        = 443
      to_port          = 443
      protocol         = "tcp"
      ipv6_cidr_blocks = var.allowed_http_ipv6_cidr_blocks
    }
  }

  dynamic "ingress" {
    for_each = toset(var.ssh_cidr_blocks)

    content {
      description = "Optional restricted SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "Outbound access for updates, ECR pulls, SSM, and CloudWatch"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description      = "Outbound IPv6 access when IPv6 is available"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${local.name_prefix}-app-sg"
  }
}
