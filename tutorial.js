/* This file is part of Cook County Sales Map, an interactive choropleth map of Cook County Sales.
Copyright (C) 2023 Claire Wagner

Cook County Sales Map is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>. */

function initializeTutorialSteps(tutorial) {
  tutorial.addSteps([
    {
      intro: "<p>Welcome to the Cook County Sales Map, an interactive map of property sales in Cook County, Illinois.</p>" +
        "<p>The <a href='https://github.com/cw353/cook-county-sales-map'>source code</a> for this map is freely available under the <a href='http://www.gnu.org/licenses/'>GNU GPL license</a>." +
        "</p><p>Follow this tutorial to learn how to use the map.</p>"
    },
    {
      element: document.querySelector("#sample-assessor-nbhd"),
      intro: "<p>The map is divided into areas like this one that are called <b>assessor neighborhoods</b>." +
        "<p>Assessor neighborhoods are numbered geographical regions that the Cook County Assessor's Office uses for record-keeping and analysis. (Note that these areas don't necessarily correspond to named neighborhoods in Cook County.)</p>",
    },
    {
      element: document.querySelector('.control_container'),
      intro: "<p>Use this slider to <b>select the year</b> for which to view sales data.</p>"
    },
    {
      element: document.querySelector('#select-class-div'),
      intro: "<p>Use this dropdown menu to <b>select the property class</b> to show on the map.</p>" +
        "<p>(Every property in Cook County belongs to a <b>property class</b> that describes what type of property it is. See <a class='external' href='https://www.cookcountyassessor.com/form-document/codes-classification-property'>this link</a> for more information.)</p>"
    },
    {
      element: document.querySelector('#select-stat-div'),
      intro: "<p>Use this dropdown menu to <b>select the statistic</b> to show on the map.</p>" +
        "<p>The <b>colors</b> of the assessor neighborhoods will change based on the values of this statistic.</p>"
    },
    {
      element: document.querySelector('#select-nbhd-div'),
      intro: "<p>Use this dropdown menu to <b>select an assessor neighborhood</b>. The selected area will be highlighted on the map.</p>" +
        "<p>To view an <b>overall summary of all neighborhoods</b>, select the option \"All Assessor Neighborhoods\".</p>"
    },
    {
      element: document.querySelector("#sample-assessor-nbhd"),
      intro: "<p>You can also <b>select an assessor neighborhood</b> by clicking on it.</p>"
    },
    {
      element: document.querySelector("#sample-assessor-nbhd"),
      intro: "<p>If you click on that same assessor neighborhood again &ndash; or if you click somewhere else on the map &ndash; it will be <b>deselected</b>.</p>"
    },
    {
      element: document.querySelector("#info-control"),
      intro: "<p>When you <b>select an assessor neighborhood</b>, information about it will be shown here.</p>"
    },
    {
      element: document.querySelector("#info-control"),
      intro: "<p>If no neighborhood is selected, then an <b>overall summary of all assessor neighborhoods</b> will be shown instead.</p>"
    },
    {
      element: document.querySelector('#info-control-meta'),
      intro: "<p>You can find out when the data on this map was <b>last updated</b> by looking here.</p>"
    },
    {
      element: document.querySelector('#info-control-meta'),
      intro: "<p>You can also find a link to the original data from which the summary statistics were derived.</p>"
    },
    {
      element: document.querySelector('#graph-control'),
      intro: "<p>This graph plots the <b>yearly trends</b> in the selected data."
    },
    {
      element: document.querySelector('#graph-control .plot'),
      intro: "<p>Hover over points on the line(s) to see details.<b></p>"
    },
    {
      element: document.querySelector('#graph-control .plot'),
      intro: "<p>The <b>blue line</b> plots data for the <b>selected assessor neighborhood.<b></p>"
    },
    {
      element: document.querySelector('#graph-control .plot'),
      intro: "<p>If no neighborhood is selected, then the blue line will plot <b>an overall summary of all assessor neighborhoods</b> instead.</p>"
    },
    {
      element: document.querySelector('#graph-control .selectdiv'),
      intro: "<p>You can <b>add extra lines representing other assessor neighborhoods</b> to the graph by using these dropdown menus.</p>" +
        "<p>This could be useful for comparing trends in one neighborhood to trends in another neighborhood, or to the overall trend in Cook County.</p>"
    },
    {
      element: document.querySelector('#graph-control .selectdiv'),
      intro: "<p>To plot an <b>overall summary of all neighborhoods</b>, select the option \"All Assessor Neighborhoods\".</p>" +
        "<p>To <b>remove an extra line</b> from the graph entirely, select the option \"None\".</p>"
    },
    {
      element: document.querySelector('#graph-control .legend'),
      intro: "<p>The <b>legend</b> for the graph is shown here.</p>" +
        "<p>Click on a line's label to hide or show that line. Double-click the label to hide all other lines on the graph.</p>"
    },
    {
      element: document.querySelector('#graph-control .modebar'),
      intro: "<p>Use the controls in this <b>toolbar</b> to zoom in or out, pan the view, change the scale, and save the plot as an image.</p>"
    },
    {
      element: document.querySelector(".leaflet-control-geocoder"),
      intro: "<p>Use this search bar to <b>search for locations</b> on the map.</p>" +
        "<p>The search bar will give you a list of locations based on your query. Click on the one you want, and the map will zoom to show that location.</p>"
    },
    {
      element: document.querySelector(".leaflet-control-layers"),
      intro: "<p>Use this slider to adjust the <b>opacity</b> of the colors on the map.</p>" +
        "<p>You can make the colors more opaque if they're too hard to see, or more transparent if they're too hard to see through.</p>"
    },
    {
      element: document.querySelector("#legend-control"),
      intro: "<p>The <b>legend</b> for the colors on the map is shown here.</p>" +
        "<p>(The intervals are determined using the quantile classification method.)</p>"
    },
    {
      intro: "<p><b>Move around</b> on the map by clicking and dragging or by using the arrow keys on your keyboard."
    },
    {
      element: document.querySelector(".leaflet-control-zoomhome-in"),
      intro: "<p>Click this button to <b>zoom in</b> on the map.</p>",
    },
    {
      element: document.querySelector(".leaflet-control-zoomhome-out"),
      intro: "<p>Click this button to <b>zoom out</b> on the map.</p>",
    },
    {
      intro: "<p>You can also <b>zoom in and out</b> by scrolling up and down or by double-clicking the map."
    },
    {
      element: document.querySelector(".leaflet-control-zoomhome-home"),
      intro: "<p>Click this button to zoom to the map's <b>default view</b>.</p>" +
        "<p>This can be a handy way to quickly zoom to view all areas on the map at once.</p>",
    },
    {
      element: document.querySelector(".leaflet-bookmarks-control"),
      intro: "<p>Click this button to add, view, and edit <b>bookmarks</b>. Bookmarks are a handy way to mark spots on the map.</p>" +
        "<p>Your bookmarks will be saved when you exit this page and restored when you visit it again.</p>"
    },
  ]);
}