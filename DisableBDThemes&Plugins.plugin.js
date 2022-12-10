/**
 * @name DisableBDThemes&Plugins
 * @description Toggles all active plugins and themes with a keyboard shortcut.
 * @version 0.0.1
 * @author Profezzional
 * @authorId 150015560288043009
 * @website https://github.com/profezzional/BetterDiscordStuff
 * @source https://github.com/profezzional/BetterDiscordStuff/blob/main/DisableBDThemes%26Plugins.plugin.js
 */

const { Webpack, Webpack: { Filters } } = BdApi;
const config = {
    info: {
        name: 'DisableBDThemes&Plugins',
        authors: [{
            name: 'Profezzional'
        }],
        version: '0.0.1',
        description: 'Toggles all active plugins and themes with a keyboard shortcut.'
    },
    changelog: [{
        type: 'added',
        title: 'Initial creation',
        items: ['Created the plugin']
    }],
    defaultConfig: [{
        id: 'keybind',
        type: 'keybind',
        name: 'Keybind',
        note: 'Keyboard shortcut to disable all plugins and themes that are active when it\'s pressed; pressing it again re-enables them. Does not take into account any enabling/disabling that occurs while things are disabled. Does not differentiate between left/right instances of keys, like ctrl, alt, shift, etc. Keybind must be pressed in the same order it\'s saved.',
        value: [],
    },
    {
        id: 'disablePlugins',
        type: 'switch',
        name: 'Disable Plugins',
        note: 'Whether to disable active plugins when the keyboard shortcut is pressed',
        value: true
    },
    {
        id: 'disableThemes',
        type: 'switch',
        name: 'Disable Themes',
        note: 'Whether to disable active themes when the keyboard shortcut is pressed',
        value: true
    }]
};

module.exports = !global.ZeresPluginLibrary ? class {
    constructor() {
        this._config = config;
    }

    load() {
        BdApi.showConfirmationModal('Library plugin is needed', [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
            confirmText: 'Download',
            cancelText: 'Cancel',
            onConfirm: () => {
                require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, _, body) => {
                    if (error) {
                        return require('electron').shell.openExternal('https://betterdiscord.app/Download?id=9');
                    }

                    await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
                    window.location.reload();
                });
            }
        });
    }

    start() { }

    stop() { }
} :
    (([Plugin, _]) => {
        return class DisableEverything extends Plugin {
            enabledPluginIds = [];
            enabledThemeIds = [];

            keyDownListener = null;
            keyUpListener = null;
            pressedKeyNames = [];
            keybindKeyNames = [];


            constructor() {
                super();

                this.getSettingsPanel = () => {
                    const settingsPanel = this.buildSettingsPanel();

                    settingsPanel.listeners.push(() => {
                        this.mapKeybindKeyNames(); // update mapped keybind when new shortcut is saved
                    });

                    return settingsPanel.getElement();
                }
            }

            onStart() {
                this.mapKeybindKeyNames();

                this.keyDownListener = (event) => this.onKeyDown(event);
                this.keyUpListener = (event) => this.onKeyUp(event);

                document.body.addEventListener('keydown', this.keyDownListener, true);
                document.body.addEventListener('keyup', this.keyUpListener, true);
            }

            mapKeybindKeyNames() {
                const KEY_DELIMITER_CHAR = '+';
                const keybindToString = Webpack.getModule(Filters.byStrings(`.join(\"${KEY_DELIMITER_CHAR}\")`), { searchExports: true });

                // the built-in discord keyboard listener uses OS-specific keycodes, which are different from the browser ones,
                // so can't compare with keycodes. converting to key names instead seems to work, though the one drawback is
                // that there's no differentiation between left and right keys like ctrl, shift, alt, etc.
                this.keybindKeyNames = keybindToString(this.settings.keybind)
                    .toLowerCase()
                    .replace('ctrl', 'control')
                    .split(KEY_DELIMITER_CHAR);
            }

            onStop() {
                // re-enable any disabled plugins and themes
                this.enabledPluginIds.forEach(enabledPluginId => BdApi.Plugins.enable(enabledPluginId));
                this.enabledThemeIds.forEach(enabledThemeId => BdApi.Themes.enable(enabledThemeId));

                document.body.removeEventListener('keydown', this.keyDownListener, true);
                document.body.removeEventListener('keyup', this.keyUpListener, true);
            }

            onKeyDown(event) {
                const pressedKeyName = event.key.toLowerCase();

                if (this.pressedKeyNames.includes(pressedKeyName)) {
                    return; // ignore repeat keydown events when holding a key
                }

                this.pressedKeyNames.push(pressedKeyName);

                // use index to ensure order matches
                const pressedKeysMatchKeybind = this.keybindKeyNames.every((keybindKeyName, i) => this.pressedKeyNames[i] === keybindKeyName);

                if (!pressedKeysMatchKeybind) {
                    return;
                }

                if (this.settings.disablePlugins) {
                    if (this.enabledPluginIds.length) {
                        this.enabledPluginIds.forEach(enabledPluginId => BdApi.Plugins.enable(enabledPluginId));
                        this.enabledPluginIds = [];
                    } else {
                        (this.enabledPluginIds = this.getEnabledPluginIds()).forEach(enabledPluginId => BdApi.Plugins.disable(enabledPluginId));
                    }
                }

                if (this.settings.disableThemes) {
                    if (this.enabledThemeIds.length) {
                        this.enabledThemeIds.forEach(enabledThemeId => BdApi.Themes.enable(enabledThemeId));
                        this.enabledThemeIds = [];
                    } else {
                        (this.enabledThemeIds = this.getEnabledThemeIds()).forEach(enabledThemeId => BdApi.Themes.disable(enabledThemeId));
                    }
                }
            }

            onKeyUp(event) {
                const keyNameIndex = this.pressedKeyNames.indexOf(event.key.toLowerCase());

                if (keyNameIndex >= 0) {
                    this.pressedKeyNames.splice(keyNameIndex, 1);
                }
            }

            getEnabledPluginIds() {
                return BdApi.Plugins.getAll()
                    .filter(plugin => BdApi.Plugins.isEnabled(plugin.id) && plugin.instance.constructor.name !== this.constructor.name)
                    .map(plugin => plugin.id);
            }

            getEnabledThemeIds() {
                return BdApi.Themes.getAll()
                    .filter(theme => BdApi.Themes.isEnabled(theme.id))
                    .map(theme => theme.id)
            }
        }
    })(global.ZeresPluginLibrary.buildPlugin(config));