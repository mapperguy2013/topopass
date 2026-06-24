data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "backups" {
  bucket = local.backup_bucket_name

  tags = {
    Name         = local.backup_bucket_name
    BackupTarget = "topopass-logical-backups"
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-topopass-backups"
    status = "Enabled"

    filter {
      prefix = "${local.backup_s3_prefix}/"
    }

    dynamic "transition" {
      for_each = var.backup_transition_to_ia_days > 0 ? [1] : []

      content {
        days          = var.backup_transition_to_ia_days
        storage_class = "STANDARD_IA"
      }
    }

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.backup_retention_days
    }
  }
}

data "aws_iam_policy_document" "backup_bucket_access" {
  statement {
    sid = "ListBackupPrefix"

    actions = [
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.backups.arn
    ]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${local.backup_s3_prefix}/*"]
    }
  }

  statement {
    sid = "ManageBackupObjects"

    actions = [
      "s3:AbortMultipartUpload",
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.backups.arn}/${local.backup_s3_prefix}/*"
    ]
  }
}

resource "aws_iam_role_policy" "backup_bucket_access" {
  name   = "${local.name_prefix}-backup-bucket-access"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.backup_bucket_access.json
}

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
