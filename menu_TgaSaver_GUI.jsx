#target photoshop

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>$$$/JavaScripts/TgaSaver_GUI/Menu=TgaSaver Exporter GUI...</name>
<about>$$$/JavaScripts/TgaSaver_GUI/About=</about>
<category>_TgaSaver</category>
<enableinfo>true</enableinfo>
<eventid></eventid>
<terminology></terminology>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING

*/

// -- evaluate include file.
var exporterFilename = new File($.fileName);
var exporterFilepath = exporterFilename.parent;
$.evalFile(exporterFilepath + "/TgaSaver_GUI.jsx");