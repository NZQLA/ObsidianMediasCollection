/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

// #region Settings

interface ILogSettings
{
	LogIfLoadFileFailed: boolean,
	ShowAllFilesLoaded: boolean,
}


// config some video options 
interface IVideoSettings
{
	// auto play the video
	autoPlay: boolean;

	// pause the video after skip
	pausePlayAfterSkip: boolean;

	// loop the video
	loop: boolean;

	// muted the video
	muted: boolean;
}

// settints for the media detail 
interface IMediaDetailSettings
{
	// show the detail of the media or not
	enableDetail: boolean;
}

// all the settings for this plugin
interface IMultimediaCollectionSettings
{
	mySetting: string;
	video: IVideoSettings;
	detail: IMediaDetailSettings;
	log: ILogSettings;
}

// the  default settings for this plugin
const DEFAULT_SETTINGS: IMultimediaCollectionSettings =
{
	mySetting: 'default',

	video:
	{
		autoPlay: true,
		pausePlayAfterSkip: false,
		loop: true,
		muted: true
	},

	detail:
	{
		enableDetail: true
	},

	log:
	{
		LogIfLoadFileFailed: true,
		ShowAllFilesLoaded: false
	}
}
// #endregion




// #region data
// The media data info; 0: originPath, 1: mediaType, 2: purePath, 3: fullPath, 4: isValid, 5: mediaFile
// The media data info; 0: originPath, 1: mediaType, 2: purePath, 3: fullPath, 4: isValid, 5: mediaFile
interface IMediaData
{
	// The original path of the media
	originPath: string;
	// The type of the media
	mediaType: MediaType;
	// The pure path of the media
	purePath: string;
	// The full path of the media
	path: string;
	// Whether the media is valid
	isValid: boolean;
	// The media file
	mediaFile: TFile | null;
	// The name of the media
	Name: string;
	// The path to the media resources
	recsPath: string;
	// The detailed information of the media
	detailInfo: string;
}


// the media type
enum MediaType
{
	UnKnown,
	Image,
	Video,
	Audio
}


// #endregion



// #region Plugin MultimediaCollectionPlugin
export default class MultimediaCollectionPlugin extends Plugin
{
	settings: IMultimediaCollectionSettings;

