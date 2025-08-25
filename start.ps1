# Start Docker services in detached mode
docker-compose up -d

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
Start-Sleep -Seconds 10

# Install server dependencies and start the server
cd server
npm install

# Start the server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

# Open the application in the default browser
Start-Process "http://localhost:5173"
