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
  description = "Route 53 record FQDN if created."
  value       = try(aws_route53_record.app[0].fqdn, null)
}

output "ssm_session_command" {
  description = "AWS CLI command to start an SSM Session Manager shell."
  value       = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.aws_region}"
}

output "data_volume_id" {
  description = "Persistent EBS data volume ID."
  value       = aws_ebs_volume.data.id
}

output "ssh_info" {
  description = "SSH status. SSH ingress is disabled unless ssh_cidr_blocks is set."
  value       = length(var.ssh_cidr_blocks) == 0 ? "SSH disabled. Use SSM Session Manager." : "SSH enabled only for configured ssh_cidr_blocks. Prefer SSM Session Manager."
}
