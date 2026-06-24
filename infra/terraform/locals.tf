locals {
  name_prefix = "${var.project_name}-${var.environment}"

  create_network = var.vpc_id == null || var.public_subnet_id == null

  tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.common_tags
  )
}
