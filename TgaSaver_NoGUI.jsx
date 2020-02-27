// ----------------------------------------------------------------------------------------------------------
//
//		TGA_saver tool 1.5
//
// ----------------------------------------------------------------------------------------------------------

#target photoshop

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>$$$/JavaScripts/TgaSaver_NoGUI/Menu=TgaSaver Exporter NoGUI...</name>
<about>$$$/JavaScripts/TgaSaver_NoGUI/About=TgaSaver ^rExport PSD file to TGA files ^rwith options^r2011-2013</about>
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
$.evalFile(exporterFilepath + "/Include.jsx");

// -- create window.
var dlg = new Window("dialog {fp: FlashPlayer { preferredSize: [380, 50] },}", "", undefined, {borderless:true, resizeable:false});
dlg.margins = [0,0,0,0];
dlg.center();

try
{
	dlg.fp.loadMovie(swfProgress);
}
catch(e)
{
	alert("Load swf failed: " + e);
	CloseWindow();
}

// -- callbacks.
dlg.fp.Export = ExportFiles;
dlg.fp.LoadXML = LoadXML;
dlg.fp.CloseWindow = CloseWindow;

// -- show window.
dlg.show();
