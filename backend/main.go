package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"gopkg.in/yaml.v2"
	appsv1 "k8s.io/api/apps/v1"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	app := pocketbase.New()

	app.OnRecordCreateRequest("workspaces").BindFunc(func(e *core.RecordRequestEvent) error {
		log.Println("New workspace created, triggering orchestration...")
		record := e.Record

		// 1. Generate unique names and paths
		k8sName := fmt.Sprintf("ws-%s", record.Id)
		s3Path := fmt.Sprintf("workspaces/%s-%s", record.GetString("name"), record.Id)

		record.Set("k8s_name", k8sName)
		record.Set("s3_path", s3Path)
		record.Set("is_active", false) // Will be set to true after successful deployment
		record.Set("status", "creating")

		if err := app.Save(record); err != nil {
			log.Printf("Error saving initial workspace state: %v", err)
			return err
		}

		// 2. Run the deployment logic asynchronously
		go func() {
			err := deployWorkspace(app, k8sName, record.GetString("base_image"), s3Path)
			if err != nil {
				log.Printf("ERROR during workspace deployment for %s: %v", k8sName, err)
				record.Set("status", "failed")
				app.Save(record)
				return
			}

			ingressUrl := fmt.Sprintf("https://%s.r00m.com", k8sName)
			record.Set("ingress_url", ingressUrl)
			record.Set("status", "active")
			record.Set("is_active", true)
			if err := app.Save(record); err != nil {
				log.Printf("Error saving final workspace state: %v", err)
			}
			log.Printf("Successfully deployed workspace %s", k8sName)
		}()

		return nil
	})

	app.OnRecordUpdateRequest("workspaces").BindFunc(func(e *core.RecordRequestEvent) error {
		newStatus := e.Record.GetString("status")
		k8sName := e.Record.GetString("k8s_name")

		// Check original record to see if status is changing TO a teardown state
		original, err := app.FindRecordById("workspaces", e.Record.Id)
		if err != nil {
			return fmt.Errorf("could not find original record: %w", err)
		}

		if (newStatus == "deleted" || newStatus == "inactive") && original.GetString("status") != newStatus {
			log.Printf("Workspace %s marked for deactivation. Tearing down K8s resources.", k8sName)

			go func() {
				if err := teardownWorkspace(k8sName); err != nil {
					log.Printf("ERROR during workspace teardown for %s: %v", k8sName, err)
				}
				e.Record.Set("is_active", false)
				e.Record.Set("ingress_url", "")
				app.Save(e.Record)
			}()
		}
		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// deployWorkspace connects to K8s and applies the necessary manifests.
func deployWorkspace(app *pocketbase.PocketBase, k8sName, baseImage, s3Path string) error {
	config, err := rest.InClusterConfig()
	if err != nil {
		return fmt.Errorf("failed to get in-cluster config: %w", err)
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return fmt.Errorf("failed to create kubernetes clientset: %w", err)
	}

	namespace := "default" // Or get from config

	// Read and parse template
	templateBytes, err := ioutil.ReadFile("pb_hooks/service-template.yaml")
	if err != nil {
		return fmt.Errorf("failed to read template file: %w", err)
	}

	// Replace placeholders
	templateString := string(templateBytes)
	templateString = strings.ReplaceAll(templateString, "service_name", k8sName)
	templateString = strings.ReplaceAll(templateString, "worker_image", baseImage)
	templateString = strings.ReplaceAll(templateString, "s3_path", s3Path)

	// Split multi-document YAML
	manifests := strings.Split(templateString, "---")

	for _, manifestStr := range manifests {
		if strings.TrimSpace(manifestStr) == "" {
			continue
		}

		var generic map[string]interface{}
		if err := yaml.Unmarshal([]byte(manifestStr), &generic); err != nil {
			log.Printf("Warning: could not unmarshal generic manifest: %v", err)
			continue
		}

		kind, ok := generic["kind"].(string)
		if !ok {
			log.Printf("Warning: manifest is missing 'kind'")
			continue
		}

		log.Printf("Applying manifest for %s of kind %s", k8sName, kind)

		switch kind {
		case "Job":
			var job batchv1.Job
			yaml.Unmarshal([]byte(manifestStr), &job)
			_, err = clientset.BatchV1().Jobs(namespace).Create(context.TODO(), &job, metav1.CreateOptions{})
		case "Deployment":
			var deployment appsv1.Deployment
			yaml.Unmarshal([]byte(manifestStr), &deployment)
			_, err = clientset.AppsV1().Deployments(namespace).Create(context.TODO(), &deployment, metav1.CreateOptions{})
		case "Service":
			var service corev1.Service
			yaml.Unmarshal([]byte(manifestStr), &service)
			_, err = clientset.CoreV1().Services(namespace).Create(context.TODO(), &service, metav1.CreateOptions{})
		case "Ingress":
			var ingress networkingv1.Ingress
			yaml.Unmarshal([]byte(manifestStr), &ingress)
			_, err = clientset.NetworkingV1().Ingresses(namespace).Create(context.TODO(), &ingress, metav1.CreateOptions{})
		default:
			log.Printf("Unsupported kind: %s", kind)
		}

		if err != nil {
			// If resource already exists, it's not a fatal error, just log it.
			if errors.IsAlreadyExists(err) {
				log.Printf("Resource %s of kind %s already exists. Skipping.", k8sName, kind)
			} else {
				return fmt.Errorf("failed to create %s for %s: %w", kind, k8sName, err)
			}
		}
	}

	// Wait for the hydration job to complete
	err = wait.Poll(5*time.Second, 5*time.Minute, func() (bool, error) {
		job, err := clientset.BatchV1().Jobs(namespace).Get(context.TODO(), k8sName+"-hydrator", metav1.GetOptions{})
		if err != nil {
			return false, err
		}
		if job.Status.Succeeded > 0 {
			// Create the "ready" file to unblock the main deployment's initContainer
			// This is a bit of a hack. A better way is a shared volume or custom signal.
			// For simplicity, we can assume the initContainer's check is sufficient.
			log.Printf("Hydration job for %s completed successfully.", k8sName)
			return true, nil
		}
		if job.Status.Failed > 0 {
			return false, fmt.Errorf("hydration job for %s failed", k8sName)
		}
		log.Printf("Waiting for hydration job %s to complete...", k8sName)
		return false, nil
	})

	if err != nil {
		return fmt.Errorf("hydration job failed or timed out: %w", err)
	}
	
	return nil
}

// teardownWorkspace connects to K8s and deletes the workspace resources.
func teardownWorkspace(k8sName string) error {
	config, err := rest.InClusterConfig()
	if err != nil { return err }
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil { return err }

	namespace := "default"
	deletePolicy := metav1.DeletePropagationForeground

	log.Printf("Deleting resources for workspace %s", k8sName)

	if err := clientset.AppsV1().Deployments(namespace).Delete(context.TODO(), k8sName, metav1.DeleteOptions{PropagationPolicy: &deletePolicy}); err != nil && !errors.IsNotFound(err) {
		log.Printf("Failed to delete deployment %s: %v", k8sName, err)
	}
	if err := clientset.CoreV1().Services(namespace).Delete(context.TODO(), k8sName, metav1.DeleteOptions{}); err != nil && !errors.IsNotFound(err) {
		log.Printf("Failed to delete service %s: %v", k8sName, err)
	}
	if err := clientset.NetworkingV1().Ingresses(namespace).Delete(context.TODO(), k8sName, metav1.DeleteOptions{}); err != nil && !errors.IsNotFound(err) {
		log.Printf("Failed to delete ingress %s: %v", k8sName, err)
	}
	if err := clientset.BatchV1().Jobs(namespace).Delete(context.TODO(), k8sName+"-hydrator", metav1.DeleteOptions{PropagationPolicy: &deletePolicy}); err != nil && !errors.IsNotFound(err) {
		log.Printf("Failed to delete job %s: %v", k8sName, err)
	}
	
	log.Printf("Successfully initiated teardown for %s", k8sName)
	return nil
}