# BetterDiscordStuff
Collection of BD plugins and themes

## DisableBDPlugins&Themes
Simple toggle to quickly disable all active plugins and themes. Useful if you want to take vanilla screenshots, prevent crashes after startup, see how vanilla feels again, or compare your BD loadout to vanilla.

### NOTE:
To get the keybind setting to work, you'll have to apply the fix to ZeresPluginLibrary proposed here: https://github.com/rauenzi/BDPluginLibrary/pull/167/commits/15b2be974ccb12d908dc4a2453cc30fe94dd4d78

After bundling, that involves replacing the existing ClearableKeybind and Keybind classes in `0PluginLibrary.plugin.js`, from ZeresPluginLibrary, with the following code:
```js
class ClearableKeybind extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: this.props.defaultValue};
        this.clear = this.clear.bind(this);
    }
    clear() {
        this.setState({value: []});
        this.props.onChange([]);
    }
    render() {
        return React.createElement("div", {className: "z-keybind-wrapper"},
                    React.createElement(modules__WEBPACK_IMPORTED_MODULE_1__.DiscordModules.Keybind, {
                        disabled: this.props.disabled,
                        defaultValue: this.state.value,
                        onChange: this.props.onChange
                    }),
                    React.createElement(CloseButton, {className: "z-keybind-clear", onClick: this.clear})
                );
    }
}
/** 
 * Creates a keybind setting using discord's built in keybind recorder.
 * @memberof module:Settings=
 * @extends module:Settings.SettingField
 */
class Keybind extends _settingfield__WEBPACK_IMPORTED_MODULE_0__["default"] {
    /**
     * @param {string} name - name label of the setting 
     * @param {string} note - help/note to show underneath or above the setting
     * @param {Array<string>} value - array of key names
     * @param {callable} onChange - callback to perform on setting change, callback receives array of keycodes
     * @param {object} [options] - object of options to give to the setting
     * @param {boolean} [options.disabled=false] - should the setting be disabled
     */    
    constructor(label, help, value, onChange, options = {}) {
        const {disabled = false} = options;
        super(label, help, onChange, ClearableKeybind, {
            disabled: disabled,
            defaultValue: value,
            onChange: element => val => {
                if (!Array.isArray(val)) return;
                element.props.value = val;
                this.onChange(val);
            }
        });
    }
}
```

![image](https://user-images.githubusercontent.com/12171532/206879091-7c2ae157-cf4e-445c-8023-f00b41f9b31c.png)
