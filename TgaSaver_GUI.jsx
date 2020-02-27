// ----------------------------------------------------------------------------------------------------------
//
//		TGA_saver tool v.1.5
//
// ----------------------------------------------------------------------------------------------------------


#target photoshop

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>$$$/JavaScripts/TgaSaver_GUI/Menu=TgaSaver Exporter GUI...</name>
<about>$$$/JavaScripts/TgaSaver_GUI/About=TgaSaver ^rExport PSD file to TGA files ^rwith options^r2011-2013</about>
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
var dlg = new Window("dialog {fp: FlashPlayer { preferredSize: [250, 600] },}", "Tga Saver v." + TGASAVERVERSION, undefined, {borderless:false, resizeable:false});
dlg.margins = [0,0,0,0];
//dlg.frameLocation = [100, 100];

try
{
	dlg.fp.loadMovie(swfExporter);
}
catch(e)
{
	alert("Load swf failed: " + e);
	CloseWindow();
}

// -- set show handler.
dlg.onShow = function()
{		
	// -- Callbacks.
	this.fp.Export = ExportFiles;
	this.fp.LoadProjectsPath = LoadProjectsPath;
	this.fp.CreateLayersTemplate = CreateGroupFolders;
	this.fp.SetWindowSize = SetWindowSize;
	this.fp.LoadXML = LoadXML;
	this.fp.SaveXML = SaveXML;
	this.fp.CloseWindow = CloseWindow;
	this.fp.CheckConfigs = CheckConfigs;
	this.fp.CreateHelpWindow = CreateHelpWindow;
	this.fp.OpenTemplatesFile = OpenTemplatesFile;
	this.fp.Refresh = Refresh;
	
	// --
	//dlg.addEventListener ('keydown', KeyboardHandler);
	//dlg.addEventListener ('show', KeyboardHandler);
	dlg.addEventListener ('enterKey', KeyboardHandler);
	// -- отослать ивент на таб, передастся фокус на кнопку флеша
	//dlg.initUIEvent(
	//initKeyboardEvent("enterKey", true, false, dlg, );
}

// -- set close handler.
dlg.onClose = function()
{
	// -- save config.
	dlg.fp.invokePlayerFunction ("SavePanelStatus");
}

// -- show window.
dlg.show();

// ---------------------------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------------------------
function Refresh()
{
	//$.writeln("Refresh");
	//app.refresh();
	//notify("OnDraw");
	//dlg.notify("OnMove");
	//dlg.notify("OnMoving");
	//dlg.notify("OnResize");
	
	//this.fp.notify("OnChange");
	//this.fp.notify("OnChanging");
	//this.fp.notify("OnClick");
	
	//waitForRedraw();
}

function waitForRedraw()
{
	function cTID(s) { return app.charIDToTypeID(s); };
	var desc = new ActionDescriptor();
	desc.putEnumerated(cTID("Stte"), cTID("Stte"), cTID("RdCm"));
	executeAction(cTID("Wait"), desc, DialogModes.NO);
}

// ---------------------------------------------------------------------------------------------------------------------
// . Called from Flex.
// ---------------------------------------------------------------------------------------------------------------------
function CheckConfigs()
{
	// -- config files.
	var configFile = exporterFilepath + "/TgaSaver_conf.xml";
	var slotsFile = exporterFilepath + "/TgaSaver_slots.xml";
	conffile = new File( slotsFile );
	if (conffile.exists != true)
	{
		// -- check if slots file exist.
		dlg.fp.invokePlayerFunction("SaveDefaultSlotTemplates");
	}
	conffile = new File( configFile );
	if (conffile.exists != true)
	{
		// -- check if config file exist.
		dlg.fp.invokePlayerFunction("SaveDefaultConfig");
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Check keys.
// ---------------------------------------------------------------------------------------------------------------------
function KeyboardHandler(event)
{
	$.writeln("Key pressed");
	
	//if (ScriptUI.environment.keyboardState.ctrlKey == true)
	if (event.ctrlKey == true)
	{
		
	}
	if (event.keyName == "Space") //"Enter"
	{
		$.writeln("Space pressed");
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Help window. Called from Flex.
// ---------------------------------------------------------------------------------------------------------------------
function CreateHelpWindow()
{
	var res = "dialog {fp: FlashPlayer { preferredSize: [900, 700] }, }";
	
	var help = new Window(res, "Help", undefined, {borderless:false, resizeable:false});
	
	try
	{
		help.fp.loadMovie(swfHelp);
	}
	catch(e)
	{
		alert("Load swf failed: " + e);
		CloseHelpWindow();
	}
	
	help.onShow = function()
	{
		help.fp.CloseHelpWindow = CloseHelpWindow;
		
		help.size = {width:900, height:700};
		help.fp.location = {x:0, y:0};
		help.fp.bounds = {x:0, y:0, width:900, height: 700};
		//help.OkBtn = help.add("button", undefined, "Ok");
	}
	
	help.show();
	help.center();
	
	function CloseHelpWindow()
	{
		help.close();
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Open xml file with appropriate application. Called from Flex.
// ---------------------------------------------------------------------------------------------------------------------
function OpenTemplatesFile(fileName)
{
	var f = new File(exporterFilepath + "/" + fileName);
	f.execute();
	// -- close.
	CloseWindow();
}
