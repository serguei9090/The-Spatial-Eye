terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Artifact Registry Repository
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "${var.service_name}-repo"
  description   = "Docker repository for ${var.service_name}"
  format        = "DOCKER"

  # CLEANUP POLICY: Keep only the single most recent image to stay within free tier/storage limits.
  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-latest-only"
    action = "KEEP"
    most_recent_versions {
      keep_count = 1
    }
  }

  cleanup_policies {
    id     = "delete-old-images"
    action = "DELETE"
    condition {
      tag_state = "ANY"
    }
  }
}

# 2. Unified Cloud Run Service (v2)
# Terraform will CREATE this once you run 'apply'.
resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    timeout          = "3600s"
    session_affinity = true
    max_instance_request_concurrency = 80

    containers {
      # This points to the image that GitHub Actions will eventually push
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}-repo/${var.service_name}:latest"
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "DEBUG"
        value = "false"
      }

      env {
        name  = "FIREBASE_ADMIN_CLIENT_EMAIL"
        value = "firebase-adminsdk-fbsvc@gemini-live-agent-487720.iam.gserviceaccount.com"
      }

      env {
        name  = "FIREBASE_ADMIN_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "NEXT_PUBLIC_GEMINI_LIVE_MODEL"
        value = "gemini-2.5-flash-native-audio-preview-12-2025"
      }

      env {
        name = "FIREBASE_ADMIN_PRIVATE_KEY"
        value_source {
          secret_key_ref {
            secret  = "FIREBASE_ADMIN_PRIVATE_KEY"
            version = "latest"
          }
        }
      }

      env {
        name = "GOOGLE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "GOOGLE_API_KEY"
            version = "latest"
          }
        }
      }
      
      ports {
        container_port = 3000
      }
      
      resources {
        limits = {
          cpu    = "2000m"
          memory = "2Gi"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image, # Let GHA manage the image tag
      template[0].labels,              # Don't delete GHA commit labels
      client,                          # Ignore "gcloud -> null" change
      client_version,                  # Ignore "557.0.0 -> null" change
    ]
  }
}

# 3. Allow Public (Unauthenticated) Access
resource "google_cloud_run_service_iam_binding" "public" {
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

# 4. Secret Manager Access for Cloud Run Service Account
# The default compute service account used by Cloud Run
data "google_compute_default_service_account" "default" {}

# Grant access to FIREBASE_ADMIN_PRIVATE_KEY
resource "google_secret_manager_secret_iam_member" "firebase_key_access" {
  secret_id = "FIREBASE_ADMIN_PRIVATE_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

# Grant access to GOOGLE_API_KEY
resource "google_secret_manager_secret_iam_member" "google_api_key_access" {
  secret_id = "GOOGLE_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

# 5. GitHub Actions Deployer Permissions
# Grant the GHA service account permission to deploy to Cloud Run (Least Privilege)
resource "google_project_iam_member" "gha_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${var.gha_deployer_email}"
}

# Grant the GHA service account permission to push to Artifact Registry
resource "google_project_iam_member" "gha_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${var.gha_deployer_email}"
}

# Grant the GHA service account permission to act as the Cloud Run service account
resource "google_service_account_iam_member" "gha_act_as" {
  service_account_id = data.google_compute_default_service_account.default.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.gha_deployer_email}"
}

# Grant the GHA service account permission to view secrets (needed for deployment validation)
resource "google_project_iam_member" "gha_secret_viewer" {
  project = var.project_id
  role    = "roles/secretmanager.viewer"
  member  = "serviceAccount:${var.gha_deployer_email}"
}
