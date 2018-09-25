#!/bin/sh

cd "`dirname $0`"
cd ..
cd release
r=`cat ../src/RELEASE`
r=`echo $r + 1 | bc`
v=`cat ../src/VERSION`
v=`echo "x=$v; if($r > 10) x=x + 0.1; if(x < 1) print 0; x" | bc`
/bin/echo -n "$r " >../src/RELEASE
/bin/echo -n "$v " >../src/VERSION
git tag -a v$v.$r -m "Releasing version v$v.$r"
git push origin --tags
#https://github.community/t5/How-to-use-Git-and-GitHub/How-to-create-full-release-from-command-line-not-just-a-tag/td-p/6895
token=`cat ../build/GITHUB_TOKEN`
version="v$v.$r"
text="Releasing version v$v.$r\n\nOpen-eID.exe for Windows (download and run once)\nOpen-eID.dmg for Mac (download, copy to Applications and run once)"
branch=$(git rev-parse --abbrev-ref HEAD)
repo_full_name=$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///;s/.git$//')
generate_post_data()
{
  cat <<EOF
{
  "tag_name": "$version",
  "target_commitish": "$branch",
  "name": "$version",
  "body": "$text",
  "draft": false,
  "prerelease": true
}
EOF
}
echo "Create release $version for repo: $repo_full_name branch: $branch"
response=$(curl --data "$(generate_post_data)" "https://api.github.com/repos/$repo_full_name/releases?access_token=$token")
#https://gist.github.com/stefanbuck/ce788fee19ab6eb0b4447a85fc99f447
# Get ID of the release.
eval $(echo "$response" | grep -m 1 "id.:" | grep -w id | tr : = | tr -cd '[[:alnum:]]=')
[ "$id" ] || { echo "Error: Failed to get release id for tag: $tag"; echo "$response" | awk 'length($0)<100' >&2; exit 1; }
release_id="$id"
curl --data-binary @"Open-eID.exe" -H "Authorization: token $token" -H "Content-Type: application/octet-stream" "https://uploads.github.com/repos/$repo_full_name/releases/$release_id/assets?name=Open-eID.exe"
curl --data-binary @"Open-eID.dmg" -H "Authorization: token $token" -H "Content-Type: application/octet-stream" "https://uploads.github.com/repos/$repo_full_name/releases/$release_id/assets?name=Open-eID.dmg"
 