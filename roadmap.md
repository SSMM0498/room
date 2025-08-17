## **rOOm — Prototype Development Roadmap**

This roadmap is divided into sequential phases. Each phase builds upon the previous one, ensuring a logical and manageable development process.

### **Phase 0: Foundation & Project Setup**

#### **1. Environment & Project Initialization**
* [x] **Task 1: Set up Git Repository**
    * [x] Create a new directory for your project.
    * [x] Initialize a Git repository inside it (`git init`).

* [x] **Task 2: Initialize NuxtJS Project**
    * [x] Run the command to create a new Nuxt 3 project within your repository.
    * [x] Navigate into the new Nuxt project directory.

* [x] **Task 3: Install Dependencies**
    * [x] Install the PocketBase JavaScript SDK as a dependency in your Nuxt project.

#### **2. Backend Setup (PocketBase)**
* [x] **Task 4: Download and Run PocketBase**
    * [x] Download the appropriate PocketBase executable for your operating system.
    * [x] Unzip and place it in a convenient location (or within a `pb/` folder in your project root).

* [x] **Task 5: Start PocketBase & Create Admin**
    * [x] Run the PocketBase executable with the `serve` command.
    * [x] Navigate to the local URL provided in your terminal (usually `http://127.0.0.1:8090/_/`).
    * [x] Create your first administrator account.

#### **3. Frontend-Backend Integration (Nuxt & PocketBase)**
* [x] **Task 6: Configure Environment Variables**
    * [x] Create a `.env` file in the root of your Nuxt project.
    * [x] Add an entry for your PocketBase server URL (e.g., `POCKETBASE_URL=http://127.0.0.1:8090`).

* [x] **Task 7: Create a Server Utility for PocketBase**
    * [x] Inside your Nuxt project, create a new file in the `server/utils/` directory (e.g., `server/utils/pocketbase.ts`).
    * [x] This file will be responsible for creating and exporting a single, reusable instance of the PocketBase SDK client. It should be configured to read the URL from the environment variable you just set.

* [x] **Task 8: Create a Test Server Route**
    * [x] Create a new server API route to verify the connection, for example: `server/api/health.get.ts`.

