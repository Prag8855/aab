echo "Listing images linked in content..."
in_use=$(grep -orh "\/images\/[^\"\'\) ]*" content | sort -u)
echo "Listing images in /images..."
all_images=$(find content/images -type f | cut -c8- | sort -u)

grep -F -x -v -f <(echo "$in_use") <(echo "$all_images")