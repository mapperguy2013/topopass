data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_subnet" "selected_public" {
  count = local.create_network ? 0 : 1

  id = var.public_subnet_id
}

resource "aws_vpc" "this" {
  count = local.create_network ? 1 : 0

  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "this" {
  count = local.create_network ? 1 : 0

  vpc_id = aws_vpc.this[0].id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_subnet" "public" {
  count = local.create_network ? 1 : 0

  vpc_id                  = aws_vpc.this[0].id
  cidr_block              = var.public_subnet_cidr_block
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-subnet"
  }
}

resource "aws_route_table" "public" {
  count = local.create_network ? 1 : 0

  vpc_id = aws_vpc.this[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this[0].id
  }

  tags = {
    Name = "${local.name_prefix}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = local.create_network ? 1 : 0

  subnet_id      = aws_subnet.public[0].id
  route_table_id = aws_route_table.public[0].id
}

locals {
  vpc_id                          = local.create_network ? aws_vpc.this[0].id : var.vpc_id
  public_subnet_id                = local.create_network ? aws_subnet.public[0].id : var.public_subnet_id
  public_subnet_availability_zone = local.create_network ? aws_subnet.public[0].availability_zone : data.aws_subnet.selected_public[0].availability_zone
}
