on open location this_URL
	tell application "Finder"
		set current_path to (POSIX path of (path to me))
	end tell
	do shell script current_path & "Contents/MacOS/open-eid " & this_URL
end open location
on run argv
	tell application "Finder"
		set current_path to (POSIX path of (path to me))
	end tell
	do shell script current_path & "Contents/MacOS/open-eid " & argv
end run