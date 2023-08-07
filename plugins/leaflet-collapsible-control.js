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

L.Control.Collapsible = L.Control.extend({
  options: {
    position: "topleft",
    containerId: "collapsible-control",
    className: "",
    headerElement: "h4",
    headerText: "Collapsible Control",
    collapsedHeaderPrefix: "&#9658; ",
    expandedHeaderPrefix: "&#9660; ",
    collapsedTitle: "Click to show contents",
    expandedTitle: "Click to hide contents",
    collapsed: false, // whether contents should be collapsed initially
    disableClickPropagation: true,
    disableScrollPropagation: true,
  },
  initialize(options) {
    L.Util.setOptions(this, options);
  },
  // can be overriden as necessary
  onAdd(map) {
    const container = L.DomUtil.create("div", "collapsible-control " + this.options.className + " container");
    container.setAttribute("id", this.options.containerId);
    if (this.options.disableClickPropagation) L.DomEvent.disableClickPropagation(container);
    if (this.options.disableScrollPropagation) L.DomEvent.disableScrollPropagation(container);
    const headerDiv = L.DomUtil.create("div", this.options.className + " header-div", container);
    this._header = $(L.DomUtil.create(this.options.headerElement, this.options.className + " header", headerDiv))
      .on("click", this._toggleContentsVisibility.bind(this));
    this._contentDiv = $(L.DomUtil.create("div", this.options.className + " contents", container));
    this._collapsed = this.options.collapsed;
    if (this._collapsed) {
      this._contentDiv.hide();
    }
    this._headerText = this.options.headerText;
    this._updateHeader();
    return container;
  },
  getContentDiv() {
    return this._contentDiv.get(0);
  },
  _updateHeader() {
    this._header
      .attr("title", this._collapsed ? this.options.collapsedTitle : this.options.expandedTitle)
      .html(
        (this._collapsed ? this.options.collapsedHeaderPrefix : this.options.expandedHeaderPrefix) +
          this._headerText
      );
  },
  updateHeaderText(text) {
    this._headerText = text;
    this._updateHeader();
  },
  _toggleContentsVisibility() {
    this._contentDiv.toggle();
    this._collapsed = !this._collapsed;
    this._updateHeader();
  }
});
L.control.collapsible = function(options) {
  return new L.Control.Collapsible(options);
}
