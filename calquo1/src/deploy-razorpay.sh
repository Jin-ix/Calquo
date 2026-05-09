#!/bin/bash

# 🚀 CALICO Razorpay Deployment Script
# This script deploys the Razorpay payment integration

set -e  # Exit on error

echo "🚀 CALICO - Razorpay Payment Gateway Deployment"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if .env exists
echo "📋 Step 1: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo ""
    echo "Creating .env file..."
    echo "# Razorpay Configuration" > .env
    echo "VITE_RAZORPAY_KEY_ID=rzp_test_REPLACE_WITH_YOUR_KEY" >> .env
    echo ""
    echo -e "${YELLOW}⚠️  Please update .env with your Razorpay test key!${NC}"
    echo "Edit the .env file and replace 'rzp_test_REPLACE_WITH_YOUR_KEY'"
    echo ""
    read -p "Press Enter after updating .env to continue..."
fi

# Check if Razorpay key is set
RAZORPAY_KEY=$(grep VITE_RAZORPAY_KEY_ID .env | cut -d '=' -f2)
if [[ $RAZORPAY_KEY == *"REPLACE"* ]]; then
    echo -e "${RED}❌ Please set your Razorpay key in .env first!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 2: Install Functions Dependencies
echo "📦 Step 2: Installing Firebase Functions dependencies..."
cd functions
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
cd ..
echo ""

# Step 3: Build Functions
echo "🔨 Step 3: Building Firebase Functions..."
cd functions
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 4: Check Firebase Config
echo "🔐 Step 4: Checking Firebase Functions configuration..."
echo ""
echo "Please set your Razorpay credentials (if not already set):"
echo ""
echo "Run these commands:"
echo -e "${YELLOW}firebase functions:config:set razorpay.key_id=\"rzp_test_YOUR_KEY\"${NC}"
echo -e "${YELLOW}firebase functions:config:set razorpay.key_secret=\"YOUR_SECRET\"${NC}"
echo ""
read -p "Have you set the Firebase config? (y/n): " confirm
if [[ $confirm != "y" ]]; then
    echo -e "${YELLOW}⚠️  Please set Firebase config before deploying${NC}"
    exit 1
fi
echo ""

# Step 5: Deploy Functions
echo "🚀 Step 5: Deploying Firebase Functions..."
firebase deploy --only functions
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions deployed successfully${NC}"
else
    echo -e "${RED}❌ Functions deployment failed${NC}"
    exit 1
fi
echo ""

# Step 6: Clear frontend cache
echo "🧹 Step 6: Clearing frontend cache..."
rm -rf dist .firebase node_modules/.vite
echo -e "${GREEN}✅ Cache cleared${NC}"
echo ""

# Step 7: Build frontend
echo "🔨 Step 7: Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo ""

# Step 8: Deploy hosting
echo "🚀 Step 8: Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Hosting deployed successfully${NC}"
else
    echo -e "${RED}❌ Hosting deployment failed${NC}"
    exit 1
fi
echo ""

# Success!
echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Your Razorpay integration is now live at:"
echo "https://calico-proto.web.app"
echo ""
echo "📝 Next steps:"
echo "1. Test payment with ₹500"
echo "2. Use test card: 4111 1111 1111 1111"
echo "3. Or use test UPI: success@razorpay"
echo "4. Check Firestore for payment records"
echo ""
echo "📊 Monitor your deployment:"
echo "- Functions logs: firebase functions:log"
echo "- Razorpay Dashboard: https://dashboard.razorpay.com"
echo ""
echo -e "${GREEN}✅ All systems ready!${NC}"
echo "================================================"
