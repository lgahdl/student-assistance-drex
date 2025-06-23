#!/bin/bash

# DREX + TCC Student Assistance Deployment Script
# This script deploys the complete student assistance system using DREX

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Main deployment function
main() {
    print_header "🚀 DREX + TCC Student Assistance Deployment"
    print_header "=============================================="
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found. Please run this script from the monorepo root."
        exit 1
    fi
    
    print_status "Starting deployment process..."
    
    # Step 1: Clean up any existing containers
    print_header "\n🧹 Step 1: Cleaning up existing containers"
    print_status "Stopping and removing existing containers..."
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    print_success "Cleanup completed"
    
    # Step 2: Build and start services
    print_header "\n🏗️ Step 2: Building and starting services"
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    print_status "Starting Besu node..."
    docker-compose up -d besu-node
    
    # Step 3: Wait for Besu to be ready
    print_header "\n⏳ Step 3: Waiting for Besu node to be ready"
    print_status "Waiting for Besu node health check..."
    
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps besu-node | grep -q "healthy"; then
            print_success "Besu node is ready!"
            break
        fi
        
        attempt=$((attempt + 1))
        print_status "Attempt $attempt/$max_attempts - Waiting for Besu node..."
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Besu node failed to start within expected time"
        print_status "Checking Besu logs..."
        docker-compose logs besu-node
        exit 1
    fi
    
    # Step 4: Deploy contracts
    print_header "\n📄 Step 4: Deploying DREX + Student Assistance contracts"
    print_status "Starting integrated deployment..."
    docker-compose up -d integrated-deployer
    
    # Step 5: Monitor deployment
    print_header "\n📊 Step 5: Monitoring deployment progress"
    print_status "Following deployment logs..."
    
    # Follow logs until deployment is complete
    timeout=300  # 5 minutes timeout
    start_time=$(date +%s)
    
    while true; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_error "Deployment timeout after 5 minutes"
            docker-compose logs integrated-deployer
            exit 1
        fi
        
        # Check if deployment completed successfully
        if docker-compose logs integrated-deployer 2>/dev/null | grep -q "Deploy integrado concluído com sucesso"; then
            print_success "Deployment completed successfully!"
            break
        fi
        
        # Check for errors
        if docker-compose logs integrated-deployer 2>/dev/null | grep -q "ERROR\|Failed\|Error"; then
            print_error "Deployment failed. Check logs below:"
            docker-compose logs integrated-deployer
            exit 1
        fi
        
        sleep 5
    done
    
    # Step 6: Start Blockscout (optional)
    print_header "\n🔍 Step 6: Starting Blockscout explorer"
    print_status "Starting PostgreSQL database..."
    docker-compose up -d postgres
    
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    print_status "Starting Blockscout explorer..."
    docker-compose up -d blockscout
    
    # Step 7: Display final status
    print_header "\n✅ Deployment Summary"
    print_header "====================="
    
    print_success "🏛️  DREX Infrastructure: Deployed"
    print_success "🎓 Student Assistance System: Deployed"
    print_success "🔍 Blockscout Explorer: Starting"
    
    print_header "\n📋 Service URLs:"
    print_status "🌐 Besu RPC: http://localhost:8545"
    print_status "🔍 Blockscout Explorer: http://localhost:4000"
    print_status "🗄️  PostgreSQL: localhost:5432"
    
    print_header "\n📊 Container Status:"
    docker-compose ps
    
    print_header "\n🔧 Useful Commands:"
    print_status "View all logs: docker-compose logs -f"
    print_status "View deployment logs: docker-compose logs integrated-deployer"
    print_status "Stop all services: docker-compose down"
    print_status "Restart deployment: docker-compose restart integrated-deployer"
    
    # Step 8: Show deployment details
    print_header "\n📄 Deployment Details:"
    print_status "Extracting contract addresses..."
    
    if [ -f "packages/drex-piloto/integrated-deployment.json" ]; then
        print_success "Deployment info saved to: packages/drex-piloto/integrated-deployment.json"
        
        # Extract key information
        if command -v jq >/dev/null 2>&1; then
            print_header "\n🏛️ DREX Contracts:"
            jq -r '.drex | to_entries[] | "   \(.key): \(.value)"' packages/drex-piloto/integrated-deployment.json
            
            print_header "\n🎓 TCC Contracts:"
            jq -r '.tcc | to_entries[] | "   \(.key): \(.value)"' packages/drex-piloto/integrated-deployment.json
            
            print_header "\n👥 Test Accounts:"
            jq -r '.accounts | to_entries[] | "   \(.key): \(.value)"' packages/drex-piloto/integrated-deployment.json
        else
            print_warning "jq not installed. Install jq to see formatted contract addresses."
            print_status "Raw deployment info:"
            cat packages/drex-piloto/integrated-deployment.json
        fi
    else
        print_warning "Deployment info file not found. Check deployment logs for contract addresses."
    fi
    
    print_header "\n🎉 Student Assistance System is ready!"
    print_status "The system includes:"
    print_status "  • Official Wire Labs DREX contracts"
    print_status "  • Student registration and management"
    print_status "  • Establishment registration"
    print_status "  • Spending limits by category"
    print_status "  • Monthly allowance distribution"
    print_status "  • Real-time expense tracking"
    
    print_header "\n📚 Next Steps:"
    print_status "1. Access Blockscout at http://localhost:4000 to explore transactions"
    print_status "2. Use the contract addresses to interact with the system"
    print_status "3. Check the deployment JSON for test account details"
    print_status "4. Monitor logs with: docker-compose logs -f"
}

# Handle script interruption
cleanup() {
    print_warning "\nScript interrupted. Cleaning up..."
    docker-compose down 2>/dev/null || true
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@" 