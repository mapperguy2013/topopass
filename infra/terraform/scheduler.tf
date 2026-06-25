data "aws_iam_policy_document" "ec2_schedule_assume_role" {
  count = var.enable_ec2_schedule ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_schedule" {
  count = var.enable_ec2_schedule ? 1 : 0

  name               = "${local.name_prefix}-ec2-scheduler-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_schedule_assume_role[0].json

  tags = {
    Name = "${local.name_prefix}-ec2-scheduler-role"
  }
}

data "aws_iam_policy_document" "ec2_schedule" {
  count = var.enable_ec2_schedule ? 1 : 0

  statement {
    sid = "StartStopOnlyTopoPassInstance"

    actions = [
      "ec2:StartInstances",
      "ec2:StopInstances"
    ]

    resources = [
      local.ec2_instance_arn
    ]
  }
}

resource "aws_iam_role_policy" "ec2_schedule" {
  count = var.enable_ec2_schedule ? 1 : 0

  name   = "${local.name_prefix}-ec2-scheduler"
  role   = aws_iam_role.ec2_schedule[0].id
  policy = data.aws_iam_policy_document.ec2_schedule[0].json
}

resource "aws_scheduler_schedule" "stop_ec2" {
  count = var.enable_ec2_schedule ? 1 : 0

  name                         = local.ec2_stop_schedule_name
  description                  = "Stop the ${local.name_prefix} EC2 host daily for cost saving."
  schedule_expression          = local.ec2_stop_cron
  schedule_expression_timezone = var.ec2_schedule_timezone
  state                        = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:stopInstances"
    role_arn = aws_iam_role.ec2_schedule[0].arn

    input = jsonencode({
      InstanceIds = [aws_instance.app.id]
    })
  }
}

resource "aws_scheduler_schedule" "start_ec2" {
  count = var.enable_ec2_schedule ? 1 : 0

  name                         = local.ec2_start_schedule_name
  description                  = "Start the ${local.name_prefix} EC2 host daily before learners use the app."
  schedule_expression          = local.ec2_start_cron
  schedule_expression_timezone = var.ec2_schedule_timezone
  state                        = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:startInstances"
    role_arn = aws_iam_role.ec2_schedule[0].arn

    input = jsonencode({
      InstanceIds = [aws_instance.app.id]
    })
  }
}
