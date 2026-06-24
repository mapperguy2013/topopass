variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "topopass"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region for production infrastructure."
  type        = string
  default     = "eu-west-2"
}

variable "instance_type" {
  description = "EC2 instance type for the single Docker host."
  type        = string
  default     = "t3.small"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 30
}

variable "data_volume_size_gb" {
  description = "Persistent EBS data volume size in GB."
  type        = number
  default     = 50
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to reach HTTP and HTTPS."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_cidr_blocks" {
  description = "Optional CIDR blocks allowed to SSH. Empty disables SSH ingress."
  type        = list(string)
  default     = []
}

variable "key_name" {
  description = "Optional EC2 key pair name. Prefer SSM Session Manager."
  type        = string
  default     = null
}

variable "ecr_registry" {
  description = "Optional ECR registry hostname allowed for app image pulls, for documentation/user_data metadata."
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Optional Route 53 hosted zone name, for example topopass.co.uk."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Optional DNS record name, for example app.topopass.co.uk or topopass.co.uk."
  type        = string
  default     = ""
}

variable "create_route53_record" {
  description = "Whether to create a Route 53 A record pointing to the Elastic IP."
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Number of daily EBS snapshots to retain."
  type        = number
  default     = 7
}

variable "common_tags" {
  description = "Additional tags applied to all supported resources."
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "Optional existing VPC ID. Leave null to create a small VPC."
  type        = string
  default     = null
}

variable "public_subnet_id" {
  description = "Optional existing public subnet ID. Leave null to create one."
  type        = string
  default     = null
}

variable "vpc_cidr_block" {
  description = "CIDR block used when Terraform creates the VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnet_cidr_block" {
  description = "CIDR block used when Terraform creates the public subnet."
  type        = string
  default     = "10.42.1.0/24"
}
