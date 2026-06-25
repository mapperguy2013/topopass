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

variable "allowed_http_ipv6_cidr_blocks" {
  description = "Optional IPv6 CIDR blocks allowed to reach HTTP and HTTPS. Leave empty when the VPC is IPv4-only."
  type        = list(string)
  default     = []
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
  description = "Optional Route 53 hosted zone name, for example example.com. Falls back to domain_name when empty."
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Optional Route 53 hosted zone ID. When empty, Terraform looks up route53_zone_name/domain_name."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Optional apex/root app domain name, for example example.com."
  type        = string
  default     = ""
}

variable "enable_route53_records" {
  description = "Whether to create apex, www, and Supabase Route 53 A records pointing to the Elastic IP."
  type        = bool
  default     = false
}

variable "create_route53_record" {
  description = "Deprecated compatibility flag. Prefer enable_route53_records."
  type        = bool
  default     = false
}

variable "supabase_subdomain" {
  description = "Subdomain used for the Supabase gateway record."
  type        = string
  default     = "supabase"
}

variable "backup_retention_days" {
  description = "Number of daily EBS snapshots and S3 backup objects to retain."
  type        = number
  default     = 14
}

variable "backup_bucket_name" {
  description = "Optional S3 bucket name for logical Postgres/storage backups. Leave empty for a generated name."
  type        = string
  default     = ""
}

variable "backup_s3_prefix" {
  description = "S3 key prefix used by backup scripts and IAM scope."
  type        = string
  default     = "topopass"
}

variable "backup_transition_to_ia_days" {
  description = "Optional number of days before S3 backups transition to Standard-IA. Set 0 to disable transition."
  type        = number
  default     = 0
}

variable "cloudwatch_log_retention_days" {
  description = "Retention in days for TopoPass CloudWatch log groups."
  type        = number
  default     = 14
}

variable "alert_email" {
  description = "Optional email address subscribed to production SNS alerts. Leave empty to create the topic without email subscription."
  type        = string
  default     = ""
}

variable "cpu_alarm_threshold_percent" {
  description = "Average CPU percentage that triggers the high CPU alarm."
  type        = number
  default     = 80
}

variable "memory_alarm_threshold_percent" {
  description = "Memory used percentage that triggers the high memory alarm."
  type        = number
  default     = 85
}

variable "disk_alarm_threshold_percent" {
  description = "Disk used percentage that triggers the high disk alarm."
  type        = number
  default     = 85
}

variable "alarm_evaluation_periods" {
  description = "Number of consecutive periods required before production alarms fire."
  type        = number
  default     = 2
}

variable "budget_limit_amount" {
  description = "Monthly AWS Budget limit amount used for cost-protection alerts."
  type        = number
  default     = 20
}

variable "budget_limit_unit" {
  description = "Currency unit for the monthly AWS Budget."
  type        = string
  default     = "USD"
}

variable "budget_alert_email" {
  description = "Optional owner email subscribed to AWS Budget alert SNS notifications."
  type        = string
  default     = ""
}

variable "enable_budget_kill_switch" {
  description = "Whether the 100 percent actual AWS Budget notification should invoke Lambda to stop tagged EC2 instances."
  type        = bool
  default     = false
}

variable "enable_runtime_secrets_manager" {
  description = "Whether to create Secrets Manager metadata for the production runtime app env secret and grant the EC2 role read access."
  type        = bool
  default     = true
}

variable "runtime_secret_name" {
  description = "AWS Secrets Manager secret name for the production runtime dotenv content. Terraform creates metadata only, not the secret value."
  type        = string
  default     = "topopass/production/app-env"

  validation {
    condition     = length(trim(var.runtime_secret_name, " ")) > 0
    error_message = "runtime_secret_name must not be empty."
  }
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