	async onload()
	{
		await this.loadSettings();
		console.log('on Loading Multimedia Collection Plugin');

		this.registerMarkdownCodeBlockProcessor('medias', (source, el, ctx) =>
		{
			// cached the current  media index  in the view
			let indexMedia = 0;

			// Split the source into rows ， and only leave the rows that are not empty
			const rows = source.split('\n').filter((row) => row.length > 0);

			// all the medias info from the rows, some one  maybe not valid !
			let mediasData: IMediaData[] = [];


			// convert the newlines to html , 'AAA\n'BB --> 'AAA<br>BB'
			const convertNewlinesToHtml = (text: string): string =>
			{
				text = text.replace(/\\n/g, '\n');
				return text.replace(/\n/g, '<br>');
			}

			// Convert video timestamps into clickable links
			// Convert video timestamps into clickable links
			const convertVideoTimeSpans = (text: string): string =>
			{
				return text.replace(/(\d{1,2}:\d{2}:\d{2})/g, (match) =>
				{
					const parts = match.split(':');
					const seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
					return `<a href="#" class="video-timestamp" data-time="${seconds}">${match}</a>`;
				});
			};

			// Register click event for video timestamps
			this.registerDomEvent(document, 'click', (evt: MouseEvent) =>
			{
				const target = evt.target as HTMLElement;
				if (target && target.classList.contains('video-timestamp'))
				{
					evt.preventDefault();
					const time = parseInt(target.getAttribute('data-time') || '0');
					const videoElement = document.querySelector('video.currentMediaVideo') as HTMLVideoElement;
					if (videoElement)
					{
						videoElement.currentTime = time;
						if (this.settings.video.pausePlayAfterSkip)
						{
							videoElement.pause();
						}
						else
						{
							videoElement.play();
						}
					}
				}
			});


			//  #region Try Get all media data from the rows
			for (let i = 0; i < rows.length; i++)
			{
				let originMediaInfo = rows[i].trim();
				//let mediaData: IMediaData = [originMediaInfo, MediaType.UnKnown, '', '', false, null, '', '', ''];
				let mediaData: IMediaData = {
					originPath: originMediaInfo,
					mediaType: MediaType.UnKnown,
					purePath: '',
					path: '',
					isValid: false,
					mediaFile: null,
					Name: '',
					recsPath: '',
					detailInfo: ''
				};
				// remove the white space at the beginning and end of the row
				let mediaPath = originMediaInfo;
				let splitByDetail = originMediaInfo.split('//');
				if (splitByDetail.length > 1)
				{
					mediaData.detailInfo = convertNewlinesToHtml(splitByDetail[1].trim());
					//console.log(`${splitByDetail[1]}--->${mediaData.detailInfo}`);
					mediaPath = splitByDetail[0].trim();
				}

				// remove all '[' / ']' in the rows
				mediaPath = mediaPath.replace(/\[|\]/g, '');

				// remove the '!' at the beginning of the row
				mediaPath = mediaPath.replace('!', '');

				// remove all chars from the last  '|'  char
				let index = mediaPath.lastIndexOf('|');
				if (index != -1)
				{
					mediaPath = mediaPath.substring(0, index);
				}
				// save the pure path
				mediaData.purePath = mediaPath;

				// try load the media file 
				let mediaFile = this.app.metadataCache.getFirstLinkpathDest(mediaPath, '');
				if (mediaFile)
				{
					// save the full path
					mediaData.path = mediaFile.path;
					mediaData.isValid = true;
					mediaData.mediaFile = mediaFile;
					mediaData.Name = mediaFile.basename;
					mediaData.recsPath = this.app.vault.adapter.getResourcePath(mediaData.path);

					// get the media type
					let mediaType = MediaType.UnKnown;
					if (mediaData.mediaFile.extension.endsWith('.png') || mediaData.mediaFile.extension.endsWith('.jpg') || mediaData.mediaFile.extension.endsWith('.gif') || mediaData.mediaFile.extension.endsWith('.jpeg'))
					{
						mediaType = MediaType.Image;
					}
					else if (mediaData.mediaFile.extension.endsWith('.mp4'))
					{
						mediaType = MediaType.Video;
					}
					else if (mediaData.mediaFile.extension.endsWith('.mp3'))
					{
						mediaType = MediaType.Audio;
					}

					mediaData.mediaType = mediaType;
					if (mediaData.mediaType == MediaType.Video)
					{
						mediaData.detailInfo = convertVideoTimeSpans(mediaData.detailInfo);
					}

					mediasData.push(mediaData);
				}
				else
				{
					if (this.settings.log.LogIfLoadFileFailed)
					{
						console.log(`Load File Failed:${mediaPath} originPath:${mediaData.originPath}!!!!!!!`);
					}
				}


			}
			// #endregion




			// get the current media data
			// indexMedia = mediasData.length - 1;
			let mediaDataCur = mediasData[indexMedia];

			// generate the current media process info
			const generateIndexInfo = (): string =>
			{
				return `${indexMedia + 1}/${mediasData.length}`;
			}

			// generate the current media process info
			const generateAllMediaInfo = (): string =>
			{
				return `${mediasData.length} Medias`;
			}


			// play the video at giving time
			const jumpToTime = (videoElement: HTMLVideoElement, time: number) =>
			{
				videoElement.currentTime = time;
				videoElement.play();
			};





			let rootMediaView = el.createEl('div', { cls: 'rootMediaView' });
			let pathTemp = mediaDataCur.recsPath;
			let currentMediaPanel = rootMediaView.createEl('div', { cls: 'currentMediaPanel' });
			let titlePanel = currentMediaPanel.createEl('div', { cls: 'titlePanel' });
			let mediaContainer = currentMediaPanel.createEl('div', { cls: 'mediaContainer' });

			let btnLast = mediaContainer.createEl('button', { text: '<<', cls: 'btnLast' });
			let currentMedia = mediaContainer.createEl('div', { cls: 'currentMedia' });
			let btnNext = mediaContainer.createEl('button', { text: '>>', cls: 'btnNext' });
			// show the picture
			let currentMediaImg = currentMedia.createEl('img', { attr: { src: mediaDataCur.recsPath } });
			// show the video
			//let currentMediaVideo = currentMedia.createEl('video', { cls: 'currentMediaVideo', attr: { controls: true, autoplay: true, muted: true, loop: true } });
			let currentMediaVideo = currentMedia.createEl('video', { cls: 'currentMediaVideo', attr: { controls: true, autoplay: this.settings.video.autoPlay, muted: this.settings.video.muted, loop: this.settings.video.loop } });
			let videoSource = currentMediaVideo.createEl('source', { attr: { src: mediaDataCur.recsPath, type: 'video/mp4' } });
			// hide the video at first
			currentMediaVideo.style.display = 'none';
			// add details info panel , will show the details of the media, such as note of this media
			let detailPanel = rootMediaView.createEl('div', { cls: 'detailPanel' });




			// show the media  at giving index
			const showMediaAtIndex = (_indexMedia: number) =>
			{
				if (_indexMedia < 0 || _indexMedia >= mediasData.length)
				{
					return;
				}

				// // refresh the media data current 
				mediaDataCur = mediasData[_indexMedia];
				// // refresh the media title 
				// currentMediaPanel.setText(mediaDataCur[6]);
				// // refresh the media path for the img
				// pathTemp = mediaDataCur.recsPath;
				// // refresh the img src
				// currentMediaImg.setAttribute('src', '');

				// currentMediaPanel.setText(generateIndexInfo());


				//  confirm if the media is video or not
				if (mediaDataCur.path.endsWith('.mp4'))
				{
					currentMediaImg.style.display = 'none';
					currentMediaVideo.style.display = 'block';
					videoSource.setAttribute('src', mediaDataCur.recsPath);

					// use the vedio settings 
					currentMediaVideo.autoplay = this.settings.video.autoPlay;
					currentMediaVideo.muted = this.settings.video.muted;
					currentMediaVideo.loop = this.settings.video.loop;

					currentMediaVideo.load();
				} else
				{
					currentMediaImg.style.display = 'block';
					currentMediaVideo.style.display = 'none';
					currentMediaImg.setAttribute('src', mediaDataCur.recsPath);
				}

				titlePanel.setText(`[${mediaDataCur.Name}] <${indexMedia}/${mediasData.length}>`);

				// show the detail of the media
				if (this.settings.detail.enableDetail)
				{
					detailPanel.style.display = 'block';
					//detailPanel.setText(`name:${mediaDataCur[6]}\nPathFull:${mediaDataCur.recsPath}`);
					//detailPanel.setText(`${mediaDataCur[8]}`);
					detailPanel.innerHTML = `${mediaDataCur.detailInfo}`;
				}
				else
				{
					detailPanel.style.display = 'none';
				}

				// currentMediaImg.setAttribute('src', pathTemp);
				// currentMediaImg.setAttribute('src', mediaDataCur.recsPath);




				// currentMediaImg.setAttribute('src', pathTemp);
				// currentMediaPanel.setText(mediaDataCur[6]);
				// currentMediaImg = currentMedia.createEl('img', { attr: { src: pathTemp } });

				// // 重新创建图片元素
				// currentMedia.innerHTML = ''; // 清空当前媒体内容
				// currentMediaImg = currentMedia.createEl('img', { attr: { src: pathTemp } });

				//console.log(`Show media[${_indexMedia}] ${mediaDataCur.Name} fullPath[${mediaDataCur.path}] recsPath:${pathTemp} 之前是[${indexMedia}] ${mediasData[indexMedia].Name} ${mediasData[indexMedia].recsPath} fullPath[${mediasData[indexMedia].path}]`);

				// refresh the indexMedia
				indexMedia = _indexMedia;
			};

			// refresh the media panel
			const refreshMediaPanel = () =>
			{
				showMediaAtIndex(indexMedia);
			}

			// refresh the media panel at first
			refreshMediaPanel();

			// Set call back for btns 
			btnLast.onclick = () =>
			{
				showMediaAtIndex(indexMedia - 1);
			};

			btnNext.onclick = () =>
			{
				showMediaAtIndex(indexMedia + 1);
			};


			// log all lines 
			if (this.settings.log.ShowAllFilesLoaded)
			{
				console.log('mediasData:', mediasData);
			}
		});


		// // This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Say Hello', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('Hello Hello!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	});
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// // This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MySettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload()
	{
		console.log('on onunload Multimedia Collection Plugin');
	}

	async loadSettings()
	{
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings()
	{
		await this.saveData(this.settings);
	}
}
// #endregion



// #region others

class SampleModal extends Modal
{
	constructor(app: App)
	{
		super(app);
	}

	onOpen()
	{
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose()
	{
		const { contentEl } = this;
		contentEl.empty();
	}
}

// the setting tab for this plugin
class MySettingTab extends PluginSettingTab
{
	plugin: MultimediaCollectionPlugin;

	constructor(app: App, plugin: MultimediaCollectionPlugin)
	{
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void
	{
		const { containerEl } = this;
		containerEl.empty();


		//new Setting(containerEl)
		//	.setName('MultimediaCollectionSettings')
		//	.setDesc('It\'s a secret')
		//	.addText(text => text
		//		.setPlaceholder('Enter your secret')
		//		.setValue(this.plugin.settings.mySetting)
		//		.onChange(async (value) =>
		//		{
		//			this.plugin.settings.mySetting = value;
		//			await this.plugin.saveSettings();
		//		}));



		new Setting(containerEl)
			.setName('MultimediaCollectionSettings')
			.setHeading();

		// #region video settings
		new Setting(containerEl).setName("Video").setHeading();
		new Setting(containerEl)
			.setName('Auto Play')
			.setDesc('Auto play the video')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.video.autoPlay)
					.onChange(async (value) =>
					{
						this.plugin.settings.video.autoPlay = value;
						await this.plugin.saveSettings();
					});
			});



		new Setting(containerEl)
			.setName('Pause after skip')
			.setDesc('Open it  , If you want to see the frame of the timestamp!')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.video.pausePlayAfterSkip)
					.onChange(async (value) =>
					{
						this.plugin.settings.video.pausePlayAfterSkip = value;
						await this.plugin.saveSettings();
					});
			});



		new Setting(containerEl)
			.setName('Loop')
			.setDesc('Loop the video')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.video.loop)
					.onChange(async (value) =>
					{
						this.plugin.settings.video.loop = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Muted')
			.setDesc('Muted the video')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.video.muted)
					.onChange(async (value) =>
					{
						this.plugin.settings.video.muted = value;
						await this.plugin.saveSettings();
					});
			});
		// #endregion

		// detail settings
		new Setting(containerEl).setName("Detail").setHeading();
		new Setting(containerEl)
			.setName('Enable Detail')
			.setDesc('Show the detail of the media or not')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.detail.enableDetail)
					.onChange(async (value) =>
					{
						this.plugin.settings.detail.enableDetail = value;
						await this.plugin.saveSettings();
					});
			});


		// Log
		new Setting(containerEl).setName("Log").setHeading();
		new Setting(containerEl)
			.setName('Log If Load File Failed')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.log.LogIfLoadFileFailed)
					.onChange(async (value) =>
					{
						this.plugin.settings.log.LogIfLoadFileFailed = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Show All Files Loaded')
			.addToggle((toggle) =>
			{
				toggle.setValue(this.plugin.settings.log.ShowAllFilesLoaded)
					.onChange(async (value) =>
					{
						this.plugin.settings.log.ShowAllFilesLoaded = value;
						await this.plugin.saveSettings();
					});
			});



	}
}
// #endregion
