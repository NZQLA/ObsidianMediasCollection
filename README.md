# MultiMediaCollection
You can preview some pictures / videos in the note , just like the following easy way:
```medias
![[XXXXX.png]]
![[XXXXX.mp4]]
![[XXXXX.jpg]]
...
yyyy.png
...
zzz.mp4
```

# Why I create this plugin
I like use `![[xxxx.png]]`  /`![[xxxx.mp4]]`  to preview the picture  or videos  in the note, but some times , I want to preview some pictures or videos in one panel ! Not one by one ordering by the vertical , because I Can't say them without scroll the page. 
Then I Find some plugins can do it , but they are not so good for me , so I create this plugin to do it.
- [LiteGallery](https://github.com/jpoles1/obsidian-litegal) It's a good plugin ,It's exactly what I thought , but must set folder , like `![[../../XXX.png]]` will  cause error , can not find the file ! 
- [MediaCompanion](https://github.com/Nick-de-Bruin/obsidian-media-companion) like a photos gallery , it's so good , but it will  show all the pictures in target folder ! I just want to show some pictures in the note , not all the pictures in the folder.


> [!IMPORTANT]
> I just a beginner of obsidian plugin development, so the plugin may have some bugs, if you find some bugs, please tell me, I will fix it as soon as possible. Thanks for your support.
> And C# is my main language, also a beingner of html , css , ts , js ... , ah , so, the code may be not so good, if you have some advice, please tell me, I will appreciate it.


> [!WARNING]
> The video file should be  endwith `.mp4` 

## Some Features
### Show notes at the bottom for any media you want 
- Just add note behind the media path with `//` , 
- If you want show the note at multiple lines  , just  use `<br>` / `\n` at the end of the line.
- In fact , the note you add will be show at html, so you can use any html code you want ! And  you can use some content edit plugin auto add the html code
    - [Editing ToolBar](https://github.com/PKM-er/obsidian-editing-toolbar) 
	- [Text Format](https://github.com/Benature/obsidian-text-format)
	- ...
- You Can Disable the note by setting the plugin setting at any time without delete the note or restart the obsidian.
```md
	```medias
	[[xxxx.png]] // This is a picture I took yesterday \n I like it so much
	[[xxxx.mp4]] // This is a video I took yesterday \n I like it so much
	```
```
- For the video , you can skip the time you want easy by add some  timespan int the note, just like 
```md
[[../xxx/AAA.mp4]]\\00:00:15 XXXXXXXX /n 01:30:06 something you wang say at this time  
```
> [!tip] 
if you want the video paused after skip to the time you want , just open the option in the plugin settings under video


## Funding URL
You can find me at [GitHub](https://github.com/NZQLA)



