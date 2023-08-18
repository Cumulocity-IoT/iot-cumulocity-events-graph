# IoT Cumulocity Events Graph package

## Events Graph widget plugin
Show event occurence in a timeline chart, using echarts profiling example approach (see https://echarts.apache.org/examples/en/editor.html?c=custom-profile). For the different texts a color can be chosen. (Currently only works in a device dashboard!)

## Features
Shows "duration" of every event by assuming that a state is finished once the next state starts - an event always ends with the submission of the next event. The chart shows a view of the past x hours and helps visualizing the state changes for a specific event type. 

* choose color for different states
* select timeframe (max. 24 hours in the past)
* states can be deselected in the legend
* chart is zoomable

## Sample images

Easily check which events occured when
![alt Events graph example](/docs/screenshot.png)


The chart can be zoomed
![alt Show zoom capability](/docs/zoom-example.gif)

Interactive legend
![alt Show legend interaction](/docs/legend-example.gif)

## Limitations
* only works for single devices
* only works for single event type, visualising the different event texts as bars
* no realtime
* no dashboard date integration

## Versions
2.0.0 - WebSDK v. 1017

**How to start**
Change the target tenant and application you want to run this plugin on in the `package.json`.

```
c8ycli server -u https://{{your-tenant}}.cumulocity.com/ --shell {{cockpit}}
```
Keep in mind that this plugin needs to have an app (e.g. cockpit) running with at least the same version as this plugin. if your tenant contains an older version, use the c8ycli to create a cockpit clone running with at least v 1017! Upload this clone to the target tenant and reference this name in the --shell command.

The widget plugin can be locally tested via the start script:

```
npm start
```

In the Module Federation terminology, `widget` plugin is called `remote` and the `cokpit` is called `shell`. Modules provided by this `widget` will be loaded by the `cockpit` application at the runtime. This plugin provides a basic custom widget that can be accessed through the `Add widget` menu.

> Note that the `--shell` flag creates a proxy to the cockpit application and provides` LayeredMapWidgetModule` as an `remote` via URL options.

Also deploying needs no special handling and can be simply done via `npm run deploy`. As soon as the application has exports it will be uploaded as a plugin.

------------------------------
These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.
_____________________
For more information you can Ask a Question in the [Tech Community Forums](https://tech.forums.softwareag.com/tags/c/forum/1/Cumulocity-IoT).

You can find additional information in the [Software AG Tech Community](https://tech.forums.softwareag.com/tag/Cumulocity-IoT).
