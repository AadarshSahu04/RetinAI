# 🔬 Diabetic Retinopathy Detection System

An AI-powered retinal analysis application for detecting and classifying Diabetic Retinopathy (DR) from fundus photographs.

---
🔗 **Live Demo**: [https://retin-ai.vercel.app/](https://retin-ai.vercel.app/)

---

##  Project Structure

```
dr-detection/
├── backend/
│   ├── main.py                  # FastAPI application entrypoint
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models.py                # ORM models (Patient, Report)
│   ├── schemas.py               # Pydantic schemas
│   ├── requirements.txt
│   ├── .env                     # Environment variables
│   ├── routes/
│   │   └── api.py               # All API endpoints
│   ├── services/
│   │   ├── ml_service.py        # TensorFlow model loading & inference
│   │   └── report_service.py    # PDF report generation (ReportLab)
│   ├── uploads/                 # Uploaded retinal images (auto-created)
│   └── reports/                 # Generated PDF reports (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + nav layout
│   │   ├── main.jsx             # React entry
│   │   ├── index.css            # Tailwind + custom styles
│   │   ├── api.js               # Axios API client
│   │   ├── utils.js             # Severity config + formatters
│   │   ├── components/
│   │   │   ├── ImageDropzone.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── SeverityBadge.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── StatsBar.jsx
│   │   └── pages/
│   │       ├── UploadPage.jsx   # New scan form
│   │       └── DashboardPage.jsx# Patient records + PDF download
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── setup.sh                     # One-shot setup script
├── start_backend.sh
├── start_frontend.sh
├── setup_db.sql
└── README.md
```

---

##  Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 14+ | (macos)`brew install postgresql@16` | Windows: see below

---

##  Setup (macOS M2 / Apple Silicon)

### 1. Clone / place project files

Put your pretrained model files inside the `backend/` directory:
```
backend/model.weights.h5
backend/config.json
backend/metadata.json
```

> **No model files?** The system runs in **demo mode** — predictions are simulated. Everything else works normally.

### 2. Database

```bash
# Install PostgreSQL (if not installed)
brew install postgresql@16
brew services start postgresql@16

# Create database and user
psql -U postgres -f setup_db.sql
```

### 3. One-shot setup

```bash
chmod +x setup.sh start_backend.sh start_frontend.sh
./setup.sh
```

This installs all Python and Node dependencies, with `tensorflow-macos` for Apple Silicon.

---

## Setup — Windows (PowerShell)
 
> Run all commands in **PowerShell as Administrator** unless noted.
 
### 1. Install prerequisites via Chocolatey
 
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
 
choco install python --version=3.10.11 -y
choco install nodejs-lts -y
choco install postgresql16 -y
```
 
After installation, restart PowerShell so PATH changes take effect.
 
### 2. Place project files
 
Put your pretrained model files inside the `backend/` directory:
```
backend/model.weights.h5
backend/config.json
backend/metadata.json
```
 
> **No model files?** The system runs in **demo mode** — predictions are simulated. Everything else works normally.
 
### 3. Set up the database
 
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
psql -U postgres -f setup_db.sql
```
 
> If `psql` is not found, add `C:\Program Files\PostgreSQL\16\bin` to your system PATH manually via System Properties → Environment Variables.
 
### 4. Backend setup
 
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
 
> **Important:** `tensorflow-macos` does not work on Windows. If your `requirements.txt` contains `tensorflow-macos` or `tensorflow-metal`, replace those lines with `tensorflow` before running pip install.
 
### 5. Frontend setup
 
```powershell
cd ..\frontend
npm install
```
 
### 6. Fix PowerShell script execution (if .ps1 scripts are blocked)
 
Run this once if you get an "execution policy" error:
 
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
 
---

##  Running

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
./start_backend.sh
# or manually:
cd backend && source .venv/bin/activate && python main.py
```

**Terminal 2 — Frontend:**
```bash
./start_frontend.sh
# or manually:
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| final project | https://retin-ai.vercel.app/ |
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

##  API Reference

### `POST /api/v1/predict`
Upload retinal image with patient details.

**Form Data:**
| Field | Type | Required |
|-------|------|----------|
| name | string | ✓ |
| age | integer (0–120) | ✓ |
| gender | male / female / other | ✓ |
| image | file (jpg/png/bmp/tiff/webp) | ✓ |

**Response:**
```json
{
  "result": "Mild DR",
  "confidence": 0.8412,
  "patient_id": 7,
  "message": "Prediction completed successfully."
}
```

---

### `GET /api/v1/patients`
Returns all patient records, newest first.

### `GET /api/v1/patients/{id}`
Returns a single patient record.

### `GET /api/v1/report/{patient_id}`
Generates and streams a PDF diagnostic report.

### `DELETE /api/v1/patients/{id}`
Deletes a patient record and associated files.

---

##  ML Integration

- Model file: `backend/model.weights.h5`
- Architecture: MobileNetV2 base + custom head (configurable via `config.json`)
- Input: RGB retinal fundus image, resized to model's expected input shape
- Output: 5-class softmax (No DR → Proliferative DR)
- Classes are read from `metadata.json` if present

**Replacing the model:**
1. Drop your `.h5` weights file in `backend/`
2. Update `MODEL_WEIGHTS_PATH` in `backend/.env`
3. If architecture differs, edit `_load_model()` in `services/ml_service.py`

---

##  Database Schema

```sql
patients
  id           SERIAL PRIMARY KEY
  name         VARCHAR NOT NULL
  age          INTEGER NOT NULL
  gender       VARCHAR NOT NULL
  image_path   VARCHAR NOT NULL
  result       VARCHAR NOT NULL
  confidence   FLOAT
  created_at   TIMESTAMP DEFAULT NOW()

reports
  id           SERIAL PRIMARY KEY
  patient_id   INTEGER REFERENCES patients(id)
  report_path  VARCHAR
  created_at   TIMESTAMP DEFAULT NOW()
```

Tables are auto-created on backend startup via SQLAlchemy.

---

##  Environment Variables (`backend/.env`)

```env
DATABASE_URL=postgresql://druser:drpassword@localhost:5432/drdetection
MODEL_WEIGHTS_PATH=model.weights.h5
CONFIG_PATH=config.json
METADATA_PATH=metadata.json
UPLOAD_DIR=uploads
REPORTS_DIR=reports
```

---

##  Apple Silicon Notes

- Uses `tensorflow-macos` + `tensorflow-metal` for GPU acceleration on M-series chips
- Falls back to standard `tensorflow` if the Apple build is unavailable
- `psycopg2-binary` works on ARM64 via Homebrew PostgreSQL

---

## Screenshots

---

### user Interface

<p align="center">
  <img src="assets/image1.jpeg" alt="Upload Page" width="80%"/>
</p>
<p align="center"><i>Upload retinal fundus image along with patient details for DR analysis</i></p>

---

###  Upload Page

<p align="center">
  <img src="assets/image2.jpeg" alt="Patient Dashboard" width="80%"/>
</p>
<p align="center"><i>Entering patient records for  classification and getting confidence scores</i></p>

---

### Prediction Result

<p align="center">
  <img src="assets/image3.jpeg" alt="Prediction Result" width="80%"/>
</p>
<p align="center"><i>AI-generated prediction displaying diabetic retinopathy classification and confidence level</i></p>

---

###  Patient Dashboard

<p align="center">
  <img src="assets/image4.jpeg" alt="Diagnostic Report" width="80%"/>
</p>
<p align="center"><i>Overview of all patient records with DR severity classification and confidence scores</i></p>

### Diagnostic Report

<div align="center">

[![Click to View Report](assets/P_Report.png)](assets/assets/P_Report.pdf)


> 📥 Click on the image above to view the complete sample patient report

</div>


---


##  Project Final Report

<div align="center">

[<img src="assets/Report_preview.png" width="400">](assets/RetinAI_Final_Report.pdf)

> 📥 Click on the image above to view the complete project report

</div>



---

## 👥 Team

 
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AadarshSahu04">
        <img src="assets/facephoto/aadarsh.jpeg" width="110px;" height="135px" alt="Aadarsh"/><br/>
        <sub><b>Aadrsh Sahu</b></sub>
      </a><br/>
      <sub>Developer</sub><br/>
      <a href="https://github.com/AadarshSahu04">
        <img src="https://img.shields.io/badge/GitHub-Aadarsh-181717?style=flat&logo=github" alt="GitHub"/>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Vigya-G">
        <img src="assets/facephoto/vigya.jpg" width="100px;" alt="Vigya"/><br/>
        <sub><b>Vigya Gupta</b></sub>
      </a><br/>
      <sub>Developer</sub><br/>
      <a href="https://github.com/Vigya-G">
        <img src="https://img.shields.io/badge/GitHub-Vigya-181717?style=flat&logo=github" alt="GitHub"/>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/udittmaheshwari">
        <img src="assets/facephoto/udit.jpeg" width="100px;" height="135" alt="Udit"/><br/>
        <sub><b>Udit Maheshwari</b></sub>
      </a><br/>
      <sub>Developer</sub><br/>
      <a href="https://github.com/udittmaheshwari">
        <img src="https://img.shields.io/badge/GitHub-Udit-181717?style=flat&logo=github" alt="GitHub"/>
      </a>
    </td>
  </tr>
</table>







> **Disclaimer:** This system is an AI-assisted tool. All diagnoses must be confirmed by a qualified ophthalmologist before any clinical decisions are made.
