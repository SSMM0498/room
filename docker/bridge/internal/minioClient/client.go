package minioClient

import (
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func NewClient() (*minio.Client, error) {
	// These should come from environment variables in a real app
	endpoint := "localhost:9000" // Use K8s service name
	accessKeyID := "minioadmin"
	secretAccessKey := "P@sser7410"
	useSSL := false

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}
	log.Println("BRIDGE: ✅ Connected to MinIO.")
	return minioClient, nil
}