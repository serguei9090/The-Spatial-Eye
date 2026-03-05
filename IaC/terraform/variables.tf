variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "spatial-eye"
}

variable "gha_deployer_email" {
  description = "The email of the GitHub Actions deployer service account"
  type        = string
  default     = "github-actions-deployer@gemini-live-agent-487720.iam.gserviceaccount.com"
}
