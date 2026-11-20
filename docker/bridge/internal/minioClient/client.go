package minioClient

import (
	"log"
	"os"
	"strconv"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// envOr returns an environment variable, or fallback when it is not set.
func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// NewClient connects to the MinIO server holding the workspace files.
//
// The connection is read from the environment because "localhost" only reaches
// MinIO when the bridge runs directly on the developer's machine: inside a pod it
// is the pod itself, so MINIO_ENDPOINT has to name the MinIO service (or
// host.docker.internal:9000 on a local cluster). The fallbacks match
// docker/minio.docker-compose.yml.
func NewClient() (*minio.Client, error) {
	endpoint := envOr("MINIO_ENDPOINT", "localhost:9000")
	accessKeyID := envOr("MINIO_ACCESS_KEY", "minioadmin")
	secretAccessKey := envOr("MINIO_SECRET_KEY", "P@sser7410")
	useSSL, _ := strconv.ParseBool(os.Getenv("MINIO_USE_SSL"))

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("BRIDGE: ✅ MinIO client ready for %s.", endpoint)
	return minioClient, nil
}
