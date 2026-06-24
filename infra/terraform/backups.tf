data "aws_iam_policy_document" "dlm_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dlm" {
  name               = "${local.name_prefix}-dlm-role"
  assume_role_policy = data.aws_iam_policy_document.dlm_assume_role.json

  tags = {
    Name = "${local.name_prefix}-dlm-role"
  }
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "daily_data_volume_snapshots" {
  description        = "Daily snapshots for ${local.name_prefix} data volume"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]

    target_tags = {
      Backup = "daily"
      Name   = "${local.name_prefix}-data"
    }

    schedule {
      name = "daily-data-volume-snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["02:00"]
      }

      retain_rule {
        count = var.backup_retention_days
      }

      copy_tags = true
    }
  }
}
