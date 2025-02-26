/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

// #region Settings
// config some video options 
interface IVideoSettings
{
	// auto play the video
	autoPlay: boolean;

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
}

// the  default settings for this plugin
const DEFAULT_SETTINGS: IMultimediaCollectionSettings =
{
	mySetting: 'default',
	video:
	{
		autoPlay: true,
		loop: true,
		muted: true
	},
	detail:
	{
		enableDetail: true
	}
}
// #endregion




// #region data
// The media data info; 0: originPath, 1: purePath, 2: fullPath, 3: isValid, 4: mediaFile
type MediaData = [originPath: string, purePath: string, fullPath: string,
	isValid: boolean, mediaFile: TFile | null,
	medialName: string,
	recsPath: string];
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
			let mediasData: MediaData[] = [];


			//  #region Try Get all media data from the rows
			for (let i = 0; i < rows.length; i++)
			{
				let row = rows[i];
				let mediaData: MediaData = [row, '', '', false, null, '', ''];
				// remove the white space at the beginning and end of the row
				let mediaPath = row.trim();

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
				mediaData[1] = mediaPath;

				// try load the media file 
				let mediaFile = this.app.metadataCache.getFirstLinkpathDest(mediaPath, '');
				if (mediaFile)
				{
					// save the full path
					mediaData[2] = mediaFile.path;
					mediaData[3] = true;
					mediaData[4] = mediaFile;
					mediaData[5] = mediaFile.basename;
					mediaData[6] = this.app.vault.adapter.getResourcePath(mediaData[2]);
					mediasData.push(mediaData);
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
				return `${mediasData.length} Pictures`;
			}




			let rootMediaView = el.createEl('div', { cls: 'rootMediaView' });
			let pathTemp = mediaDataCur[6];
			let currentMediaPanel = rootMediaView.createEl('div', { cls: 'currentMediaPanel' });
			let titlePanel = currentMediaPanel.createEl('div', { text: generateAllMediaInfo(), cls: 'titlePanel' });
			let mediaContainer = currentMediaPanel.createEl('div', { cls: 'mediaContainer' });

			let btnLast = mediaContainer.createEl('button', { text: '<<', cls: 'btnLast' });
			let currentMedia = mediaContainer.createEl('div', { cls: 'currentMedia' });
			let btnNext = mediaContainer.createEl('button', { text: '>>', cls: 'btnNext' });
			// show the picture
			let currentMediaImg = currentMedia.createEl('img', { attr: { src: mediaDataCur[6] } });
			// show the video
			//let currentMediaVideo = currentMedia.createEl('video', { cls: 'currentMediaVideo', attr: { controls: true, autoplay: true, muted: true, loop: true } });
			let currentMediaVideo = currentMedia.createEl('video', { cls: 'currentMediaVideo', attr: { controls: true, autoplay: this.settings.video.autoPlay, muted: this.settings.video.muted, loop: this.settings.video.loop } });
			let videoSource = currentMediaVideo.createEl('source', { attr: { src: mediaDataCur[6], type: 'video/mp4' } });
			// hide the video at first
			currentMediaVideo.style.display = 'none';




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
				// currentMediaPanel.setText(mediaDataCur[5]);
				// // refresh the media path for the img
				// pathTemp = mediaDataCur[6];
				// // refresh the img src
				// currentMediaImg.setAttribute('src', '');

				// currentMediaPanel.setText(generateIndexInfo());


				//  confirm if the media is video or not
				if (mediaDataCur[2].endsWith('.mp4'))
				{
					currentMediaImg.style.display = 'none';
					currentMediaVideo.style.display = 'block';
					videoSource.setAttribute('src', mediaDataCur[6]);

					// use the vedio settings 
					currentMediaVideo.autoplay = this.settings.video.autoPlay;
					currentMediaVideo.muted = this.settings.video.muted;
					currentMediaVideo.loop = this.settings.video.loop;

					currentMediaVideo.load();
				} else
				{
					currentMediaImg.style.display = 'block';
					currentMediaVideo.style.display = 'none';
					currentMediaImg.setAttribute('src', mediaDataCur[6]);
				}

				// currentMediaImg.setAttribute('src', pathTemp);
				// currentMediaImg.setAttribute('src', mediaDataCur[6]);




				// currentMediaImg.setAttribute('src', pathTemp);
				// currentMediaPanel.setText(mediaDataCur[5]);
				// currentMediaImg = currentMedia.createEl('img', { attr: { src: pathTemp } });

				// // 重新创建图片元素
				// currentMedia.innerHTML = ''; // 清空当前媒体内容
				// currentMediaImg = currentMedia.createEl('img', { attr: { src: pathTemp } });

				console.log(`Show media[${_indexMedia}] ${mediaDataCur[5]} fullPath[${mediaDataCur[2]}] recsPath:${pathTemp} 之前是[${indexMedia}] ${mediasData[indexMedia][5]} ${mediasData[indexMedia][6]} fullPath[${mediasData[indexMedia][2]}]`);
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
			console.log('mediasData:', mediasData);
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
		// 	}
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
		this.addSettingTab(new SampleSettingTab(this.app, this));

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

class SampleSettingTab extends PluginSettingTab
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

		// video settings
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




	}
}
// #endregion
