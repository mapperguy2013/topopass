output "instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Current public IP on the EC2 instance."
  value       = aws_instance.app.public_ip
}

output "elastic_ip" {
  description = "Elastic IP associated with the EC2 instance."
  value       = aws_eip.app.public_ip
}

output "public_dns" {
  description = "EC2 public DNS name."
  value       = aws_instance.app.public_dns
}

output "route53_record_fqdn" {
  description = "Apex Route 53 record FQDN if created."
  value       = try(aws_route53_record.app[0].fqdn, null)
}

output "app_url" {
  description = "Canonical app URL."
  value       = local.domain_name == "" ? null : "https://${local.domain_name}"
}

output "www_url" {
  description = "WWW URL that should redirect to the canonical app URL."
  value       = local.domain_name == "" ? null : "https://www.${local.domain_name}"
}

output "supabase_url" {
  description = "Public Supabase gateway URL."
  value       = local.supabase_domain_name == "" ? null : "https://${local.supabase_domain_name}"
}

output "route53_www_record_fqdn" {
  description = "WWW Route 53 record FQDN if created."
  value       = try(aws_route53_record.www[0].fqdn, null)
}

output "route53_supabase_record_fqdn" {
  description = "Supabase Route 53 record FQDN if created."
  value       = try(aws_route53_record.supabase[0].fqdn, null)
}

output "ssm_session_command" {
  description = "AWS CLI command to start an SSM Session Manager shell."
  value       = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.aws_region}"
}

output "data_volume_id" {
  description = "Persistent EBS data volume ID."
  value       = aws_ebs_volume.data.id
}

output "backup_bucket_name" {
  description = "S3 bucket for logical Postgres and optional storage backups."
  value       = aws_s3_bucket.backups.bucket
}

output "backup_s3_prefix" {
  description = "S3 prefix scoped to the EC2 instance role backup permissions."
  value       = local.backup_s3_prefix
}

output "alerts_topic_arn" {
  description = "SNS topic ARN for production CloudWatch alarms."
  value       = aws_sns_topic.alerts.arn
}

output "budget_alerts_topic_arn" {
  description = "SNS topic ARN for monthly AWS Budget alerts."
  value       = aws_sns_topic.budget_alerts.arn
}

output "budget_kill_switch_lambda_name" {
  description = "Budget kill-switch Lambda name if enabled."
  value       = try(aws_lambda_function.budget_kill_switch[0].function_name, null)
}

output "ssh_info" {
  description = "SSH status. SSH ingress is disabled unless ssh_cidr_blocks is set."
  value       = length(var.ssh_cidr_blocks) == 0 ? "SSH disabled. Use SSM Session Manager." : "SSH enabled only for configured ssh_cidr_blocks. Prefer SSM Session Manager."
}
