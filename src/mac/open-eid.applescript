on open location this_URL
	tell application "System Events"
		set frontmostProcess to first process where it is frontmost
		set visible of frontmostProcess to false
		repeat while (frontmostProcess is frontmost)
			delay 0.2
		end repeat
		set secondFrontmost to name of first process where it is frontmost
		#set secondFrontmost to (POSIX path of (application file of first process where it is frontmost))
		set frontmost of frontmostProcess to true
		#set appPath to (POSIX path of (application file of application process secondFrontmost))
	end tell
	tell application "Finder"
		set current_path to (POSIX path of (path to me))
	end tell
	if secondFrontmost is "Safari" then
		tell front window of application "Safari"
			set currentTab to index of current tab
		end tell
	end if
	if secondFrontmost is "Google Chrome" then
		tell application "Google Chrome"
			make new window
			activate
		end tell
	end if
	do shell script current_path & "Contents/MacOS/open-eid " & this_URL & " \"" & secondFrontmost & "\""
	if secondFrontmost is "Safari" then
		tell front window of application "Safari"
			delay 2
			set current tab to tab currentTab
		end tell
	end if
end open location
on run argv
	tell application "Finder"
		set current_path to (POSIX path of (path to me))
	end tell
	do shell script current_path & "Contents/MacOS/open-eid " & argv
end run