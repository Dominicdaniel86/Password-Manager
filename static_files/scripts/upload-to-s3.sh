# usage: bash upload-to-s3.sh <./yourfile>

bucket_name="project-s3-bucket-jtu6y7q8iu"
file_path="$1"

# Print error and exit if file path is not provided
if [[ -z "$file_path" ]]; then
    echo "Error: File path is required."
    echo "Usage: bash ./scripts/upload-to-s3.sh <./yourfile>"
    exit 1
fi

aws s3 cp "$file_path" s3://$bucket_name/