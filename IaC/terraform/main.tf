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

# Artifact Registry Repository
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "${var.service_name}-repo"
  description   = "Docker repository for ${var.service_name}"
  format        = "DOCKER"
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.name}/${var.service_name}:latest"
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }
  }
}

# Allow unauthenticated access
resource "google_cloud_run_service_iam_binding" "public" {
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}

# Firebase Project
resource "google_firebase_project" "default" {
  provider = google
  project  = var.project_id

  depends_on = [
    google_project_service.firebase
  ]
}

# Enable Firebase API
resource "google_project_service" "firebase" {
  provider = google
  project  = var.project_id
  service  = "firebase.googleapis.com"
}

# Firestore Database (Free Tier compliant: Native mode)
resource "google_firestore_database" "database" {
  provider                    = google
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = var.region
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"

  depends_on = [
    google_project_service.firestore
  ]
}

# Enable Firestore API
resource "google_project_service" "firestore" {
  provider = google
  project  = var.project_id
  service  = "firestore.googleapis.com"
}
