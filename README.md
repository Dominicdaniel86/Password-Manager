# Password Manager

This project is a full-stack password manager prototype built with a Flask backend, PostgreSQL storage, and an AWS Cognito-based login flow.   Users authenticate through Cognito, receive access tokens, and use those tokens to securely call protected API endpoints for creating, listing, and deleting password entries. The frontend is a lightweight static web app, while the backend verifies JWTs against Cognito JWKS and stores user-scoped items in PostgreSQL.

The repository also includes helper scripts for MFA-based AWS CLI login, S3 uploads, and EC2 bootstrap deployment.

---

## How to set up this project

✅ **Requirements** (local development)

- Python 3.10+
- pip
- PostgreSQL (local or remote)
- AWS CLI (for AWS helper scripts)

### Step 1 - Clone/download the project

~~~bash
git clone https://github.com/Dominicdaniel86/Password-Manager.git
cd Password-Manager
~~~

### Step 2 - Create a Python environment

~~~bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
~~~

### Step 3 - Configure database environment variables

The backend reads these variables:

- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME

Example:

~~~bash
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=password_manager
~~~

### Step 4 - Initialize database schema

Run the SQL in setup.sql:

~~~bash
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f static_files/database/setup.sql
~~~

### Step 5 - Run the Flask API

~~~bash
python3 flask-app/main.py
~~~

The app starts on port 80.

If port 80 is blocked by permissions on your machine, run with elevated privileges or switch to gunicorn on a non-privileged port in your own setup.

---

## Frontend + authentication flow

The frontend lives in frontend.

- Login page: index.html
- Vault page: homepage.html
- Cognito authorize redirect is configured in index-code.js
- Token exchange and API calls are implemented in homepage-code.js

Current flow:

1. User clicks login on index page.
2. Browser redirects to Cognito /oauth2/authorize.
3. Cognito returns an authorization code to homepage.
4. Frontend exchanges code for tokens and stores them in localStorage.
5. Frontend calls protected Flask endpoints with Authorization: Bearer access_token.

---

## API overview

The API implementation can be found in main.py.

| Endpoint | Method | Auth required | Description |
|---|---|---|---|
| /api/health | GET | No | Health check |
| /api/items | GET | Yes | List current user items |
| /api/items | POST | Yes | Save a new item |
| /api/items/<item_id> | DELETE | Yes | Delete a user item |
| / | GET | No | Hello-world root route |
| /api/ | GET | No | Hello-world API root |

---

## AWS helper scripts

Some helper scripts for quick development can be found in the `/scripts` directory.

- mfa-login.sh  
  Gets temporary AWS session credentials from STS using MFA and exports them into your shell.
- get-identity.sh  
  Verifies current AWS identity with sts get-caller-identity.
- upload-to-s3.sh  
  Uploads a specified file to a configured S3 bucket.
- ec2-setup.sh  
  Bootstraps an EC2 host, fetches secrets/parameters, installs dependencies, and starts gunicorn.

Example MFA usage:

~~~bash
source ./static_files/scripts/mfa-login.sh 123456
~~~

---

## EC2 deployment (scripted path)

From your EC2 instance:

1. Ensure AWS permissions exist for Secrets Manager + SSM + S3 as needed.
2. Run setup script:
   ~~~bash
   chmod +x static_files/scripts/ec2-setup.sh
   ./static_files/scripts/ec2-setup.sh
   ~~~
3. Validate API:
   ~~~bash
   curl http://<EC2_PUBLIC_IP>/api/health
   ~~~

---

## Security notes (important)

This repository is a prototype and currently includes patterns that should be improved before production use:

- Password entries are stored in plaintext in the database schema.
- A Cognito client secret is present in frontend JavaScript.
- Tokens are stored in localStorage.
- Debug logging prints token and API details in browser console.

Recommended production hardening:

1. Encrypt stored secrets/passwords at rest.
2. Move OAuth token exchange to backend only.
3. Use secure, HttpOnly cookies instead of localStorage.
4. Remove verbose logs and enforce strict CORS/HTTPS policies.

The current hard-coded credentials and related information do NOT pose a real threat - the associated resources do not exist anymore. But for any meaningful environment, this would be a major issue that would need to be addressed.

---

## Repository structure

~~~text
Password-Manager/
├── flask-app/
│   └── main.py
├── static_files/
│   ├── database/
│   │   └── setup.sql
│   ├── frontend/
│   │   ├── index.html
│   │   ├── index-code.js
│   │   ├── homepage.html
│   │   └── homepage-code.js
│   └── scripts/
│       ├── mfa-login.sh
│       ├── get-identity.sh
│       ├── upload-to-s3.sh
│       └── ec2-setup.sh
└── requirements.txt
~~~

---
