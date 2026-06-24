data "archive_file" "budget_kill_switch" {
  type        = "zip"
  source_file = "${path.module}/lambda/budget_kill_switch.py"
  output_path = "${path.module}/.terraform/topopass-budget-kill-switch.zip"
}

resource "aws_sns_topic" "budget_alerts" {
  name = "${local.name_prefix}-budget-alerts"
}

resource "aws_sns_topic_subscription" "budget_email" {
  count = var.budget_alert_email == "" ? 0 : 1

  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "email"
  endpoint  = var.budget_alert_email
}

data "aws_iam_policy_document" "budget_alerts_topic" {
  statement {
    sid = "AllowAwsBudgetsPublish"

    actions = [
      "SNS:Publish"
    ]

    principals {
      type        = "Service"
      identifiers = ["budgets.amazonaws.com"]
    }

    resources = [
      aws_sns_topic.budget_alerts.arn
    ]
  }
}

resource "aws_sns_topic_policy" "budget_alerts" {
  arn    = aws_sns_topic.budget_alerts.arn
  policy = data.aws_iam_policy_document.budget_alerts_topic.json
}

resource "aws_budgets_budget" "monthly_cost" {
  name         = "${local.name_prefix}-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_limit_amount)
  limit_unit   = var.budget_limit_unit
  time_unit    = "MONTHLY"

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 50
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }
}

data "aws_iam_policy_document" "budget_kill_switch_assume_role" {
  count = var.enable_budget_kill_switch ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "budget_kill_switch" {
  count = var.enable_budget_kill_switch ? 1 : 0

  name               = "${local.name_prefix}-budget-kill-switch-role"
  assume_role_policy = data.aws_iam_policy_document.budget_kill_switch_assume_role[0].json

  tags = {
    Name = "${local.name_prefix}-budget-kill-switch-role"
  }
}

data "aws_iam_policy_document" "budget_kill_switch" {
  count = var.enable_budget_kill_switch ? 1 : 0

  statement {
    sid = "DescribeInstances"

    actions = [
      "ec2:DescribeInstances"
    ]

    resources = ["*"]
  }

  statement {
    sid = "StopOnlyTaggedProjectInstances"

    actions = [
      "ec2:StopInstances"
    ]

    resources = [
      "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "ec2:ResourceTag/Project"
      values   = [var.project_name]
    }

    condition {
      test     = "StringEquals"
      variable = "ec2:ResourceTag/Environment"
      values   = [var.environment]
    }
  }

  statement {
    sid = "WriteLambdaLogs"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
    ]
  }
}

resource "aws_iam_role_policy" "budget_kill_switch" {
  count = var.enable_budget_kill_switch ? 1 : 0

  name   = "${local.name_prefix}-budget-kill-switch"
  role   = aws_iam_role.budget_kill_switch[0].id
  policy = data.aws_iam_policy_document.budget_kill_switch[0].json
}

resource "aws_lambda_function" "budget_kill_switch" {
  count = var.enable_budget_kill_switch ? 1 : 0

  function_name    = "${local.name_prefix}-budget-kill-switch"
  role             = aws_iam_role.budget_kill_switch[0].arn
  filename         = data.archive_file.budget_kill_switch.output_path
  source_code_hash = data.archive_file.budget_kill_switch.output_base64sha256
  handler          = "budget_kill_switch.handler"
  runtime          = "python3.12"
  timeout          = 30

  environment {
    variables = {
      ENABLE_KILL_SWITCH = tostring(var.enable_budget_kill_switch)
      PROJECT_TAG        = var.project_name
      ENVIRONMENT_TAG    = var.environment
    }
  }
}

resource "aws_cloudwatch_log_group" "budget_kill_switch" {
  count = var.enable_budget_kill_switch ? 1 : 0

  name              = "/aws/lambda/${aws_lambda_function.budget_kill_switch[0].function_name}"
  retention_in_days = var.cloudwatch_log_retention_days
}

resource "aws_lambda_permission" "allow_budget_sns" {
  count = var.enable_budget_kill_switch ? 1 : 0

  statement_id  = "AllowBudgetSnsInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.budget_kill_switch[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.budget_alerts.arn
}

resource "aws_sns_topic_subscription" "budget_kill_switch" {
  count = var.enable_budget_kill_switch ? 1 : 0

  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.budget_kill_switch[0].arn
}
