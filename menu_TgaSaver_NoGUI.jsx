
#target photoshop

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>$$$/JavaScripts/TgaSaver_NoGUI/Menu=TgaSaver Exporter NoGUI...</name>
<about>$$$/JavaScripts/TgaSaver_NoGUI/About=</about>
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
$.evalFile(exporterFilepath + "/TgaSaver_NoGUI.jsx");