resource "aws_secretsmanager_secret" "runtime_app_env" {
  count = var.enable_runtime_secrets_manager ? 1 : 0

  name                    = var.runtime_secret_name
  description             = "TopoPass production runtime dotenv content for the app container. Secret value is added manually outside Terraform."
  recovery_window_in_days = 7

  tags = {
    Name                = "${local.name_prefix}-runtime-app-env"
    ContainsSecrets     = "metadata-only"
    TerraformSecretFree = "true"
  }
}
