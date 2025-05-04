#!/bin/bash

echo "Picture Frame Update Script"
echo "This script will update the codebase from git without overwriting your uploads"

# Step 1: Make a backup of the uploads folder
echo "Step 1: Backing up uploads folder..."
mkdir -p /tmp/pictureframe_backup
cp -r ./public/uploads /tmp/pictureframe_backup/
echo "Backup created at /tmp/pictureframe_backup/uploads"

# Step 2: Check for any local changes that need to be preserved
echo "Step 2: Checking for local changes..."
git status

# Prompt the user if they want to continue
read -p "Continue with update? This will reset any local changes. [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Update aborted."
    exit 1
fi

# Step 3: Save list of currently installed npm packages (in case of custom additions)
echo "Step 3: Saving list of currently installed npm packages..."
npm list --depth=0 > /tmp/pictureframe_backup/npm_packages.txt
echo "Package list saved to /tmp/pictureframe_backup/npm_packages.txt"

# Step 4: Fetch the latest changes from git
echo "Step 4: Fetching latest changes from git..."
git fetch origin

# Step 5: Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Step 6: Stash any local changes (just in case)
echo "Step 6: Stashing any local changes..."
git stash

# Step 7: Update the code from the remote repository
echo "Step 7: Updating code from remote repository..."
git reset --hard origin/$CURRENT_BRANCH

# Step 8: Restore the uploads folder from backup
echo "Step 8: Restoring uploads folder from backup..."
rm -rf ./public/uploads
cp -r /tmp/pictureframe_backup/uploads ./public/
echo "Uploads folder restored"

# Step 9: Install any updated dependencies
echo "Step 9: Installing dependencies..."
npm install

# Step 10: Rebuild the application
echo "Step 10: Rebuilding the application..."
./build.sh

echo "Update completed successfully!"
echo "Your uploads have been preserved."
echo "If you need to restore the backup, it's available at /tmp/pictureframe_backup/uploads"
echo "A list of your previously installed npm packages is at /tmp/pictureframe_backup/npm_packages.txt"