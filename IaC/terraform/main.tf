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
      # First time init if no docker image created yet CHANGE THIS TO A PUBLIC DUMMY IMAGE FOR THE INITIAL DEPLOY
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      # This points to the image that GitHub Actions will eventually push
      #image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}-repo/${var.service_name}:latest"
      
      env {
        name  = "NODE_ENV"
        value = "production"
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
}

# 3. Allow Public (Unauthenticated) Access
resource "google_cloud_run_service_iam_binding" "public" {
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}
