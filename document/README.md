# Documents folder

a CI/CD work flow has been configured for this backend

---

## 🚀 Deployment Status & Access

This project is configured with a Continuous Integration and Continuous Deployment (CI/CD) pipeline. Any changes merged into the `main` branch will automatically update the live environments.

### 🔹 Backend (Node.js)

- **Host Platform**: [Fly.io](https://fly.io/)
- **Access URL**: [https://cs732-groupproj.fly.dev/](https://cs732-groupproj.fly.dev/)
- **Trigger**: Any source code change within the `backend/` directory on the `main` branch.

### 🔹 Frontend (React/Vite)

- **Host Platform**: [GitHub Pages](https://pages.github.com/)
- **Access URL**: [https://uoa-cs732-s1-2026.github.io/group-project-helicopter/](https://uoa-cs732-s1-2026.github.io/group-project-helicopter/)
- **Trigger**: Any source code change within the `frontend/` directory on the `main` branch.

---

### 🔧 CI/CD Setup Guides

- **[GitHub Pages CI/CD Guide](./Documents/CICD%20with%20Github%20Pages.md)**: How to set up automated deployment for the frontend.
- **[Fly.io CI/CD Guide](./Documents/CICD%20with%20Fly.io.md)**: How to set up automated deployment for the backend using GitHub Actions.

### ☁️ Cloud Integrations

- **[AWS S3 Integration](./Documents/Using%20AWS%20S3.md)**: Instructions on integrating Amazon S3 for object storage and file uploads.
- **[Azure MySQL Integration](./Documents/Using%20Azure%20Flexible%20MySQL.md)**: Guide on connecting the backend to an Azure Database for MySQL (Flexible Server).
