#!/bin/bash

###############################################################################
# InverseIQ AWS Deployment Script
# 
# This script helps you deploy InverseIQ to AWS EC2
# Run this script AFTER you've created an EC2 instance
###############################################################################

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         InverseIQ AWS Deployment Helper                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    echo ""
    echo "Please install AWS CLI first:"
    echo "  macOS: brew install awscli"
    echo "  Linux: sudo apt-get install awscli"
    echo "  Or visit: https://aws.amazon.com/cli/"
    exit 1
fi

print_success "AWS CLI is installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    echo ""
    echo "Please configure AWS credentials:"
    echo "  Run: aws configure"
    echo "  You'll need:"
    echo "    - AWS Access Key ID"
    echo "    - AWS Secret Access Key"
    echo "    - Default region (e.g., us-east-1)"
    exit 1
fi

print_success "AWS credentials configured"
echo ""

# Get AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

echo "AWS Account: $AWS_ACCOUNT"
echo "AWS Region: $AWS_REGION"
echo ""

# Menu
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Deployment Options                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Create new EC2 instance (Recommended for first-time)"
echo "2. Deploy to existing EC2 instance"
echo "3. Show deployment instructions only"
echo "4. Exit"
echo ""
read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo ""
        print_info "Creating new EC2 instance..."
        echo ""
        
        # Check for existing key pair
        KEY_NAME="inverseiq-key"
        if aws ec2 describe-key-pairs --key-names $KEY_NAME &> /dev/null; then
            print_info "Key pair '$KEY_NAME' already exists"
        else
            print_info "Creating new key pair..."
            aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > ~/.ssh/$KEY_NAME.pem
            chmod 400 ~/.ssh/$KEY_NAME.pem
            print_success "Key pair created: ~/.ssh/$KEY_NAME.pem"
        fi
        
        # Create security group
        SG_NAME="inverseiq-sg"
        print_info "Creating security group..."
        
        # Check if security group exists
        if aws ec2 describe-security-groups --group-names $SG_NAME &> /dev/null; then
            SG_ID=$(aws ec2 describe-security-groups --group-names $SG_NAME --query 'SecurityGroups[0].GroupId' --output text)
            print_info "Security group already exists: $SG_ID"
        else
            SG_ID=$(aws ec2 create-security-group \
                --group-name $SG_NAME \
                --description "InverseIQ Security Group" \
                --query 'GroupId' --output text)
            
            # Add rules
            aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
            aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
            aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
            aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0
            
            print_success "Security group created: $SG_ID"
        fi
        
        # Launch instance
        print_info "Launching EC2 instance (t2.micro - Free tier eligible)..."
        
        INSTANCE_ID=$(aws ec2 run-instances \
            --image-id ami-0c55b159cbfafe1f0 \
            --instance-type t2.micro \
            --key-name $KEY_NAME \
            --security-group-ids $SG_ID \
            --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=InverseIQ}]' \
            --query 'Instances[0].InstanceId' \
            --output text)
        
        print_success "Instance launched: $INSTANCE_ID"
        print_info "Waiting for instance to be running..."
        
        aws ec2 wait instance-running --instance-ids $INSTANCE_ID
        
        # Get public IP
        PUBLIC_IP=$(aws ec2 describe-instances \
            --instance-ids $INSTANCE_ID \
            --query 'Reservations[0].Instances[0].PublicIpAddress' \
            --output text)
        
        print_success "Instance is running!"
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║         Instance Details                                   ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Instance ID: $INSTANCE_ID"
        echo "Public IP: $PUBLIC_IP"
        echo "SSH Key: ~/.ssh/$KEY_NAME.pem"
        echo ""
        echo "To connect:"
        echo "  ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP"
        echo ""
        
        # Save instance info
        cat > .aws-instance-info << EOF
INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
KEY_PATH=~/.ssh/$KEY_NAME.pem
EOF
        
        print_info "Instance info saved to .aws-instance-info"
        echo ""
        
        read -p "Do you want to deploy InverseIQ now? (y/n): " deploy_now
        if [[ $deploy_now == "y" ]]; then
            print_info "Waiting 30 seconds for instance to fully initialize..."
            sleep 30
            
            print_info "Deploying InverseIQ..."
            ./scripts/deployToAWS.sh deploy $PUBLIC_IP ~/.ssh/$KEY_NAME.pem
        fi
        ;;
        
    2)
        echo ""
        read -p "Enter EC2 Public IP: " PUBLIC_IP
        read -p "Enter SSH key path (e.g., ~/.ssh/key.pem): " KEY_PATH
        
        if [ ! -f "$KEY_PATH" ]; then
            print_error "SSH key not found: $KEY_PATH"
            exit 1
        fi
        
        print_info "Testing SSH connection..."
        if ssh -i $KEY_PATH -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$PUBLIC_IP "echo 'Connected'" &> /dev/null; then
            print_success "SSH connection successful"
            
            # Deploy
            print_info "Deploying InverseIQ..."
            
            # Create deployment package
            print_info "Creating deployment package..."
            tar -czf /tmp/inverseiq-deploy.tar.gz \
                --exclude='node_modules' \
                --exclude='.git' \
                --exclude='*.log' \
                --exclude='.DS_Store' \
                .
            
            print_success "Package created"
            
            # Upload to server
            print_info "Uploading to server..."
            scp -i $KEY_PATH /tmp/inverseiq-deploy.tar.gz ubuntu@$PUBLIC_IP:/tmp/
            
            # Deploy on server
            print_info "Installing on server..."
            ssh -i $KEY_PATH ubuntu@$PUBLIC_IP << 'ENDSSH'
# Update system
sudo apt-get update
sudo apt-get install -y curl

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/inverseiq
sudo chown ubuntu:ubuntu /var/www/inverseiq

# Extract application
cd /var/www/inverseiq
tar -xzf /tmp/inverseiq-deploy.tar.gz

# Install dependencies
npm install --production

# Create required directories
mkdir -p data/submissions data/public output signals

# Start application
pm2 start server.js --name inverseiq
pm2 save
pm2 startup

echo "Deployment complete!"
ENDSSH
            
            print_success "Deployment complete!"
            echo ""
            echo "╔════════════════════════════════════════════════════════════╗"
            echo "║         Access Your Application                            ║"
            echo "╚════════════════════════════════════════════════════════════╝"
            echo ""
            echo "Main Page: http://$PUBLIC_IP:3000"
            echo "Signals: http://$PUBLIC_IP:3000/signals.html"
            echo "Admin: http://$PUBLIC_IP:3000/admin.html"
            echo ""
            echo "To manage your application:"
            echo "  ssh -i $KEY_PATH ubuntu@$PUBLIC_IP"
            echo "  pm2 list"
            echo "  pm2 logs inverseiq"
            echo ""
            
        else
            print_error "Cannot connect to server"
            echo "Please check:"
            echo "  - IP address is correct"
            echo "  - SSH key has correct permissions (chmod 400)"
            echo "  - Security group allows SSH (port 22)"
        fi
        ;;
        
    3)
        cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║         Manual AWS Deployment Instructions                 ║
╚════════════════════════════════════════════════════════════╝

STEP 1: Create EC2 Instance
----------------------------
1. Go to AWS Console → EC2
2. Click "Launch Instance"
3. Choose: Ubuntu Server 22.04 LTS
4. Instance type: t2.micro (Free tier)
5. Create/select key pair
6. Security group: Allow ports 22, 80, 443, 3000
7. Launch instance

STEP 2: Connect to Instance
----------------------------
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

STEP 3: Install Dependencies
----------------------------
# Update system
sudo apt-get update
sudo apt-get install -y curl git

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

STEP 4: Deploy Application
----------------------------
# Create directory
sudo mkdir -p /var/www/inverseiq
sudo chown ubuntu:ubuntu /var/www/inverseiq
cd /var/www/inverseiq

# Upload your code (from local machine)
# scp -i your-key.pem -r /path/to/project/* ubuntu@YOUR_PUBLIC_IP:/var/www/inverseiq/

# Or clone from git
# git clone your-repo-url .

# Install dependencies
npm install --production

# Create directories
mkdir -p data/submissions data/public output signals

# Start application
pm2 start server.js --name inverseiq
pm2 save
pm2 startup

STEP 5: Access Application
----------------------------
http://YOUR_PUBLIC_IP:3000

STEP 6: Setup Domain & HTTPS (Optional)
----------------------------
# Install Nginx
sudo apt-get install -y nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Configure domain
sudo certbot --nginx -d yourdomain.com

EOF
        ;;
        
    4)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac
