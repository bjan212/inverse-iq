#!/bin/bash

# Futures Analyst Integration Setup Script
# This script integrates the Futures Analyst system into inverse-iq

echo "🚀 Setting up Futures Analyst integration..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd /home/ubuntu/inverse-iq/futures-config
npm install

# Step 2: Create .env file if it doesn't exist
if [ ! -f /home/ubuntu/inverse-iq/.env ]; then
    echo "📝 Creating .env file..."
    cat > /home/ubuntu/inverse-iq/.env << 'EOF'
# Database Configuration
DATABASE_URL="mysql://user:password@localhost:3306/inverseiq"

# JWT Secret for authentication
JWT_SECRET="your-secret-key-here-change-this"

# Manus OAuth (if using)
VITE_APP_ID="your-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"

# Owner Info
OWNER_OPEN_ID="owner-id"
OWNER_NAME="Owner Name"

# Built-in Forge API (if using Manus)
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your-forge-key"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-forge-key"
VITE_FRONTEND_FORGE_API_URL="https://forge.manus.im"

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=""
VITE_ANALYTICS_WEBSITE_ID=""

# App Branding
VITE_APP_TITLE="InverseIQ Futures Analyst"
VITE_APP_LOGO=""
EOF
    echo "✅ .env file created. Please update with your actual values."
else
    echo "✅ .env file already exists."
fi

# Step 3: Set up database
echo "🗄️  Setting up database..."
cd /home/ubuntu/inverse-iq
npx drizzle-kit generate
npx drizzle-kit migrate

# Step 4: Create startup script
echo "📝 Creating startup script..."
cat > /home/ubuntu/inverse-iq/start-futures-analyst.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/inverse-iq/futures-config
NODE_ENV=development tsx watch ../futures-backend/_core/index.ts
EOF
chmod +x /home/ubuntu/inverse-iq/start-futures-analyst.sh

# Step 5: Create unified package.json
echo "📝 Creating unified package.json..."
cat > /home/ubuntu/inverse-iq/package-futures.json << 'EOF'
{
  "name": "inverseiq-futures-analyst",
  "version": "1.0.0",
  "description": "InverseIQ with integrated Futures Analyst",
  "scripts": {
    "dev:futures": "cd futures-config && npm run dev",
    "dev:original": "node server.js",
    "dev:both": "concurrently \"npm run dev:original\" \"npm run dev:futures\"",
    "build:futures": "cd futures-config && npm run build",
    "db:push": "cd futures-config && npm run db:push"
  }
}
EOF

echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Update /home/ubuntu/inverse-iq/.env with your database credentials"
echo "2. Start the Futures Analyst: ./start-futures-analyst.sh"
echo "3. Access at: http://localhost:3000/futures"
echo ""
echo "📖 Read FUTURES_ANALYST_INTEGRATION.md for full documentation"
