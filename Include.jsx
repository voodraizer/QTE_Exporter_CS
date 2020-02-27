// ----------------------------------------------------------------------------------------------------------
//
//		TGA_saver tool 1.5
//
// ----------------------------------------------------------------------------------------------------------

#target photoshop

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

// END__HARVEST_EXCEPTION_ZSTRING

*/

// -- exporter version (d - debug).
// If version consist <d> some paths look into sdk folders.
const TGASAVERVERSION = "1.5d";


//$.level = 0;	// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
//debugger; 	// launch debugger on next line

var exporterFilename = new File($.fileName);
var exporterFilepath = exporterFilename.parent;

// -- evaluate file.
$.evalFile(exporterFilepath + "/TgaSaver.jsx");

// -- check for debug version.
//var isDebug = (ScriptUI.version.search("d") != -1) ? true : false;
var isExporterDebug = (TGASAVERVERSION.search("d") != -1) ? true : false;

// -- swf gui file.
if (isExporterDebug)
{
	// -- debug version.
	var swfExporter = new File(exporterFilepath + "/sdk/FD_project/bin-release/TgaSaver.swf");
	var swfHelp = new File(exporterFilepath + "/sdk/FD_project/bin-release/TgaSaver_help.swf");
	var swfProgress = new File(exporterFilepath + "/sdk/FD_project/bin-release/TgaSaver_progressbar.swf");
}
else
{
	// -- release version.
	var swfExporter = new File(exporterFilepath + "/swf/TgaSaver.swf");
	var swfHelp = new File(exporterFilepath + "/swf/TgaSaver_help.swf");
	var swfProgress = new File(exporterFilepath + "/swf/TgaSaver_progressbar.swf");
}

// -- multiplatform.
var isWin = (File.fs == "Windows");
