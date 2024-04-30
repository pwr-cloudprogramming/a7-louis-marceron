terraform {
  # List of the provider that Terraform will use
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.46.0"
    }
  }
}

# Configuration of provider
provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "my_vpc" {
  # The network range of the VPC
  cidr_block = "10.0.0.0/16"
  # Use amazon provided DNS servers
  # Used to resolve domain names
  enable_dns_support = true
  # Give instances a domain name
  enable_dns_hostnames = true
  tags = {
    Name        = "tictactoe_vpc"
    Terraform   = "true"
    Environment = "dev"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id     = aws_vpc.my_vpc.id
  cidr_block = "10.0.1.0/24"
  # Auto-assign public IP addresses to instances in the subnet
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  tags = {
    Name = "public_subnet"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.my_vpc.id
}

resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.my_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

resource "aws_security_group" "allow_web" {
  vpc_id = aws_vpc.my_vpc.id

  # Allow SSH access from anywhere
  ingress {
    # Ports range
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP access from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP access from anywhere to the backend and frontend
  ingress {
    from_port   = 8080
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    # From 0 to 0 means all ports
    from_port = 0
    to_port   = 0
    # -1 means all protocols
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_web_traffic"
  }
}

# Associate the route table with the subnet
resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_route_table.id
}

output "backend_url" {
  value = aws_instance.app_server.public_ip
}

resource "aws_instance" "app_server" {
  # Amazon Machine Image
  ami                    = "ami-080e1f13689e07408"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public_subnet.id
  key_name               = "vockey"
  vpc_security_group_ids = [aws_security_group.allow_web.id]
  iam_instance_profile   = "LabInstanceProfile"

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt install -y docker.io
              apt install -y awscli
              service docker start
              aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 851725339291.dkr.ecr.us-east-1.amazonaws.com
              docker pull 851725339291.dkr.ecr.us-east-1.amazonaws.com/myback:v2
              docker pull 851725339291.dkr.ecr.us-east-1.amazonaws.com/myfront:v2
              docker run --restart=unless-stopped -d -p 8080:8080 851725339291.dkr.ecr.us-east-1.amazonaws.com/myback:v2
              PUBLIC_IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
              docker run --restart=unless-stopped -d -p 8081:3000 -e PUBLIC_BACKEND_URL=$PUBLIC_IP 851725339291.dkr.ecr.us-east-1.amazonaws.com/myfront:v3
              EOF

  # Tags are metadata that you can assign to your AWS resources
  tags = {
    # Give the instance a name
    Name = "tictactoe_frontend_and_backend"
    # Indicate that this instance was created using Terraform
    Terraform = "true"
  }
}
