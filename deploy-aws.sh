#!/usr/bin/env bash

set -euo pipefail

# Ensure that aws is installed
if ! command -v aws &> /dev/null; then
	echo "aws CLI is required to deploy nf-shard to AWS"
	exit 1
fi

# Input environment
POSTGRES_PASSWORD=
APP_USERNAME=
APP_PASSWORD=
VPC_ID=
SUBNET_AZ1_ID=
SUBNET_AZ2_ID=
KEY_PAIR_NAME=
ACM_CERTIFICATE_ARN=
DOMAIN_NAME=
HOSTED_ZONE_ID=
ACCESS_CIDR="0.0.0.0/0"
VERSION="main"
LOG_LEVEL=INFO

while getopts "p:u:s:v:n:b:k:c:d:z:a:e:l:" opt; do
    case ${opt} in
    p )
        POSTGRES_PASSWORD="$OPTARG"
        ;;
		u )
        APP_USERNAME="$OPTARG"
        ;;
		s )
        APP_PASSWORD="$OPTARG"
        ;;
		v )
        VPC_ID="$OPTARG"
        ;;
		n )
        SUBNET_AZ1_ID="$OPTARG"
        ;;
		b )
        SUBNET_AZ2_ID="$OPTARG"
        ;;
		k )
        KEY_PAIR_NAME="$OPTARG"
        ;;
		c )
        ACM_CERTIFICATE_ARN="$OPTARG"
        ;;
		d )
        DOMAIN_NAME="$OPTARG"
        ;;
		z )
        HOSTED_ZONE_ID="$OPTARG"
        ;;
		a )
        ACCESS_CIDR="$OPTARG"
        ;;
		e )
        VERSION="$OPTARG"
        ;;
		l )
        LOG_LEVEL="$OPTARG"
        ;;
    \? )
        echo "Invalid option" 1>&2
        exit 1
        ;;
    esac
done
shift $((OPTIND -1))

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
	echo "POSTGRES_PASSWORD is required. Use -p to set it."
	exit 1
fi
if [ -z "$APP_USERNAME" ]; then
	echo "APP_USERNAME is required. Use -u to set it."
	exit 1
fi
if [ -z "$APP_PASSWORD" ]; then
	echo "APP_PASSWORD is required. Use -s to set it."
	exit 1
fi
if [ -z "$VPC_ID" ]; then
	echo "VPC_ID is required. Use -v to set it."
	exit 1
fi
if [ -z "$SUBNET_AZ1_ID" ]; then
	echo "SUBNET_AZ1_ID is required. Use -n to set it."
	exit 1
fi
if [ -z "$SUBNET_AZ2_ID" ]; then
	echo "SUBNET_AZ2_ID is required. Use -b to set it."
	exit 1
fi
if [ -z "$KEY_PAIR_NAME" ]; then
	echo "KEY_PAIR_NAME is required. Use -k to set it."
	exit 1
fi
if [ -z "$ACM_CERTIFICATE_ARN" ]; then
	echo "ACM_CERTIFICATE_ARN is required. Use -c to set it."
	exit 1
fi
if [ -z "$DOMAIN_NAME" ]; then
	echo "DOMAIN_NAME is required. Use -d to set it."
	exit 1
fi
if [ -z "$HOSTED_ZONE_ID" ]; then
	echo "HOSTED_ZONE_ID is required. Use -z to set it."
	exit 1
fi

# Setup environment
DEFAULT_ACCESS_TOKEN=$(openssl rand -hex 32 | sed -E 's/(.{16})(.{16})(.{16})(.{16})/\1-\2-\3-\4/')

# Set AWS secrets
aws ssm put-parameter --name 'nf-shard-postgres-pass' --value "$POSTGRES_PASSWORD" --type 'SecureString' --overwrite
aws ssm put-parameter --name 'nf-shard-user' --value "$APP_USERNAME" --type 'SecureString' --overwrite
aws ssm put-parameter --name 'nf-shard-pass' --value "$APP_PASSWORD" --type 'SecureString' --overwrite
aws ssm put-parameter --name 'nf-shard-access-token' --value "$DEFAULT_ACCESS_TOKEN" --type 'SecureString' --overwrite

# Deploy the stack
aws cloudformation deploy \
  --template-file deploy-aws.yaml \
  --stack-name nf-shard \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    VpcId=$VPC_ID \
    SubnetId=$SUBNET_AZ1_ID \
		SecondarySubnetId=$SUBNET_AZ2_ID \
		NfShardPortCIDR=$ACCESS_CIDR \
    KeyName=$KEY_PAIR_NAME \
		ACMCertificateArn=$ACM_CERTIFICATE_ARN \
		DomainName=$DOMAIN_NAME \
		HostedZoneId=$HOSTED_ZONE_ID \
		Version=$VERSION \
		LogLevel=$LOG_LEVEL

echo -e "\nnf-shard deployed at https://$DOMAIN_NAME\n"

echo -e "Default workspace config:"
echo -e "tower {\n  enabled = true\n  accessToken = \"${DEFAULT_ACCESS_TOKEN}\"\n  endpoint = \"https://$DOMAIN_NAME/api\"\n}\n"
echo -e "Keep the secret accessToken safe, it is used to authenticate with the nf-shard server."