* [x] **Task 9: Implement the Test Logic**
    * [x] Inside your new `health.get.ts` route, import and use the PocketBase instance from your server utility.
    * [x] Implement logic to make a simple, unauthenticated call to the PocketBase server (e.g., checking the application's health status).
    * [x] Return a success or error message from the API route.

* [x] **Task 10: Verify the Connection**
    * [x] Run both the PocketBase server and the Nuxt development server.
    * [x] Navigate to your new API endpoint in the browser (e.g., `http://localhost:3000/api/health`).
    * [x] Confirm you receive the success message, proving that your Nuxt server route can successfully communicate with your PocketBase backend.

### **Phase 1: Backend Implementation (PocketBase)**

#### **Part A: Collection & Schema Definition**

* [x] **Task 1: Modify the `users` Collection**
    * [x] Navigate to the existing `users` collection in the Admin UI.
    * [x] Click "Edit collection" and go to the "Schema" tab.
    * [x] Ensure these fields exist or add them:
        * [x] `name` (Type: `Text`)
        * [x] `avatar` (Type: `File`)
    * [x] Add a new field for the user's school affiliation:
        * [x] `school` (Type: `Relation`, Target Collection: `schools`, Max Select: 1)
    * [x] Go to the "API Rules" tab and set the `View rule` to `id = @request.auth.id` so users can only view their own full record.

* [x] **Task 2: Create the `tags` Collection**
    * [x] Create a new collection named `tags`.
    * [x] Set the collection "Type" to `Base`.
    * [x] Add the following fields:
        * [x] `name` (Type: `Text`, Required: Yes)
        * [x] `logo` (Type: `File`)
    * [x] Set the `List rule` and `View rule` to allow public access (leave them blank).

* [x] **Task 3: Create the `schools` Collection**
    * [x] Create a new collection named `schools`.
    * [x] Set the collection "Type" to `Base`.
    * [x] Add the following fields:
        * [x] `name` (Type: `Text`, Required: Yes)
        * [x] `description` (Type: `Editor`)
        * [x] `owner` (Type: `Relation`, Target Collection: `users`, Required: Yes, Max Select: 1)
        * [x] `instructors` (Type: `Relation`, Target Collection: `users`, Max Select: Multiple)
        * [x] `logo` (Type: `File`)
        * [x] `banner` (Type: `File`)
    * [x] Set the `Update rule` to `owner = @request.auth.id` so only the owner can edit the school.

* [x] **Task 4: Create the `courses`, `course_contents` and `course_items` Collection**
    * [x] Create a new collection named `courses`.
    * [x] Set the collection "Type" to `Base`.
    * [x] Add the following fields:
        * [x] `title` (Type: `Text`, Required: Yes)
        * [x] `description` (Type: `Editor`, Required: Yes)
        * [x] `author` (Type: `Relation`, Target Collection: `users`, Required: Yes, Max Select: 1)
        * [x] `school` (Type: `Relation`, Target Collection: `schools`, Max Select: 1)
        * [x] `tags` (Type: `Relation`, Target Collection: `tags`, Max Select: Multiple)
        * [x] `status` (Type: `Select`, Values: `draft`, `published`, Required: Yes, Default value: `draft`)
        * [x] `thumbnail` (Type: `File`)
        * [x] `duration` (Type: `Number`)
        * [x] `rOOm_json_file` (Type: `File`)
        * [x] `audio_file` (Type: `File`)
    * [x] Set the `View rule` to `status = "published"` so only published courses are publicly visible.
    * [x] Set the `Update rule` to `author = @request.auth.id` so only the author can edit the course.

* [x] **Task 5: Create the `progress` Collection**
    * [x] Create a new collection named `progress`.
    * [x] Set the collection "Type" to `Base`.
    * [x] Add the following fields:
        * [x] `user` (Type: `Relation`, Target Collection: `users`, Required: Yes, Max Select: 1)
        * [x] `course` (Type: `Relation`, Target Collection: `courses`, Required: Yes, Max Select: 1)
        * [x] `current_time` (Type: `Number`, Default value: 0)
        * [x] `workspace_snapshot` (Type: `File`)
    * [x] Set all API Rules (`List`, `View`, `Create`, `Update`, `Delete`) to `user = @request.auth.id`. This is critical for privacy, ensuring users can only access their own progress records.

#### **Part B: Service Configuration**

* [ ] **Task 6: Configure Authentication Providers**
    * [ ] Navigate to `Settings` -> `Auth providers`.
    * [ ] Enable and expand the **Google** provider.
    * [ ] Enter your "Client ID" and "Client secret" from your Google Cloud project.
    * [ ] Save changes.
    * [ ] Enable and expand the **GitHub** provider.
    * [ ] Enter your "Client ID" and "Client secret" from your GitHub OAuth App settings.
    * [ ] Save changes.

* [ ] **Task 7: Configure Mail Server (SMTP)**
    * [ ] Navigate to `Settings` -> `Mail settings`.
    * [ ] Enable the SMTP mail server.
    * [ ] Enter your SMTP server details (Host, Port, Username, Password).
    * [ ] Set the "Sender name" and "Sender address".
    * [ ] Save changes and optionally send a test email to verify the configuration.

### **Phase 2: Frontend Implementation (Core Pages & Auth)**

*   **Task 1: Layouts and Landing Page**
    *   Create a main layout (`layouts/default.vue`) with header and footer.
    *   Build the static **Landing Page** (`/`).
*   **Task 2: User Authentication Flow**
    *   Create login/signup pages.
    *   Implement user registration and login logic using the PocketBase SDK (email/password and OAuth).
    *   Create an auth middleware to protect authenticated routes.
*   **Task 3: Profile & Course Listing**
    *   Build the **Profile Page** (`/profile`) for users to see their info.
    *   Build the **Courses Listing Page** (`/catalog`) to fetch and display all `published` courses.
    *   Implement basic filtering by tags on the course listing page.
*   **Task 4: Course Detail Page**
    *   Build the **Course Detail Page** (`/course/:id`) to show course metadata before a user starts learning.

### **Phase 3: Frontend Implementation (Recorder & Player)**

*   **Task 1: IDE UI Components**
    *   Integrate Monaco Editor as a Vue component.
    *   Integrate Xterm.js as a Vue component for the terminal.
*   **Task 2: Recorder Logic**
    *   Create a `recorderService` or composable.
    *   Capture Monaco editor changes (diffs), cursor movements, and selections.
    *   Capture terminal input/output.
    *   Capture audio using the Web Audio API (`MediaRecorder`).
    *   Combine all events into a timestamped NDJSON stream.
    *   On stop, package and upload the event stream and audio file to the `courses` collection via an API call.
*   **Task 3: Player Logic**
    *   Create a `playerService` or composable.
    *   Fetch the event stream and audio file for a given course.
    *   Synchronize event playback with the audio track.
    *   Apply events to the read-only Monaco editor and Xterm.js instances.
    *   Implement player controls: play, pause, and a basic timeline scrub bar.
*   **Task 4: Integrate into Learning Page**
    *   Build the **Learning Page** (`/learn/:course-id`) to host the player UI.

### **Phase 4: Content Management (Instructor Workflow)**

*   **Task 1: School Pages**
    *   Build the public **School Page** (`/school/:school-id`) to display a school's profile and its courses.
    *   Build the **School Edition Page** (`/dashboard/edit/:school-id`) with a form for owners to update school details.
*   **Task 2: Instructor Dashboard**
    *   Build the main **Dashboard Page** (`/dashboard/:school-id`).
    *   Create a "My Courses" tab that lists all courses created by the instructor.
*   **Task 3: Course Creation Flow**
    *   Build the **Course Creation Page** (`/course/new`).
    *   Implement the multi-step form: Describe course, select tags.
    *   Integrate the recorder from Phase 3 into the "Record Course" step.
    *   Implement the final "Publish" step, which updates the course `status` to `published`.

### **Phase 5: DevOps & Workspace Orchestration**

*   **Task 1: Containerization (Docker)**
    *   Create a base `Dockerfile` for a generic workspace (e.g., Node.js).
    *   Build and push the image to a container registry (e.g., Docker Hub, GCR).
*   **Task 2: Kubernetes (K8s) Setup**
    *   Set up a basic K8s cluster (Minikube for local dev, or a cloud provider).
    *   Write K8s manifest for the `frontend-service` (NuxtJS).
    *   Write K8s manifest for the `backend-service` (PocketBase).
*   **Task 3: Workspace Orchestrator Microservice**
    *   Create a simple API service (e.g., in Go or Node.js) called `workspace-orchestrator`.
    *   This service will have an endpoint like `POST /workspaces`.
    *   When called, it uses the K8s API to spin up a new pod from the workspace Docker image.
    *   The service should return the URL or connection info for the new workspace.
*   **Task 4: Frontend-to-Orchestrator Integration**
    *   On the **Learning Page** (`/learn/:course-id`), add an "Open in IDE" button.
    *   This button calls the `workspace-orchestrator` API.
    *   When a workspace is ready, unlock the Monaco editor for user interaction.
    *   Implement a mechanism to handle idle workspace termination.
*   **Task 5: S3 Configuration**
    *   Configure PocketBase to use an S3-compatible object storage for file uploads (audio, thumbnails, snapshots) instead of local storage.