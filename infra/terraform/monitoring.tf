resource "aws_cloudwatch_log_group" "topopass" {
  for_each = local.cloudwatch_log_group_names

  name              = each.value
  retention_in_days = var.cloudwatch_log_retention_days
}

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
}

resource "aws_sns_topic_subscription" "alert_email" {
  count = var.alert_email == "" ? 0 : 1

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check_failed" {
  alarm_name          = "${local.name_prefix}-ec2-status-check-failed"
  alarm_description   = "EC2 status checks are failing for the TopoPass production host."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alert_actions
  ok_actions          = local.alert_actions

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu"
  alarm_description   = "Average CPU is above ${var.cpu_alarm_threshold_percent}% on the TopoPass production host."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold_percent
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alert_actions
  ok_actions          = local.alert_actions

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${local.name_prefix}-high-memory"
  alarm_description   = "Memory usage is above ${var.memory_alarm_threshold_percent}% on the TopoPass production host."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "mem_used_percent"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold_percent
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alert_actions
  ok_actions          = local.alert_actions

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

resource "aws_cloudwatch_metric_alarm" "high_disk" {
  alarm_name          = "${local.name_prefix}-high-disk"
  alarm_description   = "Root disk usage is above ${var.disk_alarm_threshold_percent}% on the TopoPass production host."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "disk_used_percent"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = var.disk_alarm_threshold_percent
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alert_actions
  ok_actions          = local.alert_actions

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}
