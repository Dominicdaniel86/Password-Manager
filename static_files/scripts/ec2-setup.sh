#!/bin/bash

# Verify to be in the home directory
cd /home/ec2-user

# Create .ssh directory and set permissions
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Get the GitHub deploy key
aws secretsmanager get-secret-value \
  --secret-id project/GitHub/DeployKey \
  --query SecretString \
  --output text > ~/.ssh/github_key
chmod 600 ~/.ssh/github_key

# Configure SSH for GitHub
cat > ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_key
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# Add GitHub to known hosts (to avoid manual prompt about fingerprint)
ssh-keyscan github.com >> ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts

# Clone the repository using SSH
git clone git@github.com:Dominicdaniel86/Password-Manager.git

# CD into the project directory
cd Password-Manager
# pip install dependencies
python3 -m pip install --ignore-installed -r requirements.txt

# Get database credentials from Secrets Manager
export DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id 'rds!db-920f10f8-73d7-47ae-a398-d3aaf8f0a677' \
  --query SecretString \
  --output text)

export DB_HOST=$(aws ssm get-parameter \
  --name "/rds/dbhost" \
  --query "Parameter.Value" \
  --output text)

export DB_NAME=$(aws ssm get-parameter \
  --name "/rds/dbname" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text)

export DB_USER=$(echo $DB_SECRET | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
export DB_PASSWORD=$(echo $DB_SECRET | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

# Launch the flask app
# nohup python3 flask-app/main.py > ./app.log 2>&1 &
cd flask-app
nohup gunicorn -w 4 -b 0.0.0.0:80 main:app > ../app.log 2>&1 &
# Move from nohup to systemd for better management
