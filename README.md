# Microsoft Intune Admin Center (Demo & Simulator) 🛡️💻

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0078D4?logo=microsoft&logoColor=white)](https://boopathirbk.github.io/microsoft-intune-admin-center-demo/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Certification: MD-102](https://img.shields.io/badge/Study%20Prep-MD--102%20Endpoint%20Admin-brightgreen?logo=microsoft)](https://learn.microsoft.com/en-us/credentials/certifications/exams/md-102/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](CONTRIBUTING.md)

> **Free, interactive in-browser Microsoft Intune admin center simulator & study laboratory designed for the Microsoft MD-102: Endpoint Administrator certification, IT admins, and interview practice.**

---

## 🌟 Live Demo

👉 **Try it online without setup**: [https://boopathirbk.github.io/microsoft-intune-admin-center-demo/](https://boopathirbk.github.io/microsoft-intune-admin-center-demo/)

---

## 📖 Overview

Preparing for the **Microsoft MD-102: Endpoint Administrator** exam or brushing up on cloud endpoint management usually requires an expensive Microsoft 365 E5 trial with a credit card that expires after 30 days.

This project delivers a **100% client-side, interactive replica** of the modern Microsoft Intune admin center. It runs entirely in your browser using modern vanilla JavaScript (ES modules), HTML5, and CSS variables, providing a zero-risk sandbox to practice real-world endpoint management tasks.

---

## ✨ Features & Hubs

### 💻 1. Devices Hub (`#/devices`)
- **All Devices Inventory**: Search, filter by OS / ownership / compliance, customize columns, and client-side CSV export.
- **15 Live Remote Actions**: *Sync*, *Restart*, *Remote Lock*, *Quick scan*, *Full scan*, *Signature update*, *Fresh Start*, *Autopilot reset*, *Diagnostics collection*, *Rotate BitLocker key*, *Rotate LAPS password*, *Rename*, *Custom notification*, *Remote Help*, and *Wipe*.
- **Device Details Slide-Over Blade**: Hardware specs, OS build, TPM version, BitLocker 48-digit recovery keys, and Windows LAPS passwords.
- **Compliance Policies & Configuration Profiles**: Multi-step policy creation wizards and real-time evaluation.

### 🛡️ 2. Endpoint Security Hub (`#/endpoint-security`)
- **Antivirus, Firewall & Disk Encryption**: BitLocker escrow policies, Defender firewall rules, and encryption settings.
- **Attack Surface Reduction (ASR)**: Exploit guard, credential theft protection, and ransomware remediation.
- **Windows Update Rings**: Quality and feature update rings, active hours, and maintenance deferral periods.
- **Microsoft Defender for Endpoint**: Sensor telemetry integration, intelligence sync, and onboarding script generator.

### 📦 3. Apps Hub (`#/apps`)
- **App Management**: Deploy Win32 apps, Microsoft Store packages, Microsoft 365 Apps, and web links.
- **App Protection Policies (MAM)**: Data leakage prevention (DLP), encryption requirements, and biometric PIN prompts.
- **App Configuration Policies**: Managed app configurations for iOS and Android.

### 🪟 4. Windows 365 & Intune Suite (`#/windows-365`, `#/intune-suite`)
- **Cloud PC Management**: Provisioning policies, custom images, Azure Network Connections, restore points, and resizing.
- **Intune Suite Add-ons**: Endpoint Privilege Management (EPM), Enterprise App Catalog, Remote Help, and Cloud PKI.

### 📊 5. Reports & Tenant Administration (`#/reports`, `#/tenant`)
- **Compliance & Enrollment Reports**: Interactive bar charts, non-compliance breakdowns, and CSV reports.
- **Tenant Status & Connectors**: Service health monitoring, message center, Apple APNs, Google Play sync, and Microsoft Entra connectors.

---

## 🚀 How to Run Locally

No Node.js build step or complex package installations required!

```bash
# 1. Clone this repository
git clone https://github.com/boopathirbk/microsoft-intune-admin-center-demo.git

# 2. Navigate to the project folder
cd microsoft-intune-admin-center-demo

# 3. Start any static web server (e.g. Python)
python3 -m http.server 8080

# 4. Open in browser
http://localhost:8080
```

---

## 🛠️ Deploying to GitHub Pages

1. Create a new GitHub repository named `microsoft-intune-admin-center-demo`.
2. Push this codebase to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Microsoft Intune Admin Center Demo"
   git branch -M main
   git remote add origin https://github.com/boopathirbk/microsoft-intune-admin-center-demo.git
   git push -u origin main
   ```
3. In GitHub, go to **Settings** → **Pages**.
4. Under **Branch**, select `main` and root `/`.
5. Click **Save**. Your simulator will be live in minutes!

---

## ⚖️ Disclaimer & Educational Terms

- **Purely for Educational Study**: Engineered solely as an interactive study companion for endpoint administrators and students preparing for the **Microsoft MD-102: Endpoint Administrator** exam.
- **Non-Affiliation**: This software is an independent open-source project and is **not affiliated with, sponsored by, endorsed by, or certified by Microsoft Corporation**.
- **Trademarks**: *Microsoft*, *Microsoft Intune*, *Windows*, *Microsoft 365*, and related brand names are registered trademarks of Microsoft Corporation, used under nominative fair use.
- **Privacy & Safety**: Runs 100% client-side in the browser. Zero cloud credentials or real devices are accessed.

---

## 👨‍💻 Author

**Boopathi R.**  
GitHub: [@boopathirbk](https://github.com/boopathirbk)

⭐ If this study simulator helps you in your MD-102 preparation or daily administration work, please consider giving it a star on GitHub!
